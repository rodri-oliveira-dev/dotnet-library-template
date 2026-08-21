# Template.Library

Reusable .NET 10 class library with a production-ready baseline for build, tests, dependency management, packaging, security analysis, release automation, and repository governance.

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

The verifier checks package identity, metadata, XML documentation, symbols, repository metadata, and Source Link information. Release automation also passes `--expected-version` so the package version must match the release tag before publication.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It restores tools and locked dependencies, verifies formatting, builds in Release, runs tests, collects Cobertura coverage, packs and validates the NuGet package, and publishes two downloadable workflow artifacts:

- `coverage` with `coverage.cobertura.xml`;
- `nuget-packages` with `.nupkg` and `.snupkg` files.

The workflow uses read-only repository permissions and cancels superseded runs for the same Git ref.

## Security analysis

`.github/workflows/codeql.yml` runs GitHub CodeQL for C# on pull requests to `main`, pushes to `main`, and a weekly schedule. It uses CodeQL Action v4 with a manual build so the analysis follows the same reproducible .NET 10 restore/build contract as the repository baseline.

`.github/workflows/dependency-review.yml` reviews dependency changes in pull requests and blocks newly introduced High/Critical known vulnerabilities.

## Release and NuGet publishing

`.github/workflows/release.yml` provides the release path for generated libraries.

A push of a tag such as:

```bash
git tag v1.2.3
git push origin v1.2.3
```

validates the SemVer tag, restores dependencies in locked mode, builds, tests, packs with package version `1.2.3`, validates Source Link and the package version, publishes the package and `.snupkg` symbols to NuGet.org, and then creates the GitHub Release with those artifacts.

Manual `workflow_dispatch` runs are **dry-run only**: they require an explicit version such as `v1.2.3` but never publish to NuGet.org or create a GitHub Release.

### Configure NuGet.org Trusted Publishing

The workflow uses NuGet.org **Trusted Publishing** with GitHub OIDC instead of storing a long-lived `NUGET_API_KEY`.

Before the first real release:

1. Sign in to nuget.org and create a Trusted Publishing policy for this repository.
2. Set the policy workflow file to `release.yml`.
3. Add a GitHub repository variable named `NUGET_USER` containing the nuget.org profile name that owns/publishes the package.
4. Ensure the package ID and package metadata are correct before creating the release tag.

`NUGET_USER` is a repository variable, not an API key. The workflow requests a short-lived credential through `NuGet/login@v1` only when a real tag release is ready to publish.

If NuGet authentication or publication fails, the GitHub Release job does not run, preventing a partially completed release.

## Repository structure

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       ├── dependency-review.yml
│       └── release.yml
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

- the NuGet.org Trusted Publishing policy for `release.yml`;
- the `NUGET_USER` repository variable;
- branch protection or rulesets;
- environments and deployment protection rules, if your project adds them;
- default GitHub Actions permissions;
- security features such as Dependabot alerts, code scanning, secret scanning, and push protection when available.

Never commit secret values to the repository.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected development and pull-request workflow and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

Notable consumer-facing changes should be recorded under `Unreleased` in [CHANGELOG.md](CHANGELOG.md).
