# Source repository administration

This document defines the administrative baseline for the source template repository. It is maintenance-only and must not be copied into projects generated with `dotnet new rodri-lib`.

Repository settings are not stored in Git. This file therefore documents the desired state and the verification procedure for settings that must be applied directly in GitHub.

## Audited source repository

Repository:

```text
rodri-oliveira-dev/dotnet-library-template
```

The issue #18 audit confirmed on 2026-08-21:

- the repository is public;
- `is_template` is enabled, so the repository is a GitHub Template Repository;
- `main` is the default branch;
- `main` is currently reported by the GitHub API as `protected: false`.

The missing branch ruleset/protection is therefore an explicit blocker for considering issue #18 complete.

## GitHub Template Repository

In **Settings > General**, keep **Template repository** enabled.

Verification:

- the repository API reports `is_template: true`;
- the repository page exposes **Use this template**;
- `main` remains the default branch.

Do not assume this setting is inherited by repositories created from this template. A generated repository is an independent repository with its own administrative settings.

## GitHub Actions permissions

In **Settings > Actions > General > Workflow permissions**, use the restrictive repository default:

```text
Read repository contents and packages permissions
```

Do not enable a repository-wide write token merely to make a workflow easier to implement. Workflows in this repository declare additional permissions explicitly where required:

- CI and template validation use read-only contents access;
- CodeQL adds `security-events: write`;
- release publication adds `id-token: write` only to the NuGet publishing job;
- GitHub Release creation adds `contents: write` only to the release job.

Keep **Allow GitHub Actions to create and approve pull requests** disabled unless a future workflow has a documented need for it.

Because this setting is administrative and is not exposed by the connected repository tooling used for the v1.0 audit, verify it directly in GitHub before closing issue #18.

## `main` ruleset

Create an active branch ruleset named:

```text
main-protection
```

Target the default branch (`main`).

Recommended baseline:

1. Require a pull request before merging.
2. For a solo-maintained repository, keep required approving reviews at `0`; increase this when independent reviewers are available.
3. Require status checks to pass before merging.
4. Require the branch to be up to date before merging.
5. Block force pushes.
6. Restrict deletion of the protected branch.

### Required status checks for the source template

Use the **job names** emitted by the workflows, because GitHub rulesets require the status-check name exactly as published.

Require:

```text
Restore, build, test, coverage e pack
Analisar C# com CodeQL
Revisar alterações de dependências
Gerar e validar Validation.SampleLibrary
```

They correspond to:

- `.github/workflows/ci.yml`;
- `.github/workflows/codeql.yml`;
- `.github/workflows/dependency-review.yml`;
- `.github/workflows/template-validation.yml`.

Do not require release jobs on pull requests: `.github/workflows/release.yml` is tag/manual-release automation, not a pull-request gate.

When configuring a required status check, prefer the GitHub Actions app as the expected source when GitHub offers that choice.

## Security and analysis

For this public repository, verify the following under **Settings > Advanced Security** or the equivalent current GitHub security settings:

- Dependency graph is available;
- Dependabot alerts are enabled;
- Dependabot security updates are enabled unless there is a documented reason not to use them;
- secret scanning is enabled;
- push protection is enabled;
- code scanning is enabled and receiving results from `.github/workflows/codeql.yml`.

The repository also keeps defense-in-depth in versioned automation:

- NuGet Audit fails the build for High/Critical vulnerabilities;
- Dependency Review blocks new High/Critical vulnerable dependencies in pull requests;
- CodeQL scans C# on pull requests, pushes to `main`, and weekly;
- Dependabot version updates are configured for NuGet and GitHub Actions.

Do not treat versioned workflows as a substitute for enabling the corresponding repository security features where GitHub requires an administrative setting.

## Generated repositories

Administrative settings are not inherited by repositories created with **Use this template** or by projects generated with `dotnet new` and later pushed to GitHub.

The generated-project README already contains the post-creation checklist. At minimum, each new repository must review:

- default GitHub Actions workflow permissions;
- a `main` branch ruleset/protection policy;
- Dependabot/security settings;
- secret scanning and push protection;
- NuGet.org Trusted Publishing and the `NUGET_USER` repository variable if package publishing is used;
- environments or deployment protection rules if the project adds deployment workflows.

Secrets, repository variables, environments, rulesets, branch protection, Trusted Publishing policies, and other GitHub administrative settings must be configured separately for every new repository.

## Verification before closing issue #18

The source repository is ready only when all of the following are true:

- [x] GitHub Template Repository is enabled.
- [x] `main` is the default branch.
- [ ] `main` has an active ruleset/protection matching the baseline above.
- [ ] default `GITHUB_TOKEN` workflow permissions are verified as read-only.
- [ ] Dependabot alerts/security updates are verified.
- [ ] secret scanning and push protection are verified.
- [ ] CodeQL/code scanning is producing results.
- [ ] a pull request with a required failing check is demonstrably blocked from merge.

Do not close issue #18 based only on this document. The unchecked items represent GitHub-side settings that must be observed in the actual repository.