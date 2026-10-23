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

The local tool manifest includes SonarScanner for .NET and ADR Guard. Installing/restoring SonarScanner does not enable SonarQube Cloud analysis by itself; that integration remains opt-in through the `SONAR_TOKEN` repository secret.

## Architecture decisions and VS Code workspace

ADR Guard validates the structure and lifecycle of Architecture Decision Records (ADRs) kept in `docs/adr`. It does not decide whether a technical choice is correct. The CLI is pinned in the local tool manifest, so no global installation is required:

```bash
dotnet tool restore
dotnet tool run adr-guard -- --version
dotnet tool run adr-guard -- check docs/adr
```

Create an extended canonical ADR, replace every prompt with the real context and trade-offs, and validate it before committing:

```bash
dotnet tool run adr-guard -- new docs/adr --title "Decision title" --template extended
dotnet tool run adr-guard -- check docs/adr
```

Open `Template.Library.code-workspace` in VS Code. It selects `Template.Library.slnx`, uses portable UTF-8/LF and C# formatting settings, and recommends C# Dev Kit, YAML, and the optional ADR Guard extension. All individual and aggregate tasks live together in `.vscode/tasks.json`, so their `dependsOn` references share the same folder scope. The tasks available from **Tasks: Run Task** are:

- `.NET: Restore Tools`
- `.NET: Restore Dependencies`
- `.NET: Build Release`
- `.NET: Test Release`
- `.NET: Coverage`
- `.NET: Pack Release`
- `ADR Guard: Check`
- `ADR Guard: Index`
- `Workspace: Validate All`

`ADR Guard: Check` is read-only. `ADR Guard: Index` writes or updates `docs/adr/README.md` and therefore runs only when explicitly selected. `Workspace: Validate All` excludes indexing and runs the deterministic restore, ADR validation, build, test, coverage, and pack steps in sequence.

The extension `rodrioliveira.adr-guard` and the `RodriOliveira.AdrGuard` CLI are separate distributions. The extension searches for an executable in its local or remote extension-host environment and may not automatically see a CLI restored only through the repository manifest. If discovery fails, configure the machine-scoped `adrGuard.cli.path` to a trusted absolute executable path on that host. A machine-specific path is intentionally not committed. The baseline does not enable AI-assisted drafting or review.

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

Before publishing a real package, replace the placeholder package metadata in `src/Template.Library/Template.Library.csproj`, especially `Authors` and `Description`.

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

With no release override, build and pack resolve version **1.0.0**. For a release, the manual `version` input becomes the source of truth, the workflow derives the matching Git tag, and `.github/workflows/release.yml` passes the value through the single MSBuild `Version` property:

```text
1.0.0           -> tag v1.0.0          -> Version 1.0.0
1.2.3           -> tag v1.2.3          -> Version 1.2.3
1.3.0-beta.1    -> tag v1.3.0-beta.1   -> Version 1.3.0-beta.1
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

Any mismatch fails before any tag, GitHub Release, NuGet credential exchange, or external publication occurs.

Before cutting a stable release, move relevant entries from the `Unreleased` section of `CHANGELOG.md` into the corresponding release section when applicable. The changelog is intentionally not rewritten automatically by the workflow.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It restores tools, runs `adr-guard check docs/adr`, restores locked dependencies, verifies formatting, builds in Release, runs tests, collects Cobertura coverage, packs and validates the NuGet package, and publishes two downloadable workflow artifacts:

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

### Required SonarQube Cloud setup

Use this baseline when enabling the integration:

1. Create or import the repository project in SonarQube Cloud and bind it to the GitHub repository.
2. Disable **Automatic Analysis** for that Sonar project; this repository uses CI-based analysis so the scanner can import .NET coverage and enforce the same build contract as GitHub Actions.
3. Add repository secret `SONAR_TOKEN` with a token authorized to analyze that project.
4. If the derived coordinates do not match the Sonar project, configure `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, and optionally `SONAR_HOST_URL` under **Settings → Secrets and variables → Actions → Variables**.
5. Configure Sonar **New Code** to use **Previous Version** when you want release-based baselines. The workflow sends `sonar.projectVersion` from the highest reachable release tag using SemVer precedence and falls back to MSBuild `PackageVersion` before the first release.
6. Use **Sonar way** or an intentional custom Quality Gate. The workflow uses `sonar.qualitygate.wait=true` with a 300-second timeout, so an evaluated failed gate fails the GitHub Actions job on pull requests and pushes to `main`.
7. Open a pull request and confirm the Sonar analysis, OpenCover import, and Quality Gate result appear in SonarQube Cloud before making the Sonar check required in branch protection.

The workflow uses the locally pinned SonarScanner for .NET, locked restore, a non-incremental Release build, tests, and Coverlet MTP output in OpenCover format. The OpenCover report is imported through:

```text
sonar.cs.opencover.reportsPaths=**/coverage.opencover*.xml
```

This does not replace the Cobertura artifact produced by the primary CI workflow.

The workflow intentionally keeps repository and release-governance scripts under `scripts/**` in Sonar analysis. Do not add a broad `sonar.exclusions=scripts/**` rule merely to affect metrics; use a narrow coverage exclusion only when a specific file should genuinely not contribute to coverage.

### Fork pull requests

GitHub does not expose repository secrets such as `SONAR_TOKEN` to workflows triggered by pull requests from forks. In that scenario the Sonar workflow emits a warning and completes the disabled path without running the scanner or Quality Gate.

A green Sonar check on a fork pull request therefore does **not** prove that Sonar evaluated the contribution. Do not use that check as the only required quality gate for untrusted fork contributions, and do not naively switch to `pull_request_target` while checking out or executing untrusted fork code with repository secrets.

Repository secrets, Repository Variables, Sonar projects, Quality Gates, and branch-protection settings are administrative settings and are not inherited when another repository is created from this template. A generated repository therefore remains fully usable without Sonar until `SONAR_TOKEN` is configured.

For the complete configuration and troubleshooting reference, see [docs/sonarqube-cloud.md](docs/sonarqube-cloud.md). A Portuguese version is available at [docs/sonarqube-cloud.pt-BR.md](docs/sonarqube-cloud.pt-BR.md).

## Release and NuGet publishing

`.github/workflows/release.yml` provides the release path for generated libraries. It supports pull-request validation and manual release runs.

### Recommended: run the Release workflow manually

1. Open the repository **Actions** tab.
2. Select the **Release** workflow.
3. Click **Run workflow**.
4. Select branch **main**.
5. Enter **version** without a leading `v`, for example `1.0.0` or `1.1.0-beta.1`.
6. Keep **publish=false** to validate without external mutations, or select **publish=true** for official publication.
7. Start the workflow.

Pull requests and manual runs with `publish=false` restore dependencies in locked mode, verify formatting, resolve the requested version through MSBuild, build, test, pack, validate package and assembly metadata, generate `release-manifest.json` and `SHA256SUMS`, and upload a single `release-candidate-<version>` artifact. They do not create tags, create GitHub Releases, request NuGet OIDC credentials, or run `dotnet nuget push`.

With `publish=true`, the workflow requires `refs/heads/main`, rejects a conflicting existing tag before the expensive build, downloads the same candidate validated by the build job, verifies version, tag, commit, manifest, and SHA-256 checksums, attests the artifacts, creates or resumes a draft GitHub Release, and finalizes it only after all enabled publication steps succeed. If NuGet publication is enabled and fails, the release remains draft and the workflow fails.

### NuGet publication opt-in

NuGet.org publication is explicitly **opt-in through `publish=true` and the `NUGET_USER` Repository Variable**. The workflow enables NuGet publication only when:

```text
publish=true
AND refs/heads/main
AND validated artifact matches version/tag/commit
AND NUGET_USER is configured and non-empty
```

When the gate is true, the workflow exchanges a GitHub OIDC token through `NuGet/login@v1`, publishes the validated `.nupkg` to NuGet.org, and finalizes the GitHub Release after publication succeeds.

When `NUGET_USER` is absent, empty, or contains only whitespace, the workflow skips NuGet login and `dotnet nuget push`. `publish=false` still works as validation, and `publish=true` can still create and finalize the validated GitHub Release without NuGet.org publication.

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

If you do not want this repository to publish to NuGet.org, leave `NUGET_USER` undefined. The release workflow can still publish GitHub Releases with `publish=true`; no dummy value is required.

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

`NUGET_USER` is both the nuget.org profile name used by Trusted Publishing and one part of the explicit NuGet publication gate. A repository can validate release candidates without defining it.

The workflow creates or resumes a draft GitHub Release before any enabled NuGet publication and finalizes it only after NuGet succeeds or after NuGet is skipped because it is not configured. If NuGet authentication or publication fails after publication has been enabled, the draft remains draft, preventing the repository from advertising a NuGet publication that did not complete.

## Repository structure

```text
.
├── .adrguard.yml
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       ├── dependency-review.yml
│       ├── release.yml
│       └── sonar.yml
├── .vscode/
│   ├── extensions.json
│   ├── settings.json
│   └── tasks.json
├── docs/
│   └── adr/
│       └── 0001-adopt-adr-guard-for-architecture-decisions.md
├── scripts/
│   ├── release-candidate.cs
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
├── Template.Library.code-workspace
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
