# .NET Library Template

**English** | [Português](README.md)

[![Build & Tests](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml)
[![software_quality_security_issues](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=software_quality_security_issues)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=coverage)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Opinionated, reusable template for starting .NET 10 libraries with a consistent baseline for build, tests, dependencies, packaging, CI, security, quality, versioning, release, and governance.

The template provides a **predictable technical foundation**, not a ready-made domain architecture. The neutral `Template.Library` identity is replaced by the name supplied during generation, while the public package used to install the template is `RodriOliveira.DotNet.Library.Template`.

## Choose how to use the template

| Flow | When to use it | Recommendation |
| --- | --- | --- |
| **NuGet + `dotnet new`** | Create a library from the CLI | **Default recommendation for most consumers** |
| **GitHub Template Repository** | Create the GitHub repository first and initialize it through Actions | Use when the repository and its administrative rules should exist before generation |
| **Clone + local install** | Evolve, test, or contribute to the template itself | Maintainer flow; not the normal consumption path |

The CLI and GitHub Template flows both use the official .NET template engine and must produce the same identity for the same input name.

## Quick Start

Requirements: **.NET SDK 10** and Git.

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
dotnet new list rodri-lib

dotnet new rodri-lib -n MyCompany.MyLibrary
cd MyCompany.MyLibrary

dotnet tool restore
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

`preferNameDirectory` creates `MyCompany.MyLibrary/`, and `sourceName = Template.Library` replaces the neutral identity across generated projects, namespaces, solution, references, and NuGet `PackageId`.

To control the output directory explicitly:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary -o ./MyCompany.MyLibrary
```

## Technical baseline

Generated output includes, among other guarantees:

- **Build:** .NET 10, `.slnx` solution, nullable, implicit usings, warnings as errors, SDK/security analyzers, code style in the build, and deterministic builds.
- **SDK and dependencies:** `global.json`, Central Package Management, `packages.lock.json`, `--locked-mode` restore, and NuGet Audit failing for High/Critical vulnerabilities.
- **Tests and quality:** xUnit v3 on Microsoft Testing Platform, AwesomeAssertions, NSubstitute, Coverlet MTP, `dotnet format`, package-consumer validation, and optional SonarQube Cloud.
- **Packaging:** `.nupkg` + `.snupkg`, XML documentation, package README, portable PDB, Source Link, and native SDK Package Validation.
- **CI and security:** CodeQL, Dependency Review, Dependabot, least-privilege workflow permissions, SHA-pinned actions, and checkout without persisted credentials.
- **Versioning and release:** Semantic Versioning, centralized base version, manual release validation before publication, release candidate manifest/checksums, and NuGet.org Trusted Publishing through GitHub OIDC.
- **Governance:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, and template-specific validation automation.

Release, supply-chain, OIDC, package-validation, and E2E details live in the [advanced reference](docs/advanced-reference.md).

## Install, update, and remove

Install/update from the primary public registry:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
```

For exact reproduction across machines or builds:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template@1.2.0
```

To remove it:

```bash
dotnet new uninstall RodriOliveira.DotNet.Library.Template
```

Official releases also mirror the template to GitHub Packages; authenticated source configuration and publication details are in the [advanced reference](docs/advanced-reference.md).

## GitHub Template Repository

Use this flow when you want the repository to exist on GitHub before generating the library:

```text
Use this template
→ Create a new repository
→ configure INITIALIZE_REPOSITORY_TOKEN
→ Actions
→ Initialize repository
→ Run workflow
→ project_name = MyCompany.MyLibrary
```

GitHub does not execute `.template.config/template.json` during **Use this template**. The `Initialize repository` workflow then runs `dotnet new rodri-lib`, validates the generated output, and opens an initialization pull request while preserving rulesets/branch protection.

The temporary token needs **Contents: Read and write**, **Pull requests: Read and write**, and **Workflows: Read and write** on the destination repository. Token creation, troubleshooting, and the post-initialization checklist are documented in [GitHub Template Repository — advanced reference](docs/advanced-reference.md).

## Clone + local install

Use this only for maintenance, local testing, or contribution:

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

The full template evolution and validation workflow is documented in [docs/template-development.md](docs/template-development.md).

## Package and project identities

- **`RodriOliveira.DotNet.Library.Template`** is the public NuGet Template Package installed by `dotnet new install`.
- **`Template.Library`** is only the neutral source-repository identity and placeholder package used for validation; it is not the public template package.
- The value supplied through `-n` or `project_name` becomes the canonical generated library identity, including its NuGet `PackageId`, with no automatic owner prefix.

See the [generated project identity contract](docs/project-identity.md).

## Documentation map

- [Advanced reference](docs/advanced-reference.md) — GitHub Template, release/publication, Trusted Publishing/OIDC, supply chain, package validation, versioning, and operational validation.
- [Template development](docs/template-development.md) — internal maintenance, NuGet Template Package architecture, E2E validation, and evolution rules.
- [Repository administration](docs/repository-administration.md) — recommended GitHub settings, rulesets, and security baseline.
- [Project identity contract](docs/project-identity.md) — naming rules and CLI/GitHub Template parity.
- [Dependency maintenance](docs/dependency-maintenance.md) — SDK, NuGet, and update automation.
- [SonarQube Cloud](docs/sonarqube-cloud.md) — setup, Quality Gate, coverage, forks, and troubleshooting.
- [Generated library README](docs/library-readme.md) — documentation renamed to `README.md` after generation.
- [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Distributed under the [MIT License](LICENSE).
