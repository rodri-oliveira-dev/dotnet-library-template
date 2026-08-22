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

Two supported flows are available:

| Flow | When to use it | Automatically renames `Template.Library`? |
| --- | --- | --- |
| [`dotnet new`](#recommended-option--dotnet-new) | When you want a new library generated with its own identity | Yes |
| [GitHub Template Repository](#alternative--github-template-repository) | When you want to create the GitHub repository first and initialize it through Actions | Yes, after the `Initialize repository` workflow |

For most new projects, prefer **`dotnet new`**.

## Quick Start

Recommended flow for generating a library locally:

```bash
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
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
- manual releases through GitHub Actions or Git-tag pushes;
- manual tag creation only after build, tests, pack, and package validation succeed;
- NuGet.org Trusted Publishing through GitHub OIDC with `NUGET_USER` as an explicit publication opt-in;
- GitHub Release creation independent from NuGet enablement.

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

## Recommended option — `dotnet new`

Clone this repository and install the template from its root:

```bash
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
dotnet new list rodri-lib
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

When local template testing is complete:

```bash
cd ..
dotnet new uninstall .
```

Template evolution and validation details are documented in [docs/template-development.md](docs/template-development.md).

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

### Post-initialization checklist

Before the first release of a library created from the GitHub Template:

- customize package description and metadata;
- review the base version in `Directory.Build.props`;
- review README, license, and public metadata;
- if NuGet.org publication is desired, configure Trusted Publishing for `.github/workflows/release.yml` and the `NUGET_USER` Repository Variable;
- configure `SONAR_TOKEN` if SonarQube Cloud should be enabled;
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

For releases, the **Git tag is the source of truth**:

```text
v1.0.0          -> Version 1.0.0
v1.2.3          -> Version 1.2.3
v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` uses `Version` as the single release override, runs restore/build/test/pack, validates the package, ensures the release tag, and only then proceeds to external publication and GitHub Release creation.

### Manual release through GitHub Actions

The recommended manual-release flow is:

1. open the repository **Actions** tab;
2. select the **Release** workflow;
3. click **Run workflow**;
4. select branch **main**;
5. enter **Release version**, for example `v1.2.0` or `v1.3.0-beta.1`;
6. run the workflow.

The workflow rejects manual releases outside `main` and fails early when the requested tag already exists. It then runs build, tests, pack, and `verify-package`. **The tag is created only after all those validations succeed** and points exactly to the `github.sha` validated by that run.

After the tag is created, the same workflow continues to NuGet when enabled and to GitHub Release creation. The tag created with `GITHUB_TOKEN` does not depend on a second release-workflow execution.

The existing tag-push flow remains supported:

```bash
git tag v1.2.0
git push origin v1.2.0
```

For tag-triggered runs, the workflow verifies that the incoming tag resolves to the same SHA being validated before publishing anything.

### NuGet.org Trusted Publishing

NuGet.org publication is explicitly **opt-in**. `NUGET_USER` is a **Repository Variable**, not a secret, and acts as the publication-enablement flag.

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
valid release
AND PackageId is not the placeholder
AND NUGET_USER is configured and non-empty
```

If `NUGET_USER` is absent, empty, or whitespace-only, the release **does not fail**: `NuGet/login` is not started, no publication OIDC credential is requested, and `dotnet nuget push` is not executed. The Git tag and GitHub Release are still created normally; for a real package, `.nupkg` and `.snupkg` are attached to the GitHub Release even when NuGet publishing is disabled.

When `NUGET_USER` is configured and NuGet publishing is enabled, the GitHub Release is created only after NuGet publication succeeds, so the repository does not advertise a NuGet distribution that failed.

The template does not use a long-lived `NUGET_API_KEY`.

### Placeholder publication guard

The source repository uses `Template.Library` as its neutral identity. The release workflow detects that identity and blocks accidental publication to NuGet.org.

The template repository can still create a versioned tag and GitHub Release, even without `NUGET_USER`, but it does not publish or attach the placeholder package. In projects generated through `dotnet new`, `PackageId` is replaced with the real library name; GitHub Releases work independently from NuGet, while NuGet publication becomes available after Trusted Publishing and `NUGET_USER` are configured.

## Security and quality

The main workflows have separate responsibilities:

| Workflow | Responsibility |
| --- | --- |
| `ci.yml` | restore, build policies, formatting, tests, coverage, pack, and consumption validation |
| `codeql.yml` | CodeQL analysis for C# |
| `dependency-review.yml` | blocks newly introduced High/Critical vulnerabilities in pull requests |
| `sonar.yml` | optional SonarQube Cloud analysis |
| `release.yml` | validation, release-tag creation/verification, optional NuGet publication, and GitHub Release |
| `template-validation.yml` | end-to-end `dotnet new` validation |
| `sonar-template-validation.yml` | validates the Sonar contract in generated output |
| `versioning-validation.yml` | validates the SemVer and package/assembly metadata contract |
| `release-publishing-validation.yml` | maintenance-only validation of release requests, tag handling, and NuGet opt-in |
| `github-template-initialization-validation.yml` | maintenance-only validation of GitHub Template Repository initialization |

Keeping these concerns separate makes build, security, external-analysis, generation, and release failures independently diagnosable.

## Optional SonarQube Cloud

Sonar analysis is opt-in. Configure the repository secret:

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

## Generated content versus template maintenance

Most of the baseline is copied into generated projects: code, tests, build policies, lock files, centralized dependencies, governance, CI, security, quality, release automation, and package tooling.

Template-maintenance-only content is excluded, including:

- `.template.config/**`;
- the GitHub Template Repository initialization workflow and helper;
- template-only validation workflows;
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
│   ├── ensure-release-tag.sh
│   ├── resolve-nuget-publishing.sh
│   ├── resolve-release-request.sh
│   └── verify-package.cs
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
