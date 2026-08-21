# Template.Library

Reusable .NET 10 class library with a production-ready baseline for build, tests, dependency management, packaging, security analysis, release automation, and repository governance.

## Requirements

- .NET SDK 10
- Git

Check the installed SDK with:

```bash
dotnet --version
```

The repository pins the expected .NET 10 SDK feature band in `global.json` while allowing roll-forward to newer .NET 10 feature bands.

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

The shared build policies enable nullable reference types, implicit usings, deterministic builds, NuGet auditing, package lock files, warnings as errors, SDK analyzers at `10-recommended`, security analyzers at `10-all`, and code style enforcement during builds.

Production code under `src/**/*.cs` also enables selected reliability/API-usage rules and low-noise performance rules. Test code keeps the shared style baseline without inheriting production-only rules that would make tests noisy.

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

The project generates a `.nupkg` plus a `.snupkg` containing portable PDB symbols. XML documentation, the project README, Source Link metadata, and native SDK Package Validation are included in the packaging baseline.

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

With no release override, build and pack resolve version **1.0.0**. For a release, the Git tag becomes the source of truth and `.github/workflows/release.yml` passes the tag-derived value through the single MSBuild `Version` property:

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
  --expected-version <release-version>
```

Any mismatch fails before the release tag is created or any external publication occurs.

Before cutting a stable release, move relevant entries from the `Unreleased` section of `CHANGELOG.md` into the corresponding release section when applicable. The changelog is intentionally not rewritten automatically by the workflow.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It restores tools and locked dependencies, verifies formatting, builds in Release, runs tests, collects Cobertura coverage, packs and validates the NuGet package, and publishes two downloadable workflow artifacts:

- `coverage` with `coverage.cobertura.xml`;
- `nuget-packages` with `.nupkg` and `.snupkg` files.

The workflow uses read-only repository permissions, pins third-party actions by SHA with version comments, avoids persisting checkout credentials for read-only jobs, and cancels superseded runs for the same Git ref.

## Security analysis

`.github/workflows/codeql.yml` runs GitHub CodeQL for C# on pull requests to `main`, pushes to `main`, and a weekly schedule. It uses CodeQL Action v4 with a manual build so the analysis follows the same reproducible .NET 10 restore/build contract as the repository baseline.

`.github/workflows/dependency-review.yml` reviews dependency changes in pull requests and blocks newly introduced High/Critical known vulnerabilities.

Use `SECURITY.md` to report suspected vulnerabilities privately. Do not open sensitive vulnerability details in public issues.

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

`.github/workflows/release.yml` provides the release path for generated libraries. There are two supported entry points.

### Recommended: run the Release workflow manually

1. Open the repository **Actions** tab.
2. Select the **Release** workflow.
3. Click **Run workflow**.
4. Select branch **main**.
5. Enter **Release version**, for example `v1.0.0` or `v1.1.0-beta.1`.
6. Start the workflow.

The workflow rejects manual releases from any ref other than the `main` branch and fails early if the requested tag already exists. It then restores dependencies in locked mode, resolves the requested version through MSBuild, builds, tests, packs, and validates package and assembly metadata.

Only after all validation succeeds does the workflow create the requested Git tag. The tag points exactly to the commit SHA validated by that workflow run. NuGet publication and GitHub Release creation happen only after this tag gate succeeds.

### Alternative: push an existing release tag

The traditional flow remains supported:

```bash
git tag v1.0.0
git push origin v1.0.0
```

For a tag-triggered execution, the workflow validates the package and verifies that the incoming tag resolves to the same commit SHA before publishing anything.

### NuGet publication opt-in

NuGet.org publication is explicitly **opt-in through the `NUGET_USER` Repository Variable**. The workflow enables NuGet publication only when:

```text
valid release
AND publishable package identity
AND NUGET_USER is configured and non-empty
```

When the gate is true, the workflow exchanges a GitHub OIDC token through `NuGet/login@v1`, publishes the `.nupkg`/`.snupkg` to NuGet.org, and creates the GitHub Release after publication succeeds.

When `NUGET_USER` is absent, empty, or contains only whitespace, the release still succeeds: the workflow does **not** start `NuGet/login@v1`, does not request a publication credential, and does not execute `dotnet nuget push`. The Git tag and GitHub Release are still created. For a real package, the `.nupkg` and `.snupkg` artifacts are attached to the GitHub Release even though they were not published to NuGet.org.

### Configure `NUGET_USER` in GitHub

`NUGET_USER` is a **Repository Variable**, not a Repository Secret. If it does not exist yet:

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Open **Secrets and variables** → **Actions**.
4. Select the **Variables** tab.
5. Click **New repository variable**.
6. Set **Name** to:

   ```text
   NUGET_USER
   ```

7. Set **Value** to the nuget.org profile name/username that owns or publishes the package and is referenced by the Trusted Publishing setup.
8. Save the variable.

If you do not want this repository to publish to NuGet.org, simply leave `NUGET_USER` undefined. No dummy value is required.

### Configure NuGet.org Trusted Publishing

The workflow uses NuGet.org **Trusted Publishing** with GitHub OIDC instead of storing a long-lived `NUGET_API_KEY`.

To enable NuGet publication:

1. Sign in to nuget.org and create a Trusted Publishing policy for this GitHub repository.
2. Set the policy workflow file to:

   ```text
   .github/workflows/release.yml
   ```

3. Configure the GitHub Repository Variable `NUGET_USER` using the steps above.
4. Ensure the package ID and package metadata are correct before starting the release.

`NUGET_USER` is both the nuget.org profile name used by Trusted Publishing and the explicit NuGet publication-enablement flag. A repository can use the full tag and GitHub Release automation without defining it.

If NuGet authentication or publication fails after publication has been enabled, the GitHub Release job does not run, preventing the repository from advertising a NuGet publication that did not complete.

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
├── SECURITY.md
├── Template.Library.slnx
└── global.json
```

## GitHub setup after repository creation

Repository-level settings are not stored in Git, so they are not automatically recreated when this project is copied or generated. Review the target repository settings and configure what your project needs, especially:

- the NuGet.org Trusted Publishing policy for `.github/workflows/release.yml` if NuGet publication is desired;
- the `NUGET_USER` Repository Variable under **Settings → Secrets and variables → Actions → Variables** to opt in to NuGet publication;
- optional SonarQube Cloud secret `SONAR_TOKEN` and any `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, or `SONAR_HOST_URL` overrides;
- branch protection or rulesets;
- environments and deployment protection rules, if your project adds them;
- default GitHub Actions permissions;
- security features such as Dependabot alerts, code scanning, secret scanning, and push protection when available.

Never commit secret values to the repository.

Trimming and Native AOT compatibility are intentionally not promised by default. Enable those analyzers and package properties only when this library's public contract and implementation have been validated for those scenarios.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected development and pull-request workflow and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

Notable consumer-facing changes should be recorded under `Unreleased` in [CHANGELOG.md](CHANGELOG.md).
