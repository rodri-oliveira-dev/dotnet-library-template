# Source repository administration

This document defines the **desired administrative baseline** for the source template repository.

It is maintenance-only content and must not be copied into projects generated with `dotnet new rodri-lib`.

Repository settings are not fully represented in Git. This document therefore describes the expected state and how to verify it, rather than recording a point-in-time audit result. Evidence from a specific audit belongs in the relevant issue or pull request so this document does not become stale when settings change.

## Scope

This baseline applies to:

```text
rodri-oliveira-dev/dotnet-library-template
```

It covers settings that require GitHub-side configuration, including:

- GitHub Template Repository status;
- default branch;
- GitHub Actions default permissions;
- branch rulesets/protection;
- repository security features;
- settings required for optional external integrations;
- settings that generated repositories must configure independently.

## Guiding principles

Administrative configuration should follow four rules:

1. **Least privilege** — repository-wide permissions remain restrictive and individual workflows request only the permissions they need.
2. **Pull-request-first changes** — changes to `main` should normally pass through pull requests and required checks.
3. **Versioned policy where possible** — behavior that can be expressed in workflows or repository files should live in Git; only settings that inherently live in GitHub remain administrative.
4. **No inheritance assumptions** — repositories created from this template must explicitly configure their own secrets, variables, rulesets, environments, and publishing trust relationships.

## GitHub Template Repository

In **Settings > General**, keep **Template repository** enabled.

Verify:

- the repository API reports `is_template: true`;
- the repository page exposes **Use this template**;
- `main` remains the default branch.

This setting is specific to the source repository. Do not assume a repository created from the template should itself become a GitHub Template Repository.

## Default branch

The expected default branch is:

```text
main
```

Workflows, rulesets, documentation, and release instructions assume this branch. Manual releases are intentionally restricted to `main` so the tag created by the release workflow cannot accidentally point to a feature branch.

## GitHub Actions permissions

In **Settings > Actions > General > Workflow permissions**, prefer the restrictive repository default equivalent to:

```text
Read repository contents and packages permissions
```

Keep **Allow GitHub Actions to create and approve pull requests** disabled unless a future workflow has a documented requirement for it.

Do not grant repository-wide write permissions to simplify one workflow. Workflows must request additional permissions explicitly and only at the job/workflow scope that needs them.

Current design examples:

- CI and template validation require read-only repository contents;
- CodeQL adds `security-events: write`;
- the release tag gate adds `contents: write` only to the job that creates/verifies the release tag;
- NuGet Trusted Publishing adds `id-token: write` only to the NuGet publishing path;
- GitHub Release creation adds `contents: write` only to the GitHub Release job.
- read-only checkout steps disable Git credential persistence; the release tag gate is the intentional exception.

### Verification

Review both:

1. the repository-level workflow permission setting in GitHub;
2. `permissions:` blocks in every workflow that requires elevated access.

A new workflow with broad write permissions should be treated as a security-sensitive change and reviewed accordingly.

## `main` ruleset / branch protection

Protect the default branch with an active ruleset or equivalent branch protection policy.

A recommended ruleset name is:

```text
main-protection
```

Recommended baseline:

1. Require changes through pull requests.
2. Require status checks before merging.
3. Require the branch to be up to date before merging when appropriate for the repository workflow.
4. Block force pushes.
5. Restrict deletion of the protected branch.
6. Require approving reviews when independent reviewers are available.

For a solo-maintained repository, zero required approving reviews can be acceptable while still enforcing pull requests and automated checks. Increase the review requirement when the maintenance model changes.

### Required status checks

Rulesets require the exact status-check names emitted by GitHub Actions. The current core pull-request gates are expected to include:

```text
Restore, build, test, coverage e pack
Analisar C# com CodeQL
Revisar alterações de dependências
Gerar e validar Validation.SampleLibrary
```

These correspond to:

- `.github/workflows/ci.yml`;
- `.github/workflows/codeql.yml`;
- `.github/workflows/dependency-review.yml`;
- `.github/workflows/template-validation.yml`.

Before editing the ruleset, verify the names against a recent pull request. If a workflow job is renamed, update the ruleset and this document in the same change window so merges are not accidentally blocked or left unprotected.

Do not require release-only jobs on pull requests. `.github/workflows/release.yml` is release automation, not a pull-request gate.

## Security and analysis

Under the repository security settings, enable and verify the features appropriate for a public source repository.

Expected baseline:

- Dependency graph available;
- Dependabot alerts enabled;
- Dependabot security updates enabled unless there is a documented reason to disable them;
- secret scanning enabled;
- push protection enabled when available;
- code scanning enabled and receiving CodeQL results.

The repository also keeps defense in depth through versioned automation:

- NuGet Audit fails for High/Critical vulnerabilities according to the shared build policy;
- Dependency Review blocks newly introduced High/Critical vulnerable dependencies in pull requests;
- CodeQL scans C# on pull requests, pushes to `main`, and on its scheduled run;
- Dependabot version updates are configured for NuGet and GitHub Actions.
- eligible GitHub Actions are pinned by full commit SHA with version comments, and Dependabot monitors those references.

Versioned workflows do not replace repository-side security settings where GitHub requires an administrative switch.

## Release administration

Manual releases are started from **Actions > Release > Run workflow** with branch `main` and a SemVer value such as `v1.2.0`.

The workflow validates that the requested tag does not already exist, then performs build/test/pack/package validation. Only after those gates succeed does the release job create the tag at the exact validated SHA. This requires `contents: write` only on the tag-management job; the repository-wide default should remain read-only.

Tag-triggered releases remain supported. In that path, the workflow verifies that the incoming tag resolves to the same SHA being validated.

## NuGet.org Trusted Publishing

The source template contains a reusable release workflow based on GitHub OIDC and NuGet.org Trusted Publishing. NuGet publication is optional and is enabled by the `NUGET_USER` **Repository Variable**.

### Configure `NUGET_USER`

If `NUGET_USER` does not exist in a repository that should publish to NuGet.org:

1. open the repository on GitHub;
2. go to **Settings**;
3. open **Secrets and variables** → **Actions**;
4. select the **Variables** tab;
5. click **New repository variable**;
6. set **Name** to `NUGET_USER`;
7. set **Value** to the nuget.org profile name/username used by the Trusted Publishing policy;
8. save the variable.

`NUGET_USER` is not a secret and should not be configured under the **Secrets** tab. If the variable is absent, empty, or whitespace-only, NuGet publication is intentionally disabled; the workflow does not run `NuGet/login` or `dotnet nuget push`, but tag and GitHub Release creation remain available.

### Configure the nuget.org trust policy

For a repository that publishes a real package:

1. create a NuGet.org Trusted Publishing policy for the GitHub repository;
2. target the workflow file:

   ```text
   .github/workflows/release.yml
   ```

3. ensure the policy/profile matches the value stored in `NUGET_USER`;
4. validate package ownership/permissions before the first production release.

Do not add a long-lived `NUGET_API_KEY` merely to bypass Trusted Publishing.

The source template intentionally guards its neutral `Template.Library` identity from NuGet publication. That guard is versioned in `release.yml`; the trust policy itself is administrative.

## Optional SonarQube Cloud

SonarQube Cloud is opt-in.

To enable it for a repository, configure:

```text
SONAR_TOKEN
```

as a Repository Secret.

When the derived Sonar coordinates do not match the project, configure Repository Variables as needed:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

Do not store tokens or other credentials in repository files, workflow defaults, documentation examples, or generated project content.

## Generated repositories

Neither GitHub Template Repository copies nor projects generated by `dotnet new` inherit GitHub administrative state.

Each new repository must review and configure its own:

- default GitHub Actions workflow permissions;
- `main` ruleset or branch protection;
- Dependabot and repository security settings;
- secret scanning and push protection;
- NuGet.org Trusted Publishing and `NUGET_USER` when package publishing is used;
- `SONAR_TOKEN` and Sonar variables when SonarQube Cloud is enabled;
- environments and deployment protection rules when the project introduces deployment workflows;
- any organization-specific policies required by the target environment.

Secrets, repository variables, environments, rulesets, branch protection, Trusted Publishing policies, and other GitHub administrative settings must always be treated as repository-specific configuration.

## Verification procedure

Use this checklist when auditing the source repository or preparing a release that depends on repository settings:

- [ ] Repository is still marked as a GitHub Template Repository.
- [ ] `main` is still the default branch.
- [ ] Default `GITHUB_TOKEN` permissions remain restrictive.
- [ ] `main` has an active ruleset or equivalent protection.
- [ ] Required status checks match the names emitted by current workflows.
- [ ] A pull request with a failing required check cannot merge.
- [ ] Dependabot alerts and intended security updates are enabled.
- [ ] Secret scanning and push protection are enabled where available.
- [ ] CodeQL/code scanning is producing results.
- [ ] Manual release tag creation has only job-scoped `contents: write`.
- [ ] `NUGET_USER` is configured under **Actions > Variables** when NuGet publication is intended.
- [ ] Trusted Publishing configuration is valid before publishing a real NuGet package.
- [ ] Optional external integrations use repository secrets/variables rather than committed credentials.

Record the evidence for a specific verification in the issue, pull request, or release checklist that requested the audit. Keep this document focused on the durable baseline.

## Change-management rule

When a repository-side setting becomes part of the engineering contract, update this document in the same pull request as any corresponding workflow or documentation change.

When only the observed state changes — for example, a ruleset is enabled or an audit is completed — record that evidence outside this file unless the desired baseline itself has changed.
