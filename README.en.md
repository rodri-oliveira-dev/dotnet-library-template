# .NET Library Template

**English** | [Português](README.md)

[![Build & Tests](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml)
[![software_quality_security_issues](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=software_quality_security_issues)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=coverage)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Opinionated, reusable template for starting .NET 10 libraries with a consistent baseline for build, tests, dependency management, packaging, CI, security, quality, versioning, releases, and repository governance.

The goal is not to prescribe a domain architecture. The template provides a **predictable engineering foundation** so a new library starts with common technical practices already configured without inheriting product-specific dependencies.

## Choose how to use the template

Three supported flows are available:

| Flow | When to use it | Automatically renames `Template.Library`? |
| --- | --- | --- |
| [NuGet + `dotnet new`](#recommended-option--nuget--dotnet-new) | Recommended CLI consumer flow | Yes |
| [GitHub Template Repository](#alternative--github-template-repository) | Recommended flow when you want to create the GitHub repository first and initialize it through Actions | Yes, after the `Initialize repository` workflow |
| [Clone + local install](#maintainer-flow--clone--local-install) | Template maintenance, template development, local tests, and contribution | Yes |

For most new CLI projects, prefer **NuGet + `dotnet new`**.

## Quick Start

Recommended CLI consumer flow:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
dotnet new list rodri-lib

dotnet new rodri-lib -n MyCompany.MyLibrary
cd MyCompany.MyLibrary

dotnet restore --locked-mode
dotnet build -c Release
dotnet test -c Release
```

This path runs the .NET template engine, creates the `MyCompany.MyLibrary/` directory because `preferNameDirectory` is enabled, and replaces `Template.Library` in the relevant paths and contents.

## What the baseline provides

### Build and dependencies

- .NET 10;
- `.slnx` solution format;
- nullable reference types and implicit usings;
- warnings treated as errors;
- SDK analyzer baseline at `10-recommended`, security analyzers at `10-all`, and code style participating in builds;
- deterministic builds;
- reproducible SDK selection through `global.json` with sustainable roll-forward inside .NET 10;
- Central Package Management through `Directory.Packages.props`;
- `packages.lock.json` and `--locked-mode` restore;
- NuGet Audit failing on High/Critical vulnerabilities.

### Tests and quality

- xUnit v3 on Microsoft Testing Platform;
- AwesomeAssertions;
- NSubstitute;
- coverage with Coverlet MTP;
- `dotnet format` in CI;
- low-noise reliability and performance rules applied to production code without blocking tests on internal implementation details;
- optional SonarQube Cloud analysis;
- package validation through a temporary consumer project.

### Packaging and versioning

- `.nupkg` and `.snupkg`;
- XML documentation;
- README included in the NuGet package;
- portable PDB and Source Link;
- native SDK Package Validation during `dotnet pack`;
- Semantic Versioning;
- base version centralized in `Directory.Build.props`;
- validation of package and assembly version metadata;
- manual releases through GitHub Actions with `publish=false` for validation and `publish=true` for official publication;
- versioned release candidate with manifest and SHA-256 checksums before any external publication;
- NuGet.org Trusted Publishing through GitHub OIDC with publication opted in by `publish=true` and `NUGET_USER`;
- draft GitHub Release before NuGet and finalization only after successful publication.
- public NuGet Template Package `RodriOliveira.DotNet.Library.Template`, separate from the `Template.Library` placeholder package;
- validation of the real template `.nupkg` before publication, including install, generation, and parity comparison against the local template.

### Security and governance

- CodeQL for C#;
- Dependency Review;
- Dependabot;
- MIT license;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- `SECURITY.md`;
- `CHANGELOG.md`;
- workflows with explicit least-privilege permissions, actions pinned by SHA, and read-only checkouts without credential persistence.

The template is intentionally generic. It does not include ASP.NET Core, databases, ORMs, logging implementations, infrastructure-specific Testcontainers, BenchmarkDotNet, runtime tuning, Server GC, ReadyToRun, or other dependencies without a proven reusable need. Trimming or Native AOT compatibility should be enabled by each library only when it is part of the package's real contract.

## Requirements

- .NET SDK 10;
- Git.

Confirm the installed SDK:

```bash
dotnet --version
```

## Recommended option — NuGet + `dotnet new`

Install the public template package:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
dotnet new list rodri-lib
```

To update or reinstall the template, run the install command again:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
```

When you need exact reproducibility across machines or builds, install a specific version:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template@1.2.0
```

Generate a library:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Because `preferNameDirectory` is enabled, the command creates `MyCompany.MyLibrary/` and replaces the neutral `Template.Library` identity in relevant paths and contents.

If you need explicit control over the destination directory, use `-o`/`--output`:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary -o ./MyCompany.MyLibrary
```

The `-o` option is optional; it is useful when you want to generate the library somewhere other than the name-based preferred directory.

Validate the generated project:

```bash
cd MyCompany.MyLibrary
dotnet tool restore
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet pack src/MyCompany.MyLibrary/MyCompany.MyLibrary.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
```

Without a release override, the package uses the base version `1.0.0`.

When you no longer need the installed template:

```bash
dotnet new uninstall RodriOliveira.DotNet.Library.Template
```

Template evolution and validation details are documented in [docs/template-development.md](docs/template-development.md).

## Maintainer flow — clone + local install

For template maintenance, template development, local validation, or contribution, clone this repository and install the template directly from the checkout:

```bash
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
dotnet new list rodri-lib
dotnet new rodri-lib -n MyCompany.MyLibrary
```

When finished:

```bash
dotnet new uninstall .
```

## Alternative — GitHub Template Repository

On the repository page, select **Use this template** and then **Create a new repository**. Then initialize the copy through GitHub Actions:

```text
Use this template
→ Create a new repository
→ Actions
→ Initialize repository
→ Run workflow
→ project_name = MyCompany.MyLibrary
```

GitHub **does not run** `.template.config/template.json` when it copies the repository. It only performs the initial copy. The **Initialize repository** workflow then runs the real .NET template engine inside the copy, using `dotnet new rodri-lib -n MyCompany.MyLibrary`, so `sourceName`, `exclude`, `rename`, and `preferNameDirectory` are applied from the template's authoritative configuration.

After a successful initialization:

- `Template.Library` is replaced with the provided identity;
- template-maintenance-only files are removed;
- `docs/library-readme.md` becomes the generated library `README.md`;
- the `Initialize repository` workflow and its helper remove themselves;
- normal development continues with the generated library workflows.

Run this workflow before normal development starts in the new repository. It must run from the default branch and fails if it is executed in the source template repository `rodri-oliveira-dev/dotnet-library-template`.

### Prerequisites and expected failures

- GitHub Actions must be enabled in the new repository;
- configure repository secret `INITIALIZE_REPOSITORY_TOKEN` before running the workflow;
- that token should be temporary and have the minimum target-repository permissions: `Contents: write` and `Workflows: write`;
- remove or revoke `INITIALIZE_REPOSITORY_TOKEN` after successful initialization;
- organization rulesets or branch protection may block the `INITIALIZE_REPOSITORY_TOKEN` push;
- if validation, build, tests, or packaging fail, the workflow should not commit or push a partial initialization;
- if the push is blocked, adjust the repository rules or use an approved equivalent process without weakening security automatically.

### How to create `INITIALIZE_REPOSITORY_TOKEN`

`INITIALIZE_REPOSITORY_TOKEN` is a **Repository Secret** whose value should be a temporary **Fine-grained Personal Access Token (PAT)**. It is not copied when a new repository is created with **Use this template**, so it must be configured in the destination repository before the first workflow run.

Create the token from a GitHub account with administrative access to the destination repository:

1. open your GitHub avatar and go to **Settings**;
2. open **Developer settings** → **Personal access tokens** → **Fine-grained tokens**;
3. click **Generate new token**;
4. use a temporary name such as `Initialize MyCompany.MyLibrary`;
5. choose a short expiration, preferably only a few days;
6. under **Resource owner**, select the user or organization that owns the new repository;
7. under **Repository access**, choose **Only select repositories** and select only the repository that will be initialized;
8. under **Repository permissions**, configure:
   - **Contents** → **Read and write**;
   - **Workflows** → **Read and write**;
9. generate the token and copy the displayed value. GitHub may not show it again.

Then, in the **destination repository**:

1. go to **Settings** → **Secrets and variables** → **Actions**;
2. on the **Secrets** tab, click **New repository secret**;
3. use exactly this name:

```text
INITIALIZE_REPOSITORY_TOKEN
```

4. paste the Fine-grained PAT into **Secret**;
5. save the secret;
6. run **Actions** → **Initialize repository** → **Run workflow**.

The token needs `Contents: write` because the initializer creates and replaces repository files, and `Workflows: write` because initialization also removes/replaces files under `.github/workflows`.

After a successful initialization, delete repository secret `INITIALIZE_REPOSITORY_TOKEN` and revoke or delete the PAT under **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**. Do not reuse this token as a permanent CI credential and do not store it in version-controlled files.

### Possible initialization errors

#### `Configure repository secret INITIALIZE_REPOSITORY_TOKEN...`

```text
Configure repository secret INITIALIZE_REPOSITORY_TOKEN with Contents: write and Workflows: write before running this one-time initializer.
```

The workflow did not receive the secret. Confirm it was created under **Settings** → **Secrets and variables** → **Actions** in the **generated repository**, using the exact name `INITIALIZE_REPOSITORY_TOKEN`. Secrets from the source template repository are not copied into newly created repositories.

#### `error IMPORTS: Fix imports ordering`

```text
error IMPORTS: Fix imports ordering.
```

This can occur in copies created from older template revisions because replacing `Template.Library` with the new library name can change the lexical ordering of `using` directives. The current initializer runs `dotnet format --no-restore` after generation and then `dotnet format --verify-no-changes --no-restore`, normalizing generated output before the formatting gate.

If this error occurs in a repository created from an older revision, update `.github/workflows/initialize-repository.yml` to the current implementation or recreate the copy from the latest template revision. When the workflow itself has changed, prefer starting a **new workflow run** instead of re-running an attempt tied to the old workflow revision.

#### `fatal: could not read Username for 'https://github.com'`

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

This means `git push` could not authenticate. The current initializer uses HTTP Basic authentication with `x-access-token` and the value of `INITIALIZE_REPOSITORY_TOKEN`.

If it still occurs:

- confirm the PAT has not expired or been revoked;
- confirm **Repository access** includes the destination repository;
- confirm `Contents: Read and write` and `Workflows: Read and write`;
- confirm the secret contains the complete PAT without extra whitespace;
- if the repository copy contains an older initializer, update the workflow before running it again.

#### Push rejected by a ruleset or branch protection

The PAT may be valid while GitHub still rejects a push to the default branch. Review repository/organization rulesets and branch protection in that case. Temporarily authorize the actor/token for initialization or use an approved equivalent process. Do not permanently disable protections just to bypass the initializer.

#### Format, build, test, pack, or package-validation failure

The initializer validates generated output before pushing it. A failure in any of these steps stops execution and prevents a partial initialization from being pushed. Fix the cause reported by the first failed step and run the workflow again. The initialization commit should only be pushed after every preceding validation succeeds.

### Post-initialization checklist

Before the first release of a library created from the GitHub Template:

- customize package description and metadata;
- review the base version in `Directory.Build.props`;
- review README, license, and public metadata;
- if NuGet.org publication is desired, configure Trusted Publishing for `.github/workflows/release.yml` and the `NUGET_USER` Repository Variable;
- [configure SonarQube Cloud](#optional-sonarqube-cloud) if analysis should be enabled;
- configure a ruleset or branch protection for `main`;
- review default GitHub Actions permissions;
- enable and verify the appropriate GitHub security features;
- configure environments or additional protection when publishing/deployment requires them.

> Administrative settings are not copied by a GitHub Template Repository. This includes secrets, variables, environments, rulesets, branch protection, Trusted Publishing policies, and other repository settings.

The recommended administrative baseline is documented in [docs/repository-administration.md](docs/repository-administration.md).

## Validate the source template repository

From the repository root:

```bash
dotnet --version
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
dotnet pack src/Template.Library/Template.Library.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version 1.0.0
```

Maintenance workflows additionally validate end-to-end generation, the versioning contract, optional SonarQube Cloud integration, and the release/publication flow.

## Versioning and releases

The development baseline version is declared once in `Directory.Build.props`:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Individual projects should not duplicate `Version`, `VersionPrefix`, or `PackageVersion`.

For releases, the manual `version` input is the source of truth and the tag is derived from it:

```text
1.0.0           -> tag v1.0.0          -> Version 1.0.0
1.2.3           -> tag v1.2.3          -> Version 1.2.3
1.3.0-beta.1    -> tag v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` uses `Version` as the single release override, runs restore, format, build, test, pack, validates the placeholder package, packs and validates the real template package, runs E2E/parity checks, generates `release-manifest.json` and `SHA256SUMS`, and uploads a single `release-candidate-<version>` artifact.

### Manual release through GitHub Actions

The recommended manual-release flow is:

1. open the repository **Actions** tab;
2. select the **Release** workflow;
3. click **Run workflow**;
4. select branch **main**;
5. enter **version** without a leading `v`, for example `1.2.0` or `1.3.0-beta.1`;
6. keep **publish=false** to validate without external mutations, or select **publish=true** for official publication;
7. run the workflow.

Pull requests and manual runs with `publish=false` only build and validate the release candidate. They do not create tags, create GitHub Releases, request NuGet OIDC credentials, or run `dotnet nuget push`.

With `publish=true`, the workflow requires `refs/heads/main`, downloads the same candidate validated by the build job, verifies version, tag, commit, manifest, and SHA-256 checksums, attests the artifacts, creates or resumes a draft GitHub Release, publishes the package through NuGet Trusted Publishing/OIDC, and only then finalizes the GitHub Release. If NuGet publication fails, the release remains draft and the workflow fails.

### NuGet.org Trusted Publishing

NuGet.org publication is explicitly **opt-in** through the `publish=true` input and the `NUGET_USER` Repository Variable. `NUGET_USER` is not a secret and identifies the nuget.org user/profile used by the Trusted Publishing policy.

To configure it when it does not exist yet:

1. open the repository on GitHub;
2. go to **Settings**;
3. open **Secrets and variables** → **Actions**;
4. select the **Variables** tab;
5. click **New repository variable**;
6. set **Name** to `NUGET_USER`;
7. set **Value** to the nuget.org profile name/username used by the Trusted Publishing policy;
8. save the variable.

On nuget.org, also create a **Trusted Publishing policy** for the repository targeting:

```text
.github/workflows/release.yml
```

The workflow centralizes the decision in `nuget-publishing-enabled`. NuGet publication is enabled only when:

```text
publish=true
AND refs/heads/main
AND validated artifact matches version/tag/commit
AND NUGET_USER is configured and non-empty
```

If `NUGET_USER` is absent, empty, or whitespace-only, `publish=false` still works as validation. With `publish=true`, the run fails before external authentication because an official publication must be able to publish the validated package.

The workflow creates or resumes a draft GitHub Release before NuGet so it can attach the validated artifacts. It is finalized only after NuGet publication succeeds, so the repository does not advertise a NuGet distribution that failed.

The template does not use a long-lived `NUGET_API_KEY`.

### Placeholder publication guard

The source repository uses `Template.Library` as its neutral identity. The release workflow detects that identity and blocks accidental publication to NuGet.org.

In this source repository, the only publishable package is `RodriOliveira.DotNet.Library.Template.<version>.nupkg`. The `Template.Library` package can be built, packed, and validated locally, but it is kept in validation artifacts and never enters the publishable release candidate. In projects generated through `dotnet new`, the delivered workflow publishes only the generated library's real PackageId when Trusted Publishing, `NUGET_USER`, the `release` environment, and `publish=true` are configured.

## Security and quality

The main workflows have separate responsibilities:

| Workflow | Responsibility |
| --- | --- |
| `ci.yml` | restore, build policies, formatting, tests, coverage, pack, and consumption validation |
| `codeql.yml` | CodeQL analysis for C# |
| `dependency-review.yml` | blocks newly introduced High/Critical vulnerabilities in pull requests |
| `sonar.yml` | optional SonarQube Cloud analysis |
| `release.yml` | release candidate validation, attestation, draft GitHub Release, NuGet Trusted Publishing, and release finalization |
| `template-validation.yml` | end-to-end `dotnet new` validation |
| `template-package-validation.yml` | maintenance-only validation of the real NuGet Template Package |
| `sonar-template-validation.yml` | validates the Sonar contract in generated output |
| `versioning-validation.yml` | validates the SemVer and package/assembly metadata contract |
| `release-publishing-validation.yml` | maintenance-only validation of the release candidate, explicit publication, OIDC, draft release, and NuGet opt-in |
| `github-template-initialization-validation.yml` | maintenance-only validation of GitHub Template Repository initialization |

Keeping these concerns separate makes build, security, external-analysis, generation, and release failures independently diagnosable.

## Optional SonarQube Cloud

Sonar analysis is opt-in and implemented by `.github/workflows/sonar.yml`. To enable it correctly:

1. create or import the project in SonarQube Cloud and bind it to the GitHub repository;
2. keep **Automatic Analysis disabled** for the Sonar project because this baseline uses CI-based analysis to run the .NET build and import coverage;
3. configure repository secret `SONAR_TOKEN` with a token authorized to analyze the project;
4. configure `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, and `SONAR_HOST_URL` as Repository Variables only when the automatically derived values do not match the Sonar project coordinates;
5. for release-based baselines, configure **New Code → Previous Version**; the workflow reports `sonar.projectVersion` from the highest reachable release tag using SemVer precedence and falls back to `PackageVersion` before the first release;
6. use **Sonar way** or an intentional custom Quality Gate. The workflow sets `sonar.qualitygate.wait=true` with a 300-second timeout, so an evaluated failed gate fails the job on pull requests and pushes to `main`;
7. validate at least one pull request before making the Sonar check required in the `main` ruleset.

The required secret is:

```text
SONAR_TOKEN
```

Without that secret, `sonar.yml` completes successfully without starting the scanner.

By default, the workflow derives:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

Override those values through Repository Variables when necessary:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

Coverage is generated in OpenCover format and imported through `sonar.cs.opencover.reportsPaths`. Governance and release scripts under `scripts/**` intentionally remain in Sonar analysis; do not add `sonar.exclusions=scripts/**` merely to alter metrics.

**Fork pull requests:** GitHub does not expose Repository Secrets such as `SONAR_TOKEN` to `pull_request` workflows from forks. In that case the workflow emits a warning and completes the disabled path without running the scanner or Quality Gate. Therefore a green Sonar check on a fork PR does not prove that Sonar evaluated the contribution and must not be the only required quality gate for untrusted fork contributions.

The complete setup, including coverage, SemVer versioning, branch protection, fork behavior, and troubleshooting, is documented in [docs/sonarqube-cloud.md](docs/sonarqube-cloud.md). The Portuguese version is available at [docs/sonarqube-cloud.pt-BR.md](docs/sonarqube-cloud.pt-BR.md).

## Generated content versus template maintenance

Most of the baseline is copied into generated projects: code, tests, build policies, lock files, centralized dependencies, governance, CI, security, quality, release automation, and package tooling.

Template-maintenance-only content is excluded, including:

- `.template.config/**`;
- `packaging/**`;
- the GitHub Template Repository initialization workflow and helper;
- template-only validation workflows;
- NuGet Template Package validation workflow and scripts;
- `docs/template-development.md`;
- `docs/repository-administration.md`;
- this repository's `README.md` and `README.en.md`.

`docs/library-readme.md` is renamed to `README.md` during generation. The generated library therefore receives project-oriented documentation rather than source-template maintenance instructions.

## Main repository structure

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
├── .template.config/
│   └── template.json
├── docs/
│   ├── library-readme.md
│   ├── repository-administration.md
│   └── template-development.md
├── scripts/
│   ├── release-candidate.cs
│   ├── resolve-nuget-publishing.sh
│   ├── resolve-release-request.sh
│   └── verify-package.cs
├── packaging/
│   └── RodriOliveira.DotNet.Library.Template.csproj
├── src/
│   └── Template.Library/
├── tests/
│   └── Template.Library.Tests/
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── Directory.Build.props
├── Directory.Packages.props
├── LICENSE
├── README.md
├── README.en.md
├── SECURITY.md
├── Template.Library.slnx
└── global.json
```

## Documentation

- [README em Português](README.md): Portuguese version of this overview;
- [SonarQube Cloud setup](docs/sonarqube-cloud.md): setup, Quality Gate, New Code, coverage, forks, and troubleshooting;
- [Configuração do SonarQube Cloud](docs/sonarqube-cloud.pt-BR.md): Portuguese version of the Sonar guide;
- [Template development](docs/template-development.md): rules for maintaining and evolving the custom template;
- [Repository administration](docs/repository-administration.md): desired baseline for GitHub administrative settings;
- [Generated library README](docs/library-readme.md): README used by projects created through `dotnet new`;
- [CONTRIBUTING.md](CONTRIBUTING.md): contribution process and breaking-change expectations;
- [SECURITY.md](SECURITY.md): vulnerability reporting and triage policy;
- [CHANGELOG.md](CHANGELOG.md): notable change history;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): participation standards.

## `Template.Library` convention

`Template.Library` is an intentional neutral identity. In `.template.config/template.json`, it is the `sourceName` replaced by the value provided through `-n`/`--name`.

Do not replace this identity in the source repository with a product- or domain-specific name. Changes to generation rules should preserve template neutrality and be covered by end-to-end validation.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Distributed under the [MIT License](LICENSE).
