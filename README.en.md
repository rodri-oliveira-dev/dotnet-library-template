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
| [GitHub Template Repository](#alternative--github-template-repository) | When you want to copy the complete repository structure and customize the identity manually | No |

For most new projects, prefer **`dotnet new`**.

## What the baseline provides

### Build and dependencies

- .NET 10;
- `.slnx` solution format;
- nullable reference types and implicit usings;
- warnings treated as errors;
- deterministic builds;
- Central Package Management through `Directory.Packages.props`;
- `packages.lock.json` and `--locked-mode` restore;
- NuGet Audit failing on High/Critical vulnerabilities.

### Tests and quality

- xUnit v3 on Microsoft Testing Platform;
- AwesomeAssertions;
- NSubstitute;
- coverage with Coverlet MTP;
- `dotnet format` in CI;
- optional SonarQube Cloud analysis;
- package validation through a temporary consumer project.

### Packaging and versioning

- `.nupkg` and `.snupkg`;
- XML documentation;
- portable PDB and Source Link;
- Semantic Versioning;
- base version centralized in `Directory.Build.props`;
- validation of package and assembly version metadata;
- Git-tag-driven releases;
- NuGet.org Trusted Publishing through GitHub OIDC with `NUGET_USER` as an explicit publication opt-in;
- GitHub Release creation after successful publication of a real package.

### Security and governance

- CodeQL for C#;
- Dependency Review;
- Dependabot;
- MIT license;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- `CHANGELOG.md`;
- workflows with explicit least-privilege permissions.

The template is intentionally generic. It does not include ASP.NET Core, databases, ORMs, logging implementations, infrastructure-specific Testcontainers, BenchmarkDotNet, or other dependencies without a proven reusable need.

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
dotnet new install .
dotnet new list rodri-lib
```

Generate a library:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Because `preferNameDirectory` is enabled, the command creates `MyCompany.MyLibrary/` and replaces the neutral `Template.Library` identity in relevant paths and contents.

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
dotnet new uninstall .
```

Template evolution and validation details are documented in [docs/template-development.md](docs/template-development.md).

## Alternative — GitHub Template Repository

On the repository page, select **Use this template** and then **Create a new repository**.

This flow directly copies the versioned files. GitHub **does not run** the .NET template engine, so it does not automatically replace `Template.Library` in solution names, projects, namespaces, or `PackageId`.

Use this flow when you intentionally want to preserve the full repository structure and accept a manual identity-customization step.

### Post-creation checklist

Before the first release of a library created from the GitHub Template:

- replace `Template.Library` with the real library identity;
- customize package description and metadata;
- review the base version in `Directory.Build.props`;
- review README, license, and public metadata;
- if NuGet.org publication is desired, configure Trusted Publishing for `.github/workflows/release.yml` and the `NUGET_USER` repository variable;
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

Maintenance workflows additionally validate end-to-end generation, the versioning contract, optional SonarQube Cloud integration, and the NuGet publication opt-in decision matrix.

## Versioning and releases

The development baseline version is declared once in `Directory.Build.props`:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Individual projects should not duplicate `Version`, `VersionPrefix`, or `PackageVersion`.

For published releases, the **Git tag is the source of truth**:

```text
v1.0.0          -> Version 1.0.0
v1.2.3          -> Version 1.2.3
v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` validates the tag, uses `Version` as the single release override, runs build/test/pack, and validates the package before any external publication.

`workflow_dispatch` is always a **dry run**: it requires an explicit version but never publishes to NuGet.org or creates a GitHub Release.

### NuGet.org Trusted Publishing

NuGet.org publication is explicitly **opt-in**. To enable it for a real package:

1. create a Trusted Publishing policy on nuget.org targeting `release.yml`;
2. configure the `NUGET_USER` repository variable with the nuget.org profile name.

`NUGET_USER` also acts as the publication-enablement flag. The workflow centralizes the decision in `nuget-publishing-enabled`, which is true only for a real tag release, a non-placeholder `PackageId`, and a non-empty `NUGET_USER` value.

If `NUGET_USER` is absent, empty, or contains only whitespace, build, tests, pack, and validation continue normally while the publication job is skipped. In that state, `NuGet/login@v1` is not started, no publication OIDC credential is requested, and `dotnet nuget push` is not executed. For real packages, the GitHub Release with package artifacts is also skipped, preserving the guarantee that no partial release is created.

The template does not use a long-lived `NUGET_API_KEY`.

### Placeholder publication guard

The source repository uses `Template.Library` as its neutral identity. The release workflow detects that identity and blocks accidental publication to NuGet.org.

The template repository can still create versioned GitHub Releases, even without `NUGET_USER`, but it does not publish or attach the placeholder package. In projects generated through `dotnet new`, `PackageId` is replaced with the real library name and publication becomes available only after Trusted Publishing and `NUGET_USER` are configured.

## Security and quality

The main workflows have separate responsibilities:

| Workflow | Responsibility |
| --- | --- |
| `ci.yml` | restore, build policies, formatting, tests, coverage, pack, and consumption validation |
| `codeql.yml` | CodeQL analysis for C# |
| `dependency-review.yml` | blocks newly introduced High/Critical vulnerabilities in pull requests |
| `sonar.yml` | optional SonarQube Cloud analysis |
| `release.yml` | versioning, validation, NuGet publication, and GitHub Release |
| `template-validation.yml` | end-to-end `dotnet new` validation |
| `sonar-template-validation.yml` | validates the Sonar contract in generated output |
| `versioning-validation.yml` | validates the SemVer and package/assembly metadata contract |
| `release-publishing-validation.yml` | maintenance-only validation of the NuGet publication opt-in matrix |

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
│   ├── resolve-nuget-publishing.sh
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
├── Template.Library.slnx
└── global.json
```

## Documentation

- [README em Português](README.md): Portuguese version of this overview;
- [Template development](docs/template-development.md): rules for maintaining and evolving the custom template;
- [Repository administration](docs/repository-administration.md): desired baseline for GitHub administrative settings;
- [Generated library README](docs/library-readme.md): README used by projects created through `dotnet new`;
- [CONTRIBUTING.md](CONTRIBUTING.md): contribution process and breaking-change expectations;
- [CHANGELOG.md](CHANGELOG.md): notable change history;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): participation standards.

## `Template.Library` convention

`Template.Library` is an intentional neutral identity. In `.template.config/template.json`, it is the `sourceName` replaced by the value provided through `-n`/`--name`.

Do not replace this identity in the source repository with a product- or domain-specific name. Changes to generation rules should preserve template neutrality and be covered by end-to-end validation.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Distributed under the [MIT License](LICENSE).
