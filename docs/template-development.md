# Template development

This document is for maintainers of the reusable template repository. It is intentionally excluded from projects generated with `dotnet new rodri-lib`.

## Why `Template.Library` exists

`Template.Library` is the neutral source identity of the runnable template. The template engine uses it as `sourceName` and replaces it with the value passed through `-n`/`--name`.

For example:

```bash
dotnet new rodri-lib -n Example.MyLibrary
```

The replacement applies to matching file names, directory names, and file contents, including the solution, project files, namespaces, project references, package metadata, tests, workflows, and the package verification script.

Do not replace `Template.Library` in the source repository with a product-specific name. Add new occurrences only when they represent identity that should follow the generated library name.

## Template configuration

The custom template is defined in `.template.config/template.json`.

The stable identifiers are:

- identity: `RodriOliveira.DotNet.Library`;
- short name: `rodri-lib`;
- source name: `Template.Library`;
- target framework baseline: `net10.0`;
- SDK feature band: `10.0.303` with `latestFeature` roll-forward;
- base development version: `1.0.0`.

Keep the parameter surface intentionally small. Add a new parameter only when there is a concrete reusable need and an automated generation test for it.

## Generated content versus maintenance-only content

Most versioned files belong in generated libraries: source, tests, shared build/version policies, Central Package Management, package lock files, governance files, `SECURITY.md`, CI/security/quality/release workflows, local tool manifests, agent instructions, release helper scripts, and package verification tooling.

The following content exists only to maintain the source template and is excluded from `dotnet new` output:

- `.template.config/**`;
- `.github/workflows/initialize-repository.yml`;
- `.github/workflows/template-validation.yml`;
- `.github/workflows/sonar-template-validation.yml`;
- `.github/workflows/versioning-validation.yml`;
- `.github/workflows/release-publishing-validation.yml`;
- `.github/workflows/github-template-initialization-validation.yml`;
- `docs/template-development.md`;
- `docs/repository-administration.md`;
- `scripts/initialize-repository.sh`;
- the template repository `README.md` and `README.en.md`.

`docs/library-readme.md` is source content for generated projects. During generation it is renamed to `README.md`, so users of a generated library receive project-oriented documentation instead of maintenance instructions for the source template.

## GitHub Template Repository initializer

GitHub's `Use this template` feature performs a direct repository copy and does not evaluate `.template.config/template.json`. The one-time initializer exists to make that copied repository converge to the same content a user would receive from:

```bash
dotnet new install .
dotnet new rodri-lib -n MyCompany.MyLibrary
```

The initializer must call the real .NET template engine. Do not duplicate `sourceName`, `exclude`, `rename`, or `preferNameDirectory` behavior in shell, YAML, C#, or documentation examples. `.template.config/template.json` remains the single source of truth for generated content.

Bootstrap-only files are:

- `.github/workflows/initialize-repository.yml`;
- `.github/workflows/github-template-initialization-validation.yml`;
- `scripts/initialize-repository.sh`.

They must stay excluded from direct `dotnet new` output. In a repository created with GitHub Template Repository, GitHub copies them initially, the user runs **Initialize repository**, and the replacement with canonical `dotnet new` output removes them from the final initialized repository.

`scripts/initialize-repository.sh` owns the destructive filesystem operation. Its contract is:

- validate the project name before generation;
- reject empty names, whitespace-only names, path traversal, path separators, control characters, and invalid dotted .NET identifiers;
- reject execution against `rodri-oliveira-dev/dotnet-library-template`;
- reject GitHub Actions execution when the selected ref is not the repository default branch;
- verify that the destination still looks like an uninitialized GitHub Template copy;
- verify that the template source contains `.template.config/template.json`;
- install and execute the current `rodri-lib` template into an isolated temporary directory;
- validate the temporary output shape and absence of maintenance-only files before touching the destination;
- replace the destination tree only after generation succeeds;
- preserve `.git/**` and no other source-template-only state by default;
- validate the final destination tree after replacement;
- return a non-zero exit code for every rejected or ambiguous state.

`.github/workflows/initialize-repository.yml` orchestrates the GitHub path. Its `GITHUB_TOKEN` permission is limited to `contents: read`, and the final push requires repository secret `INITIALIZE_REPOSITORY_TOKEN` with target-repository `Contents: write` and `Workflows: write`. That explicit token is necessary because a successful initialization removes workflow files, and GitHub rejects workflow-file changes from credentials without workflow-write permission. The workflow keeps checkout credentials from being persisted, fails before generation when the initialization token is missing, invokes the helper, runs locked restore, format verification, Release build, tests, pack, package verification, commits the generated changes, and pushes to the selected default branch. The workflow should fail with actionable output when the token, rulesets, or branch protection prevent that one-time push; it must not weaken repository security settings automatically.

`.github/workflows/github-template-initialization-validation.yml` is the E2E parity test. It should:

- create a simulated GitHub Template copy of the repository without `.git`;
- generate a canonical project directly with `dotnet new rodri-lib -n Validation.SampleLibrary`;
- run the same initializer helper against the simulated copy;
- compare the initialized tree to the canonical direct output;
- assert that maintenance/bootstrap-only files are absent;
- assert that `Template.Library` does not leak into generated content;
- cover invalid project names, source-repository execution, non-default-branch execution, missing template source, and failed generation before replacement;
- initialize Git metadata for the output and validate restore, format, build, tests, pack, package verification, and Source Link.

When maintainers change `template.json`, initializer logic, exclusions, rename rules, reusable workflows, or generated repository structure, they must keep this parity workflow updated. A passing direct `dotnet new` validation is not enough when the GitHub Template initializer behavior is affected.

## Adding or removing files

When adding a file, decide which category it belongs to:

1. **Generated project content** — leave it included by the source mapping in `template.json`.
2. **Template maintenance only** — add it to the `exclude` list in `template.json`.
3. **Generated under another path/name** — add an explicit entry to `sources[].rename`.

Do not globally exclude `packages.lock.json`. The generated project is expected to support `dotnet restore --locked-mode` immediately.

After changing includes, excludes, renames, reusable workflows, or release helper scripts, run the generation validation before opening a pull request.

## Validate the source repository

From a clean checkout:

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

`.github/workflows/ci.yml` performs the equivalent baseline checks automatically. It also publishes a Cobertura report as the `coverage` artifact and the generated `.nupkg`/`.snupkg` files as the `nuget-packages` artifact.

`.github/workflows/codeql.yml` is intentionally separate from CI. It initializes CodeQL for C# with `build-mode: manual`, restores dependencies in locked mode, builds the Release solution, and uploads analysis results with only `contents: read` and `security-events: write` permissions.

`.github/workflows/dependency-review.yml` reviews only dependency deltas introduced by pull requests and blocks new High/Critical known vulnerabilities.

## Analyzer, SDK and packaging baseline

`Directory.Build.props`, `.editorconfig`, `global.json`, and the packable library project jointly define the reusable engineering baseline. Generated projects must keep:

- `AnalysisLevel=10-recommended`;
- `AnalysisLevelSecurity=10-all`;
- `EnforceCodeStyleInBuild=true`;
- `EnablePackageValidation=true` on the packable library;
- `global.json` pinned to the .NET 10 SDK feature band with `rollForward=latestFeature`;
- Microsoft Testing Platform selection under the `test` section of `global.json`.

Production-only reliability and performance rules belong under `[src/**/*.cs]` in `.editorconfig`. Keep `CA1859` as a suggestion so the template does not force concrete implementation types into public API decisions for micro-optimization reasons.

Do not enable trimming or Native AOT package properties globally. Those properties are compatibility promises and should be added only by a concrete library that has validated that contract.

## GitHub Actions hardening

Reusable workflows must pin eligible actions by full commit SHA and keep a nearby version comment, for example:

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
```

Read-only checkouts should set `persist-credentials: false`. The release tag job is the intentional exception because it must create or verify a Git tag using the workflow token.

Dependabot remains configured for the `github-actions` ecosystem so it can propose version-comment/SHA updates.

## Optional SonarQube Cloud workflow

`.github/workflows/sonar.yml` is reusable generated-project content and is intentionally separate from the primary CI. It runs on pull requests to `main` and pushes to `main`, but its scanner steps are activated only when the repository secret `SONAR_TOKEN` is non-empty.

The SonarScanner for .NET is pinned in `.config/dotnet-tools.json`. Keep it as a local tool so `dotnet tool restore` remains the single reproducible tooling bootstrap for both the source template and generated libraries.

The reusable workflow must not contain source-repository Sonar coordinates. Its defaults are derived from the repository executing the workflow:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

Consumers can override those defaults through Repository Variables:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

Only `SONAR_TOKEN` is sensitive and must be a Repository Secret. Never persist or echo its value.

The analysis flow is:

```text
dotnet tool restore
dotnet restore --locked-mode
dotnet sonarscanner begin
dotnet build --configuration Release --no-restore --no-incremental
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format opencover
dotnet sonarscanner end
```

The begin step configures `sonar.cs.opencover.reportsPaths` with a wildcard that matches the timestamped OpenCover report produced by Coverlet MTP. This Sonar-specific OpenCover run does not replace the Cobertura artifact generated by `ci.yml`.

`.github/workflows/sonar-template-validation.yml` is maintenance-only. It proves the no-token opt-in path, restores the pinned scanner, generates `Validation.SampleLibrary`, verifies that `sonar.yml` and the tool manifest are copied and parametrized, checks that source Sonar coordinates do not leak, then builds/tests the generated output. Keep this workflow excluded in `.template.config/template.json`.

## Versioning contract

`Directory.Build.props` is the single version source for local/development builds:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Do not add `Version`, `VersionPrefix`, or `PackageVersion` to individual production/test project files. A generated library should immediately resolve:

```text
VersionPrefix  = 1.0.0
Version        = 1.0.0
PackageVersion = 1.0.0
```

Releases use the Git tag as source of truth. `release.yml` validates `vMAJOR.MINOR.PATCH[-prerelease]`, removes only the leading `v`, and passes exactly one release override:

```text
-p:Version=<tag-without-v>
```

For `workflow_dispatch`, the requested release version becomes the future tag value but the tag itself is not created until build, tests, pack, and package verification have succeeded. For a tag-triggered release, the existing tag must resolve to the same SHA being validated.

Do not reintroduce an independent `-p:PackageVersion` override. The SDK derives package and assembly metadata from `Version`; having two independent overrides creates competing version sources.

The expected .NET metadata contract is:

```text
1.2.3        -> PackageVersion 1.2.3
             -> AssemblyVersion/FileVersion 1.2.3.0
             -> InformationalVersion starts with 1.2.3

1.3.0-beta.1 -> PackageVersion 1.3.0-beta.1
             -> AssemblyVersion/FileVersion 1.3.0.0
             -> InformationalVersion starts with 1.3.0-beta.1
```

`InformationalVersion` may append deterministic source revision metadata with a `+` suffix.

`scripts/verify-package.cs --expected-version` validates all of those values from the packaged artifact itself, not only the filename. A mismatch must fail before a manual release tag is created and before any external authentication or publication.

`.github/workflows/versioning-validation.yml` is maintenance-only and proves:

- base version `1.0.0` resolves from one shared source;
- no project-level duplicate version properties exist;
- a generated `Validation.SampleLibrary` inherits the version contract;
- reusable release helper scripts are copied to the generated project;
- stable `1.2.3` produces matching `.nupkg`/`.snupkg` plus assembly metadata;
- prerelease `1.3.0-beta.1` behaves equivalently;
- an expected-version mismatch is rejected;
- the maintenance workflow itself is not copied to generated projects.

Keep the versioning validation workflow excluded in `.template.config/template.json`.

## Release workflow

`.github/workflows/release.yml` is reusable generated-project content. It has two real-release activation modes:

- `workflow_dispatch` from branch `main`, with an explicit SemVer release version;
- a pushed SemVer tag (`vMAJOR.MINOR.PATCH` or prerelease).

The first baseline release version is `1.0.0`, corresponding to tag `v1.0.0`.

### Manual release contract

The manual flow is designed so an invalid commit cannot acquire a release tag merely because the workflow was started.

`scripts/resolve-release-request.sh` validates the request before expensive work begins:

- event must be supported;
- `workflow_dispatch` must execute from branch `main`;
- the requested version must match `vMAJOR.MINOR.PATCH[-prerelease]`;
- the requested tag must not already exist remotely.

The build job then restores in locked mode, resolves package identity and MSBuild `Version`/`PackageVersion`, builds, tests, packs using the requested release version, and runs:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version <version-without-v>
```

Only after those steps succeed does the `ensure-release-tag` job receive `contents: write`. `scripts/ensure-release-tag.sh` performs a second remote tag-existence check to protect against races, creates the tag at exactly `${{ github.sha }}`, and pushes that tag.

This ordering is part of the release integrity contract:

```text
request validation
→ restore/build/test/pack/package validation
→ create/verify release tag
→ optional NuGet publication
→ GitHub Release
```

Do not move tag creation earlier in the pipeline.

### Existing-tag release contract

For a workflow triggered by a pushed SemVer tag, the workflow does not recreate the tag. After validating the package, `scripts/ensure-release-tag.sh` verifies that the existing tag resolves to the same `github.sha` validated by the run. A mismatch must stop publication.

### NuGet publication opt-in

NuGet.org publication uses Trusted Publishing through GitHub OIDC and `NuGet/login@v1`, but it is optional.

`NUGET_USER` is a GitHub **Repository Variable** and serves two purposes:

- the nuget.org profile name used by Trusted Publishing;
- the explicit feature flag that enables NuGet publication.

For repositories that should publish to NuGet.org, configure it in GitHub under:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

with name `NUGET_USER` and the nuget.org profile name/username as the value. The corresponding nuget.org Trusted Publishing policy must target `.github/workflows/release.yml`.

When `NUGET_USER` is absent, empty, or whitespace-only, `NuGet/login` and `dotnet nuget push` must not run. This state does **not** disable release versioning: the tag and GitHub Release still proceed.

For a real non-placeholder package, GitHub Release behavior is:

- NuGet disabled: create the GitHub Release and attach `.nupkg`/`.snupkg` after the tag gate succeeds;
- NuGet enabled: publish to NuGet first, then create the GitHub Release only if NuGet publication succeeds.

This preserves independent GitHub Releases while preventing the repository from advertising a successful NuGet distribution after a failed NuGet publication.

The template intentionally does **not** store or request a long-lived `NUGET_API_KEY`.

### Placeholder publication guard

The source template must be able to create versioned GitHub Releases without ever publishing its neutral package identity. At the same time, the guard itself must not carry source-repository names or IDs into generated projects.

`release.yml` therefore resolves the actual `PackageId` and compares it to the neutral placeholder. The placeholder is assembled from separate shell string fragments (`"Template"`, `"."`, `"Library"`) so the template engine does not replace that comparison when generating a project.

This gives the desired behavior:

- in the source template, `PackageId` is the placeholder, so `safe-to-publish=false`; tag creation/verification and GitHub Release remain allowed, but NuGet publication and `.nupkg`/`.snupkg` release attachments are skipped;
- in a direct GitHub Template copy that has not yet been renamed, the same protection remains active: GitHub Release is allowed, placeholder NuGet publication and package attachments are not;
- in a project created via `dotnet new`, the project/package identity is replaced with the generated library name, while the neutral comparison remains unchanged, so GitHub Release artifacts are allowed and NuGet publication is additionally available after Trusted Publishing plus `NUGET_USER` are configured.

The `github-release` job uses `always()` because `publish-nuget` is expected to be `skipped` whenever NuGet publication is disabled. It requires successful build/package validation and a successful release-tag gate. If NuGet publication is enabled, it additionally requires `publish-nuget.result == 'success'`.

This mechanism blocks the source package without embedding repository-specific metadata in reusable output, while still allowing this template repository to publish releases such as `v1.0.0` directly from GitHub Actions.

## Install the template locally

From the repository root:

```bash
dotnet new install .
dotnet new list rodri-lib
```

The second command should list `Rodrigo Oliveira .NET Library` with short name `rodri-lib`.

## Generate a development sample

Use a name with multiple namespace segments so replacement is exercised in paths and contents:

```bash
validation_root="$(mktemp -d)"
dotnet new rodri-lib \
  -n Validation.SampleLibrary \
  -o "$validation_root/Validation.SampleLibrary"
cd "$validation_root/Validation.SampleLibrary"
```

Then validate the generated files before repository metadata exists:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet pack src/Validation.SampleLibrary/Validation.SampleLibrary.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages --expected-version 1.0.0
```

`PublishRepositoryUrl` and Source Link depend on Git repository metadata. To validate them strictly, initialize the generated directory as a repository, create a commit, configure a remote URL, rebuild/repack, and run:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version 1.0.0
```

The automated E2E workflows perform this Git initialization and strict Source Link/version check for you.

Search for leaked source or reference identities:

```bash
grep -R -I -n -E \
  'Template\.Library|Dapper\.TypedParameters|DotNetRepoInspector|CrispyWaffle|complexity-analyzers' \
  . \
  --exclude-dir=.git \
  --exclude='*.nupkg' \
  --exclude='*.snupkg' || true
```

A valid generated project must not contain unintended matches.

## Automated generation tests

`.github/workflows/template-validation.yml` automates the general development sample described above. It installs the template from the current checkout, confirms the CLI registration, generates `Validation.SampleLibrary`, checks the expected paths and exclusions, confirms that reusable CI/security/release workflows are present and parametrized, initializes a temporary Git repository with a remote, restores locked dependencies, formats, builds, tests, packs, validates Source Link, and fails on leaked template/reference identities.

`.github/workflows/sonar-template-validation.yml` complements that E2E with the optional external-quality contract: scanner version, opt-in behavior, reusable Sonar workflow generation, coordinate parametrization, OpenCover configuration, absence of source identity leakage, and build/test of the generated sample.

`.github/workflows/versioning-validation.yml` complements both with the SemVer contract: base `1.0.0`, stable override, prerelease override, packaged assembly metadata, release helper propagation, and a negative mismatch case.

`.github/workflows/release-publishing-validation.yml` is maintenance-only. It validates the release workflow contract and uses temporary Git repositories to exercise manual-request validation, rejection outside `main`, existing-tag collision, exact-SHA tag creation, tag/SHA mismatch rejection, the `NUGET_USER` decision matrix, and propagation of the reusable release flow into a generated library.

`.github/workflows/github-template-initialization-validation.yml` is maintenance-only. It proves that a simulated GitHub Template Repository copy initialized through `scripts/initialize-repository.sh` is equivalent to direct `dotnet new` output, that bootstrap-only files self-remove, that invalid inputs and unsafe GitHub contexts fail before destructive replacement, and that the initialized output passes the generated-project restore, format, build, test, pack, and Source Link verification contract.

Release changes must additionally confirm that:

- `release.yml`, `scripts/resolve-release-request.sh`, `scripts/ensure-release-tag.sh`, and `scripts/resolve-nuget-publishing.sh` are copied to generated projects;
- project paths inside the workflow follow the generated identity;
- manual releases cannot create a tag before package validation succeeds;
- the created tag targets the exact validated SHA;
- duplicate/concurrent tag creation is rejected;
- the neutral placeholder guard remains intact;
- the placeholder route can create GitHub Release without package artifacts;
- real-package GitHub Release works when NuGet is disabled;
- when NuGet is enabled, real-package GitHub Release remains gated on successful NuGet publication;
- no source-repository name or ID is introduced into the generated workflow.

Versioning changes must confirm that `Directory.Build.props` remains the sole baseline version source, generated projects retain `VersionPrefix=1.0.0`, release uses only `Version` as the override, and stable/prerelease package metadata remains coherent.

Sonar changes must additionally confirm that `sonar.yml` is copied, that solution paths follow the generated identity, that `SONAR_TOKEN` absence remains a successful no-op, and that no source Sonar project key/organization is embedded in reusable output.

## Reinstall after template changes

When the template is already installed and you change `template.json` or generation content, reinstall it before testing:

```bash
dotnet new uninstall . || true
dotnet new install .
```

If the uninstall command does not resolve the installation by current path, list installed templates to identify the source shown by the CLI:

```bash
dotnet new uninstall
```

Then uninstall the exact source reported by the CLI and install the current checkout again.

## Uninstall when finished

From the same checkout used for installation:

```bash
dotnet new uninstall .
```

The automated workflows also attempt to uninstall the template at the end so the lifecycle remains explicit.

## Documentation checks

When commands, paths, generated content, versioning, repository settings, workflows, external quality integration, release authentication, release tag handling, or template exclusions change, update the relevant root README/documentation and this document in the same pull request. Keep the root README focused on consuming the template; keep implementation details here.
