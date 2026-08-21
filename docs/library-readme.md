# Template.Library

Reusable .NET 10 class library with a production-ready baseline for build, tests, dependency management, packaging, and repository governance.

## Requirements

- .NET SDK 10
- Git

Check the installed SDK with:

```bash
dotnet --version
```

## Restore

Restore local .NET tools and locked package dependencies from the repository root:

```bash
dotnet tool restore
dotnet restore --locked-mode
```

## Build

```bash
dotnet build --configuration Release --no-restore
```

The shared build policies enable nullable reference types, implicit usings, deterministic builds, NuGet auditing, package lock files, and warnings as errors.

## Test

```bash
dotnet test --configuration Release --no-build
```

Tests use xUnit v3 on Microsoft Testing Platform, AwesomeAssertions, and NSubstitute.

## Coverage

```bash
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

## Pack

```bash
dotnet pack src/Template.Library/Template.Library.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
```

The project generates a `.nupkg` plus a `.snupkg` containing portable PDB symbols. XML documentation and Source Link metadata are included in the packaging baseline.

Before publishing a real package, replace the placeholder package description in `src/Template.Library/Template.Library.csproj` with a description of the library.

## Validate the package

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

The verifier checks package identity, metadata, XML documentation, symbols, repository metadata, and Source Link information.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It restores tools and locked dependencies, verifies formatting, builds in Release, runs tests, collects Cobertura coverage, packs and validates the NuGet package, and publishes two downloadable workflow artifacts:

- `coverage` with `coverage.cobertura.xml`;
- `nuget-packages` with `.nupkg` and `.snupkg` files.

The workflow uses read-only repository permissions and cancels superseded runs for the same Git ref.

## Repository structure

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── scripts/
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
├── Template.Library.slnx
└── global.json
```

## GitHub setup after repository creation

Repository-level settings are not stored in Git, so they are not automatically recreated when this project is copied or generated. Review the target repository settings and configure what your project needs, especially:

- repository secrets used by workflows;
- branch protection or rulesets;
- environments and deployment protection rules;
- default GitHub Actions permissions;
- security features such as Dependabot alerts, code scanning, secret scanning, and push protection when available.

Never commit secret values to the repository.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected development and pull-request workflow and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

Notable consumer-facing changes should be recorded under `Unreleased` in [CHANGELOG.md](CHANGELOG.md).
