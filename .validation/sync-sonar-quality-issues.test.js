'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const syncSonarQualityIssues = require('../.github/scripts/sync-sonar-quality-issues.js');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('creates managed issue from qualifying Sonar finding', async () => {
  const github = createGithubMock({ labelExists: false });
  const core = createCoreMock();
  const fetchCalls = mockSonarFetch([
    {
      issues: [createSonarIssue('sonar-1')],
      rules: [{ key: 'javascript:S3776', name: 'Cognitive Complexity of functions should not be too high' }],
      paging: { total: 1 },
    },
  ]);

  await runSync({ github, core });

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url.searchParams.get('issueStatuses'), 'OPEN');
  assert.equal(fetchCalls[0].url.searchParams.get('impactSeverities'), 'BLOCKER,HIGH');
  assert.equal(fetchCalls[0].url.searchParams.get('ps'), '500');
  assert.equal(fetchCalls[0].options.headers.Authorization, 'Bearer sonar-token');
  assert.deepEqual(github.calls.createLabel[0], {
    owner: 'octo',
    repo: 'library',
    name: 'Sonar Quality Issues',
    color: 'b60205',
    description: 'High-impact quality findings synchronized from SonarQube Cloud',
  });

  const created = github.calls.createIssue[0];
  assert.equal(
    created.title,
    '[Sonar][HIGH][MAINTAINABILITY] Cognitive Complexity of functions should not be too high',
  );
  assert.deepEqual(created.labels, ['Sonar Quality Issues']);
  assert.match(created.body, /<!-- sonar-sync:start -->/);
  assert.match(created.body, /<!-- sonar-issue-key:sonar-1 -->/);
  assert.match(created.body, /src%20with%20space\/file.js#L12/);
  assert.match(created.body, /src\/related.js#L4/);
  assert.match(created.body, /<!-- Anotações manuais podem ser adicionadas abaixo\./);
  assertSummaryCount(core, 'Created', '1');
});

test('updates managed section, reopens issue, and preserves manual content', async () => {
  const existingBody = [
    'Manual prefix',
    '<!-- sonar-sync:start -->',
    '<!-- sonar-issue-key:sonar-1 -->',
    'old managed content',
    '<!-- sonar-sync:end -->',
    'Manual suffix',
  ].join('\n');
  const github = createGithubMock({
    repositoryIssues: [
      {
        number: 84,
        title: 'Old title',
        body: existingBody,
        state: 'closed',
        labels: [],
        user: { login: 'github-actions[bot]' },
      },
    ],
  });
  const core = createCoreMock();
  mockSonarFetch([
    {
      issues: [createSonarIssue('sonar-1')],
      rules: [{ key: 'javascript:S3776', name: 'Updated rule name' }],
      paging: { total: 1 },
    },
  ]);

  await runSync({ github, core });

  const update = github.calls.updateIssue[0];
  assert.equal(update.issue_number, 84);
  assert.equal(update.state, 'open');
  assert.match(update.body, /^Manual prefix\n<!-- sonar-sync:start -->/);
  assert.match(update.body, /<!-- sonar-issue-key:sonar-1 -->/);
  assert.match(update.body, /\nManual suffix$/);
  assert.equal(github.calls.addLabels[0].issue_number, 84);
  assert.deepEqual(github.calls.addLabels[0].labels, ['Sonar Quality Issues']);
  assertSummaryCount(core, 'Updated', '1');
  assertSummaryCount(core, 'Reopened', '1');
  assertSummaryCount(core, 'Managed labels restored', '1');
});

test('closes stale workflow-managed issues without touching human issues or pull requests', async () => {
  const github = createGithubMock({
    repositoryIssues: [
      {
        number: 10,
        body: managedBodyFor('stale-sonar'),
        state: 'open',
        labels: [],
        user: { login: 'github-actions[bot]' },
      },
      {
        number: 11,
        body: managedBodyFor('human-sonar'),
        state: 'open',
        labels: [],
        user: { login: 'maintainer' },
      },
      {
        number: 12,
        body: managedBodyFor('pull-request-sonar'),
        pull_request: {},
        state: 'open',
        labels: [],
        user: { login: 'github-actions[bot]' },
      },
    ],
  });
  const core = createCoreMock();
  mockSonarFetch([{ issues: [], rules: [], paging: { total: 0 } }]);

  await runSync({ github, core });

  assert.deepEqual(
    github.calls.addLabels.map((call) => call.issue_number),
    [10],
  );
  assert.deepEqual(github.calls.updateIssue, [
    {
      owner: 'octo',
      repo: 'library',
      issue_number: 10,
      state: 'closed',
      state_reason: 'completed',
    },
  ]);
  assertSummaryCount(core, 'Closed', '1');
});

test('continues Sonar pagination until the reported total is reached', async () => {
  const pageOneIssues = Array.from({ length: 500 }, (_, index) =>
    createSonarIssue(`sonar-page-1-${index}`),
  );
  const github = createGithubMock();
  const core = createCoreMock();
  const fetchCalls = mockSonarFetch([
    { issues: pageOneIssues, rules: [], paging: { total: 501 } },
    { issues: [createSonarIssue('sonar-page-2')], rules: [], paging: { total: 501 } },
  ]);

  await runSync({ github, core });

  assert.deepEqual(
    fetchCalls.map((call) => call.url.searchParams.get('p')),
    ['1', '2'],
  );
  assert.equal(github.calls.createIssue.length, 501);
  assertSummaryCount(core, 'Qualifying HIGH/BLOCKER findings', '501');
});

test('fails when Sonar returns a finding without a matching high-impact entry', async () => {
  const github = createGithubMock();
  const core = createCoreMock();
  const issue = createSonarIssue('sonar-low');
  issue.impacts = [{ severity: 'LOW', softwareQuality: 'MAINTAINABILITY' }];
  mockSonarFetch([{ issues: [issue], rules: [], paging: { total: 1 } }]);

  await assert.rejects(
    runSync({ github, core }),
    /without a matching impacts entry/,
  );
});

async function runSync({ github, core }) {
  process.env.SONAR_HOST_URL = 'https://sonarcloud.io/';
  process.env.SONAR_PROJECT_KEY = 'sample_project';
  process.env.SONAR_ISSUE_LABEL = 'Sonar Quality Issues';
  process.env.SONAR_TOKEN = 'sonar-token';

  await syncSonarQualityIssues({
    github,
    context: { repo: { owner: 'octo', repo: 'library' } },
    core,
  });
}

function createSonarIssue(key) {
  return {
    key,
    rule: 'javascript:S3776',
    component: 'sample_project:src with space/file.js',
    line: 12,
    textRange: { endLine: 14 },
    impacts: [{ severity: 'HIGH', softwareQuality: 'MAINTAINABILITY' }],
    cleanCodeAttribute: 'FOCUSED',
    cleanCodeAttributeCategory: 'ADAPTABLE',
    effort: '1h',
    quickFixAvailable: false,
    tags: ['brain-overload'],
    creationDate: '2026-09-04T20:38:13+0000',
    updateDate: '2026-09-04T20:40:47+0000',
    message: 'Refactor this function.',
    flows: [
      {
        locations: [
          {
            component: 'sample_project:src/related.js',
            textRange: { startLine: 4 },
            msg: '+1',
          },
        ],
      },
    ],
  };
}

function createGithubMock({ repositoryIssues = [], labelExists = true } = {}) {
  const calls = {
    createIssue: [],
    updateIssue: [],
    addLabels: [],
    createLabel: [],
  };

  return {
    calls,
    rest: {
      repos: {
        get: async () => ({ data: { default_branch: 'main' } }),
      },
      issues: {
        getLabel: async () => {
          if (!labelExists) {
            const error = new Error('Not Found');
            error.status = 404;
            throw error;
          }
        },
        createLabel: async (args) => {
          calls.createLabel.push(args);
        },
        create: async (args) => {
          calls.createIssue.push(args);
          return { data: { number: 1000 + calls.createIssue.length, ...args } };
        },
        update: async (args) => {
          calls.updateIssue.push(removeUndefined(args));
        },
        addLabels: async (args) => {
          calls.addLabels.push(args);
        },
        listForRepo: {},
      },
    },
    paginate: async () => repositoryIssues,
  };
}

function createCoreMock() {
  const summary = {
    heading: null,
    table: null,
    addHeading(heading) {
      this.heading = heading;
      return this;
    },
    addTable(table) {
      this.table = table;
      return this;
    },
    async write() {},
  };

  return {
    infos: [],
    secrets: [],
    warnings: [],
    summary,
    info(message) {
      this.infos.push(message);
    },
    setSecret(secret) {
      this.secrets.push(secret);
    },
    warning(message) {
      this.warnings.push(message);
    },
  };
}

function mockSonarFetch(pages) {
  const calls = [];

  global.fetch = async (url, options) => {
    const parsedUrl = new URL(url);
    const page = Number(parsedUrl.searchParams.get('p'));
    const payload = pages[page - 1] ?? { issues: [], rules: [], paging: { total: 0 } };
    calls.push({ url: parsedUrl, options });

    return {
      ok: true,
      async json() {
        return payload;
      },
    };
  };

  return calls;
}

function managedBodyFor(sonarKey) {
  return [
    '<!-- sonar-sync:start -->',
    `<!-- sonar-issue-key:${sonarKey} -->`,
    '<!-- sonar-sync:end -->',
  ].join('\n');
}

function assertSummaryCount(core, metric, expected) {
  const row = core.summary.table.find(([name]) => name === metric);
  assert.deepEqual(row, [metric, expected]);
}

function removeUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}
