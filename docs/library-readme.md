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

The local tool manifest includes SonarScanner for .NET. Installing/restoring the tool does not enable SonarQube Cloud analysis by itself; the integration remains opt-in through the `SONAR_TOKEN` repository secret.

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

The verifier checks package identity, metadata, XML documentation, symbols, repository metadata, and Source Link information. When `--expected-version` is supplied, it also validates the NuGet version plus `AssemblyVersion`, `FileVersion`, and `InformationalVersion` contained in the packaged assembly.

## Versioning

The library uses Semantic Versioning and has a single version source for normal local/development builds:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

That property lives in `Directory.Build.props`. Do not duplicate `<Version>`, `<VersionPrefix>`, or `<PackageVersion>` across individual `.csproj` files.

With no release override, build and pack resolve version **1.0.0**. For a published release, the Git tag becomes the source of truth and `.github/workflows/release.yml` passes the tag-derived value through the single MSBuild `Version` property:

```text
v1.0.0          -> Version 1.0.0
v1.2.3          -> Version 1.2.3
v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

The .NET SDK then derives `PackageVersion` and assembly metadata from that value. Under the baseline conventions:

```text
1.2.3          -> AssemblyVersion/FileVersion 1.2.3.0
1.3.0-beta.1   -> AssemblyVersion/FileVersion 1.3.0.0
```

`InformationalVersion` keeps the full SemVer value, including prerelease identifiers, and may include deterministic source revision metadata after a `+` suffix.

A release never requires editing the same version in multiple files. The workflow validates the resolved MSBuild version, builds, tests, packs, and runs:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version <version-from-tag>
```

Any mismatch fails before NuGet authentication/publication or GitHub Release creation.

Before cutting a stable release, move relevant entries from the `Unreleased` section of `CHANGELOG.md` into the corresponding release section when applicable. The changelog is intentionally not rewritten automatically by the workflow.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It restores tools and locked dependencies, verifies formatting, builds in Release, runs tests, collects Cobertura coverage, packs and validates the NuGet package, and publishes two downloadable workflow artifacts:

- `coverage` with `coverage.cobertura.xml`;
- `nuget-packages` with `.nupkg` and `.snupkg` files.

The workflow uses read-only repository permissions and cancels superseded runs for the same Git ref.

## Security analysis

`.github/workflows/codeql.yml` runs GitHub CodeQL for C# on pull requests to `main`, pushes to `main`, and a weekly schedule. It uses CodeQL Action v4 with a manual build so the analysis follows the same reproducible .NET 10 restore/build contract as the repository baseline.

`.github/workflows/dependency-review.yml` reviews dependency changes in pull requests and blocks newly introduced High/Critical known vulnerabilities.

## Optional SonarQube Cloud analysis

`.github/workflows/sonar.yml` provides optional SonarQube Cloud analysis for pull requests to `main` and pushes to `main`.

The integration is deliberately opt-in. If the repository secret below does not exist or is empty, the workflow reports that SonarQube Cloud is disabled and finishes successfully without starting the scanner or contacting Sonar:

```text
SONAR_TOKEN
```

For repositories imported from GitHub using SonarQube Cloud's conventional coordinates, the workflow derives defaults from the GitHub repository itself:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

These values can be overridden with GitHub Repository Variables when the Sonar project uses different coordinates:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

Typical setup:

1. Create or import the repository project in SonarQube Cloud.
2. Add repository secret `SONAR_TOKEN` with a token authorized to analyze that project.
3. If the derived coordinates do not match the Sonar project, add `SONAR_PROJECT_KEY` and/or `SONAR_ORGANIZATION` repository variables.
4. Optionally set `SONAR_HOST_URL`; otherwise `https://sonarcloud.io` is used.
5. Open a pull request or push to `main` and confirm the analysis appears in SonarQube Cloud.

The workflow uses the locally pinned SonarScanner for .NET, locked restore, a non-incremental Release build, tests, and Coverlet MTP output in OpenCover format. The OpenCover report is imported through `sonar.cs.opencover.reportsPaths`; this does not replace the Cobertura artifact produced by the primary CI workflow.

Repository secrets and Repository Variables are administrative settings and are not inherited when another repository is created from this template. A generated repository therefore remains fully usable without Sonar until `SONAR_TOKEN` is configured.

## Release and NuGet publishing

`.github/workflows/release.yml` provides the release path for generated libraries.

A push of a tag such as:

```bash
git tag v1.0.0
git push origin v1.0.0
```

always validates the SemVer tag, restores dependencies in locked mode, resolves the same version through MSBuild, builds, tests, packs, and validates package and assembly metadata.

NuGet.org publication is explicitly **opt-in through the `NUGET_USER` repository variable**. The workflow resolves a single `nuget-publishing-enabled` gate from three conditions:

```text
real tag release
AND publishable package identity
AND NUGET_USER is configured and non-empty
```

When that gate is true, the workflow exchanges a GitHub OIDC token through `NuGet/login@v1`, publishes the `.nupkg`/`.snupkg` to NuGet.org, and then creates the GitHub Release with those artifacts.

When `NUGET_USER` is absent, empty, or contains only whitespace, the validation/build/test/pack path still completes, but NuGet publication is disabled. In that case the workflow does **not** start `NuGet/login@v1`, does not request a publication credential, and does not execute `dotnet nuget push`. For a real package, the package-backed GitHub Release is also skipped so a partially completed release is not created.

Manual `workflow_dispatch` runs are **dry-run only**: they require an explicit version such as `v1.0.0` or `v1.1.0-beta.1` but never publish to NuGet.org or create a GitHub Release, regardless of `NUGET_USER`.

### Configure NuGet.org Trusted Publishing

The workflow uses NuGet.org **Trusted Publishing** with GitHub OIDC instead of storing a long-lived `NUGET_API_KEY`.

To enable real NuGet publication:

1. Sign in to nuget.org and create a Trusted Publishing policy for this repository.
2. Set the policy workflow file to `release.yml`.
3. Add a GitHub repository variable named `NUGET_USER` containing the nuget.org profile name that owns/publishes the package.
4. Ensure the package ID and package metadata are correct before creating the release tag.

`NUGET_USER` is both the nuget.org profile name used by Trusted Publishing and the explicit publication-enablement flag. A repository can use the full build/test/pack/release-validation baseline without defining it.

If NuGet authentication or publication fails after publication has been enabled, the GitHub Release job does not run, preventing a partially completed release.

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
│       ├── release.yml
│       └── sonar.yml
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
├── Template.Library.slnx
└── global.json
```

## GitHub setup after repository creation

Repository-level settings are not stored in Git, so they are not automatically recreated when this project is copied or generated. Review the target repository settings and configure what your project needs, especially:

- the NuGet.org Trusted Publishing policy for `release.yml` if NuGet publication is desired;
- the `NUGET_USER` repository variable to opt in to NuGet publication;
- optional SonarQube Cloud secret `SONAR_TOKEN` and any `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, or `SONAR_HOST_URL` overrides;
- branch protection or rulesets;
- environments and deployment protection rules, if your project adds them;
- default GitHub Actions permissions;
- security features such as Dependabot alerts, code scanning, secret scanning, and push protection when available.

Never commit secret values to the repository.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected development and pull-request workflow and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

Notable consumer-facing changes should be recorded under `Unreleased` in [CHANGELOG.md](CHANGELOG.md).
