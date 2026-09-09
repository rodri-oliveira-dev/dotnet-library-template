'use strict';

const WORKFLOW_AUTHOR = 'github-actions[bot]';
const TRACKED_SEVERITIES = new Set(['BLOCKER', 'HIGH']);
const SEVERITY_RANK = new Map([
  ['BLOCKER', 2],
  ['HIGH', 1],
]);
const SYNC_START = '<!-- sonar-sync:start -->';
const SYNC_END = '<!-- sonar-sync:end -->';
const PAGE_SIZE = 500;
const MAX_SONAR_PAGES = 100;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readConfiguration(context, core) {
  const sonarToken = requiredEnv('SONAR_TOKEN');
  core.setSecret(sonarToken);

  return {
    owner: context.repo.owner,
    repo: context.repo.repo,
    sonarHost: requiredEnv('SONAR_HOST_URL').replace(/\/+$/, ''),
    projectKey: requiredEnv('SONAR_PROJECT_KEY'),
    labelName: requiredEnv('SONAR_ISSUE_LABEL'),
    sonarToken,
  };
}

function createSonarClient({ sonarHost, sonarToken }) {
  return async function sonarGet(path, params) {
    const url = new URL(`${sonarHost}${path}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Sonar API ${path} failed with HTTP ${response.status}: ${responseBody.slice(0, 500)}`,
      );
    }

    return response.json();
  };
}

function markdownInline(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/`/g, '\\`');
}

function quoteMarkdown(value) {
  return String(value ?? 'Sem mensagem fornecida pelo Sonar.')
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
}

function componentPath(component, projectKey) {
  const prefix = `${projectKey}:`;
  return component?.startsWith(prefix)
    ? component.slice(prefix.length)
    : component ?? 'Componente não informado';
}

function encodeRepositoryPath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function managedBody(existingBody, nextManagedBody) {
  if (!existingBody) {
    return [
      nextManagedBody,
      '',
      '<!-- Anotações manuais podem ser adicionadas abaixo. Esta área é preservada pelo workflow. -->',
      '',
    ].join('\n');
  }

  const startIndex = existingBody.indexOf(SYNC_START);
  const endIndex = existingBody.indexOf(SYNC_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return existingBody;
  }

  const suffixStart = endIndex + SYNC_END.length;
  return `${existingBody.slice(0, startIndex)}${nextManagedBody}${existingBody.slice(suffixStart)}`;
}

function extractManagedSonarIssueKey(githubIssue) {
  if (githubIssue.pull_request) {
    return null;
  }

  if (githubIssue.user?.login !== WORKFLOW_AUTHOR) {
    return null;
  }

  const body = githubIssue.body ?? '';
  const startIndex = body.indexOf(SYNC_START);
  if (startIndex === -1) {
    return null;
  }

  const endIndex = body.indexOf(SYNC_END, startIndex + SYNC_START.length);
  if (endIndex === -1 || endIndex < startIndex) {
    return null;
  }

  const managedSection = body.slice(startIndex, endIndex + SYNC_END.length);
  const match = managedSection.match(/<!--\s*sonar-issue-key:([^\s>]+)\s*-->/);
  return match?.[1] ?? null;
}

function hasManagedLabel(githubIssue, labelName) {
  return (githubIssue.labels ?? []).some((label) =>
    typeof label === 'string' ? label === labelName : label?.name === labelName,
  );
}

async function ensureLabel(github, { owner, repo, labelName }) {
  try {
    await github.rest.issues.getLabel({ owner, repo, name: labelName });
    return;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  await github.rest.issues.createLabel({
    owner,
    repo,
    name: labelName,
    color: 'b60205',
    description: 'High-impact quality findings synchronized from SonarQube Cloud',
  });
}

async function fetchOpenSonarIssues(sonarGet, projectKey) {
  const sonarIssues = [];
  const rules = new Map();

  for (let page = 1; page <= MAX_SONAR_PAGES; page += 1) {
    const response = await sonarGet('/api/issues/search', {
      componentKeys: projectKey,
      issueStatuses: 'OPEN',
      impactSeverities: 'BLOCKER,HIGH',
      additionalFields: '_all',
      ps: PAGE_SIZE,
      p: page,
    });

    appendPageResults(response, sonarIssues, rules);

    if (isLastSonarPage(response, sonarIssues.length)) {
      break;
    }

    if (page === MAX_SONAR_PAGES) {
      throw new Error('Sonar issue pagination exceeded the 100-page safety limit.');
    }
  }

  return { sonarIssues, rules };
}

function appendPageResults(response, sonarIssues, rules) {
  sonarIssues.push(...(response.issues ?? []));

  for (const rule of response.rules ?? []) {
    if (rule.key) {
      rules.set(rule.key, rule);
    }
  }
}

function isLastSonarPage(response, issueCount) {
  const pageIssues = response.issues ?? [];
  const total = response.paging?.total ?? response.total ?? issueCount;
  return issueCount >= total || pageIssues.length < PAGE_SIZE;
}

function normalizeFindings(sonarIssues) {
  return sonarIssues.map((issue) => {
    const qualifyingImpacts = (issue.impacts ?? []).filter((impact) =>
      TRACKED_SEVERITIES.has(impact.severity),
    );

    if (qualifyingImpacts.length === 0) {
      throw new Error(
        `Sonar returned issue ${issue.key} for impactSeverities=BLOCKER,HIGH without a matching impacts entry.`,
      );
    }

    return { issue, qualifyingImpacts };
  });
}

async function findExistingManagedIssues(github, core, { owner, repo }) {
  const repositoryIssues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  });
  const existingBySonarKey = new Map();

  for (const githubIssue of repositoryIssues) {
    addManagedIssue(existingBySonarKey, githubIssue, core);
  }

  return existingBySonarKey;
}

function addManagedIssue(existingBySonarKey, githubIssue, core) {
  const sonarKey = extractManagedSonarIssueKey(githubIssue);
  if (!sonarKey) {
    return;
  }

  if (existingBySonarKey.has(sonarKey)) {
    core.warning(
      `Multiple workflow-managed GitHub issues reference Sonar issue ${sonarKey}. Keeping #${existingBySonarKey.get(sonarKey).number}.`,
    );
    return;
  }

  existingBySonarKey.set(sonarKey, githubIssue);
}

function selectMaxSeverity(qualifyingImpacts) {
  return qualifyingImpacts
    .map((impact) => impact.severity)
    .sort(
      (left, right) =>
        (SEVERITY_RANK.get(right) ?? 0) - (SEVERITY_RANK.get(left) ?? 0),
    )[0];
}

function collectAffectedQualities(qualifyingImpacts) {
  return [
    ...new Set(
      qualifyingImpacts
        .map((impact) => impact.softwareQuality)
        .filter(Boolean),
    ),
  ];
}

function buildRepositoryFileUrl({ owner, repo, defaultBranch, path, line }) {
  return (
    `https://github.com/${owner}/${repo}/blob/` +
    `${encodeURIComponent(defaultBranch)}/${encodeRepositoryPath(path)}` +
    `${line ? `#L${line}` : ''}`
  );
}

function buildSonarLinks(issue, { sonarHost, projectKey }) {
  return {
    sonarIssueUrl:
      `${sonarHost}/project/issues?open=${encodeURIComponent(issue.key)}` +
      `&id=${encodeURIComponent(projectKey)}`,
    sonarRuleUrl:
      `${sonarHost}/coding_rules?open=${encodeURIComponent(issue.rule)}` +
      `&rule_key=${encodeURIComponent(issue.rule)}`,
    projectIssuesUrl:
      `${sonarHost}/project/issues?impactSeverities=BLOCKER%2CHIGH` +
      `&issueStatuses=OPEN&id=${encodeURIComponent(projectKey)}`,
  };
}

function buildPrimaryLocation(issue, config, defaultBranch) {
  const path = componentPath(issue.component, config.projectKey);
  const line = issue.line ?? issue.textRange?.startLine ?? null;
  const endLine = issue.textRange?.endLine ?? line;
  const locationLabel = line
    ? `${path}:${line}${endLine && endLine !== line ? `-${endLine}` : ''}`
    : path;

  return {
    locationLabel,
    fileUrl: buildRepositoryFileUrl({
      owner: config.owner,
      repo: config.repo,
      defaultBranch,
      path,
      line,
    }),
  };
}

function buildRelatedLocations(issue, config, defaultBranch) {
  return (issue.flows ?? [])
    .flatMap((flow) => flow.locations ?? [])
    .slice(0, 5)
    .map((location) => renderRelatedLocation(location, config, defaultBranch));
}

function renderRelatedLocation(location, config, defaultBranch) {
  const relatedPath = componentPath(location.component, config.projectKey);
  const relatedLine = location.textRange?.startLine ?? null;
  const relatedFileUrl = buildRepositoryFileUrl({
    owner: config.owner,
    repo: config.repo,
    defaultBranch,
    path: relatedPath,
    line: relatedLine,
  });
  const relatedLabel = relatedLine ? `${relatedPath}:${relatedLine}` : relatedPath;
  const relatedMessage = location.msg
    ? ` — ${markdownInline(location.msg)}`
    : '';

  return `- [\`${markdownInline(relatedLabel)}\`](${relatedFileUrl})${relatedMessage}`;
}

function formatImpacts(qualifyingImpacts) {
  return qualifyingImpacts
    .map(
      (impact) =>
        `\`${markdownInline(impact.softwareQuality ?? 'UNKNOWN')}\`: **${markdownInline(impact.severity)}**`,
    )
    .join(', ');
}

function formatAffectedQualities(affectedQualities) {
  if (affectedQualities.length === 0) {
    return 'Não informada';
  }

  return affectedQualities.map((quality) => `\`${markdownInline(quality)}\``).join(', ');
}

function formatCodeOrFallback(value, fallback) {
  return value ? `\`${markdownInline(value)}\`` : fallback;
}

function formatQuickFix(quickFixAvailable) {
  if (quickFixAvailable === true) {
    return 'Sim';
  }

  if (quickFixAvailable === false) {
    return 'Não';
  }

  return 'Não informado';
}

function formatTags(tags) {
  if ((tags ?? []).length === 0) {
    return 'Não informadas';
  }

  return tags.map((tag) => `\`${markdownInline(tag)}\``).join(', ');
}

function buildManagedLines({
  issue,
  qualifyingImpacts,
  affectedQualities,
  ruleName,
  sonarRuleUrl,
  primaryLocation,
}) {
  return [
    SYNC_START,
    `<!-- sonar-issue-key:${issue.key} -->`,
    '> Sincronizada automaticamente do SonarQube Cloud. Enquanto o finding permanecer **OPEN** com impacto **HIGH** ou **BLOCKER**, esta issue representa o mesmo problema.',
    '',
    '## Resumo',
    '',
    `- **Impacto:** ${formatImpacts(qualifyingImpacts)}`,
    `- **Qualidade afetada:** ${formatAffectedQualities(affectedQualities)}`,
    `- **Regra:** [${markdownInline(ruleName)} (\`${markdownInline(issue.rule)}\`)](${sonarRuleUrl})`,
    `- **Clean Code attribute:** ${formatCodeOrFallback(issue.cleanCodeAttribute, 'Não informado')}`,
    `- **Categoria:** ${formatCodeOrFallback(issue.cleanCodeAttributeCategory, 'Não informada')}`,
    `- **Localização:** [\`${markdownInline(primaryLocation.locationLabel)}\`](${primaryLocation.fileUrl})`,
    `- **Esforço estimado:** ${formatCodeOrFallback(issue.effort, 'Não informado')}`,
    `- **Quick fix indicado pelo Sonar:** ${formatQuickFix(issue.quickFixAvailable)}`,
    `- **Tags:** ${formatTags(issue.tags)}`,
    `- **Criada no Sonar:** ${formatCodeOrFallback(issue.creationDate, 'Não informado')}`,
    `- **Atualizada no Sonar:** ${formatCodeOrFallback(issue.updateDate, 'Não informado')}`,
    '',
    '## Diagnóstico do Sonar',
    '',
    quoteMarkdown(issue.message),
    '',
    '## Orientação para correção',
    '',
    '1. Abra o finding original no Sonar e confirme a localização primária e eventuais fluxos/localizações secundárias.',
    `2. Leia a regra **${markdownInline(ruleName)}** e identifique a causa raiz, evitando apenas silenciar o diagnóstico.`,
    '3. Aplique a menor alteração que elimine o problema sem alterar comportamento não relacionado.',
    '4. Adicione ou ajuste testes quando a correção afetar comportamento, contratos ou cenários de borda.',
    '5. Execute build e testes relevantes localmente e confirme que não surgiram regressões.',
    '6. Reexecute a análise do Sonar; o finding deve deixar de permanecer OPEN quando a correção for reconhecida.',
  ];
}

function appendRelatedLocations(managedLines, relatedLocations) {
  if (relatedLocations.length > 0) {
    managedLines.push('', '## Localizações relacionadas', '', ...relatedLocations);
  }
}

function appendLinkSection(
  managedLines,
  { sonarIssueUrl, sonarRuleUrl, projectIssuesUrl },
) {
  managedLines.push(
    '',
    '## Links',
    '',
    `- [Abrir este finding no Sonar](${sonarIssueUrl})`,
    `- [Abrir a regra no Sonar](${sonarRuleUrl})`,
    `- [Ver todos os findings HIGH/BLOCKER do projeto](${projectIssuesUrl})`,
    '',
    SYNC_END,
  );
}

function buildRenderedFinding({ issue, qualifyingImpacts }, rules, config, defaultBranch) {
  const affectedQualities = collectAffectedQualities(qualifyingImpacts);
  const rule = rules.get(issue.rule);
  const ruleName = rule?.name ?? issue.rule;
  const sonarLinks = buildSonarLinks(issue, config);
  const primaryLocation = buildPrimaryLocation(issue, config, defaultBranch);
  const relatedLocations = buildRelatedLocations(issue, config, defaultBranch);
  const managedLines = buildManagedLines({
    issue,
    qualifyingImpacts,
    affectedQualities,
    ruleName,
    sonarRuleUrl: sonarLinks.sonarRuleUrl,
    primaryLocation,
  });

  appendRelatedLocations(managedLines, relatedLocations);
  appendLinkSection(managedLines, sonarLinks);

  return {
    issue,
    managed: managedLines.join('\n'),
    title: buildTitle(selectMaxSeverity(qualifyingImpacts), affectedQualities, ruleName),
  };
}

function buildTitle(maxSeverity, affectedQualities, ruleName) {
  const qualityPrefix =
    affectedQualities.length > 0 ? `[${affectedQualities.join('/')}]` : '';
  const rawTitle = `[Sonar][${maxSeverity}]${qualityPrefix} ${ruleName}`;
  return rawTitle.length <= 240 ? rawTitle : `${rawTitle.slice(0, 237)}...`;
}

function createCounters() {
  return {
    created: 0,
    updated: 0,
    reopened: 0,
    closed: 0,
    unchanged: 0,
    labelsRestored: 0,
  };
}

async function syncFinding(github, core, rendered, existingBySonarKey, counters, config) {
  const existing = existingBySonarKey.get(rendered.issue.key);

  if (!existing) {
    await createManagedIssue(github, core, rendered, existingBySonarKey, counters, config);
    return;
  }

  await updateManagedIssue(github, rendered, existing, counters, config);
}

async function createManagedIssue(
  github,
  core,
  rendered,
  existingBySonarKey,
  counters,
  { owner, repo, labelName },
) {
  const createdIssue = await github.rest.issues.create({
    owner,
    repo,
    title: rendered.title,
    body: managedBody('', rendered.managed),
    labels: [labelName],
  });

  existingBySonarKey.set(rendered.issue.key, createdIssue.data);
  core.info(
    `Created GitHub issue #${createdIssue.data.number} for Sonar issue ${rendered.issue.key}.`,
  );
  counters.created += 1;
}

async function updateManagedIssue(
  github,
  rendered,
  existing,
  counters,
  { owner, repo, labelName },
) {
  const nextBody = managedBody(existing.body ?? '', rendered.managed);
  const needsUpdate = existing.title !== rendered.title || existing.body !== nextBody;
  const needsReopen = existing.state === 'closed';
  const hasLabel = hasManagedLabel(existing, labelName);

  await updateIssueContentIfNeeded(github, existing, rendered.title, nextBody, {
    owner,
    repo,
    needsUpdate,
    needsReopen,
  });
  await restoreManagedLabelIfNeeded(github, existing, hasLabel, counters, {
    owner,
    repo,
    labelName,
  });
  updateSyncCounters(counters, { needsUpdate, needsReopen, hasLabel });
}

async function updateIssueContentIfNeeded(
  github,
  existing,
  title,
  body,
  { owner, repo, needsUpdate, needsReopen },
) {
  if (!needsUpdate && !needsReopen) {
    return;
  }

  await github.rest.issues.update({
    owner,
    repo,
    issue_number: existing.number,
    title,
    body,
    state: needsReopen ? 'open' : undefined,
  });
}

async function restoreManagedLabelIfNeeded(
  github,
  githubIssue,
  hasLabel,
  counters,
  { owner, repo, labelName },
) {
  if (hasLabel) {
    return;
  }

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: githubIssue.number,
    labels: [labelName],
  });
  counters.labelsRestored += 1;
}

function updateSyncCounters(counters, { needsUpdate, needsReopen, hasLabel }) {
  if (needsUpdate || needsReopen) {
    counters.updated += 1;
  }

  if (needsReopen) {
    counters.reopened += 1;
  }

  if (!needsUpdate && !needsReopen && hasLabel) {
    counters.unchanged += 1;
  }
}

async function closeResolvedManagedIssues(
  github,
  core,
  existingBySonarKey,
  qualifyingKeys,
  counters,
  config,
) {
  for (const [sonarKey, githubIssue] of existingBySonarKey) {
    await closeResolvedManagedIssue(
      github,
      core,
      sonarKey,
      githubIssue,
      qualifyingKeys,
      counters,
      config,
    );
  }
}

async function closeResolvedManagedIssue(
  github,
  core,
  sonarKey,
  githubIssue,
  qualifyingKeys,
  counters,
  config,
) {
  if (qualifyingKeys.has(sonarKey)) {
    return;
  }

  await restoreManagedLabelIfNeeded(
    github,
    githubIssue,
    hasManagedLabel(githubIssue, config.labelName),
    counters,
    config,
  );
  await closeIssueIfOpen(github, core, sonarKey, githubIssue, counters, config);
}

async function closeIssueIfOpen(
  github,
  core,
  sonarKey,
  githubIssue,
  counters,
  { owner, repo },
) {
  if (githubIssue.state !== 'open') {
    return;
  }

  await github.rest.issues.update({
    owner,
    repo,
    issue_number: githubIssue.number,
    state: 'closed',
    state_reason: 'completed',
  });

  core.info(
    `Closed GitHub issue #${githubIssue.number}; Sonar issue ${sonarKey} is no longer OPEN with HIGH/BLOCKER impact.`,
  );
  counters.closed += 1;
}

function logCompletion(core, findings, counters) {
  core.info(
    `Sonar sync complete: ${findings.length} qualifying finding(s), ${counters.created} created, ${counters.updated} updated, ${counters.reopened} reopened, ${counters.closed} closed, ${counters.unchanged} unchanged, ${counters.labelsRestored} label(s) restored.`,
  );
}

async function writeSummary(core, findings, counters) {
  await core.summary
    .addHeading('Sonar Quality Issues sync')
    .addTable([
      [
        { data: 'Metric', header: true },
        { data: 'Count', header: true },
      ],
      ['Qualifying HIGH/BLOCKER findings', String(findings.length)],
      ['Created', String(counters.created)],
      ['Updated', String(counters.updated)],
      ['Reopened', String(counters.reopened)],
      ['Closed', String(counters.closed)],
      ['Unchanged', String(counters.unchanged)],
      ['Managed labels restored', String(counters.labelsRestored)],
    ])
    .write();
}

module.exports = async ({ github, context, core }) => {
  const config = readConfiguration(context, core);
  const sonarGet = createSonarClient(config);
  const repository = await github.rest.repos.get({
    owner: config.owner,
    repo: config.repo,
  });
  const { sonarIssues, rules } = await fetchOpenSonarIssues(
    sonarGet,
    config.projectKey,
  );
  const findings = normalizeFindings(sonarIssues);

  await ensureLabel(github, config);

  const existingBySonarKey = await findExistingManagedIssues(github, core, config);
  const qualifyingKeys = new Set(findings.map(({ issue }) => issue.key));
  const counters = createCounters();

  for (const finding of findings) {
    const rendered = buildRenderedFinding(
      finding,
      rules,
      config,
      repository.data.default_branch,
    );
    await syncFinding(github, core, rendered, existingBySonarKey, counters, config);
  }

  await closeResolvedManagedIssues(
    github,
    core,
    existingBySonarKey,
    qualifyingKeys,
    counters,
    config,
  );

  logCompletion(core, findings, counters);
  await writeSummary(core, findings, counters);
};
