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
- base development version: `1.0.0`.

Keep the parameter surface intentionally small. Add a new parameter only when there is a concrete reusable need and an automated generation test for it.

## Generated content versus maintenance-only content

Most versioned files belong in generated libraries: source, tests, shared build/version policies, Central Package Management, package lock files, governance files, CI/security/quality/release workflows, local tool manifests, and package verification tooling.

The following content exists only to maintain the source template and is excluded from `dotnet new` output:

- `.template.config/**`;
- `.github/workflows/template-validation.yml`;
- `.github/workflows/sonar-template-validation.yml`;
- `.github/workflows/versioning-validation.yml`;
- `docs/template-development.md`;
- `docs/repository-administration.md`;
- the template repository `README.md`.

`docs/library-readme.md` is source content for generated projects. During generation it is renamed to `README.md`, so users of a generated library receive project-oriented documentation instead of maintenance instructions for the source template.

The GitHub Template Repository feature performs a direct repository copy and does not evaluate `.template.config/template.json`. Therefore it does not perform `sourceName` replacement or template-engine exclusions. Users who need automatic renaming should prefer the `dotnet new` flow. A repository created with GitHub's `Use this template` button should follow the post-creation checklist in the root README.

## Adding or removing files

When adding a file, decide which category it belongs to:

1. **Generated project content** — leave it included by the source mapping in `template.json`.
2. **Template maintenance only** — add it to the `exclude` list in `template.json`.
3. **Generated under another path/name** — add an explicit entry to `sources[].rename`.

Do not globally exclude `packages.lock.json`. The generated project is expected to support `dotnet restore --locked-mode` immediately.

After changing includes, excludes, renames, or reusable workflows, run the generation validation before opening a pull request.

## Validate the source repository

From a clean checkout:

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

`.github/workflows/ci.yml` performs the equivalent baseline checks automatically. It also publishes a Cobertura report as the `coverage` artifact and the generated `.nupkg`/`.snupkg` files as the `nuget-packages` artifact.

`.github/workflows/codeql.yml` is intentionally separate from CI. It initializes CodeQL for C# with `build-mode: manual`, restores dependencies in locked mode, builds the Release solution, and uploads analysis results with only `contents: read` and `security-events: write` permissions.

`.github/workflows/dependency-review.yml` reviews only dependency deltas introduced by pull requests and blocks new High/Critical known vulnerabilities.

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

Published releases use the Git tag as source of truth. `release.yml` validates `vMAJOR.MINOR.PATCH[-prerelease]`, removes only the leading `v`, and passes exactly one release override:

```text
-p:Version=<tag-without-v>
```

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

`scripts/verify-package.cs --expected-version` validates all of those values from the packaged artifact itself, not only the filename. A mismatch must fail before any external authentication or publication.

`.github/workflows/versioning-validation.yml` is maintenance-only and proves:

- base version `1.0.0` resolves from one shared source;
- no project-level duplicate version properties exist;
- a generated `Validation.SampleLibrary` inherits the version contract;
- stable `1.2.3` produces matching `.nupkg`/`.snupkg` plus assembly metadata;
- prerelease `1.3.0-beta.1` behaves equivalently;
- an expected-version mismatch is rejected;
- the maintenance workflow itself is not copied to generated projects.

Keep the versioning validation workflow excluded in `.template.config/template.json`.

## Release workflow

`.github/workflows/release.yml` is reusable generated-project content. It has two activation modes:

- a pushed SemVer tag (`vMAJOR.MINOR.PATCH` or prerelease) is a real release;
- `workflow_dispatch` requires an explicit version and is always a dry-run.

The first baseline release version is `1.0.0`, corresponding to tag `v1.0.0`.

The build job validates the tag, restores in locked mode, resolves package identity and MSBuild `Version`/`PackageVersion`, builds, tests, packs using the tag-derived `Version`, then runs:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version <version-without-v>
```

Real publication uses NuGet.org Trusted Publishing via GitHub OIDC and `NuGet/login@v1`. The generated repository must configure a Trusted Publishing policy for `release.yml` and a repository variable named `NUGET_USER` with the nuget.org profile name.

The template intentionally does **not** store or request a long-lived `NUGET_API_KEY`.

### Placeholder publication guard

The source template must be able to validate a release without ever publishing its neutral package identity. At the same time, the guard itself must not carry source-repository names or IDs into generated projects.

`release.yml` therefore resolves the actual `PackageId` and compares it to the neutral placeholder. The placeholder is assembled from separate shell string fragments (`"Template"`, `"."`, `"Library"`) so the template engine does not replace that comparison when generating a project.

This gives the desired behavior:

- in the source template, `PackageId` is the placeholder, so `safe-to-publish=false` and external publishing jobs are skipped;
- in a direct GitHub Template copy that has not yet been renamed, the same protection remains active;
- in a project created via `dotnet new`, the project/package identity is replaced with the generated library name, while the neutral comparison remains unchanged, so publication is allowed after Trusted Publishing is configured.

This mechanism blocks the source package without embedding repository-specific metadata in reusable output.

The GitHub Release job depends on successful NuGet publication, preventing a GitHub Release from being created after a failed NuGet authentication/push.

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

`.github/workflows/versioning-validation.yml` complements both with the SemVer contract: base `1.0.0`, stable override, prerelease override, packaged assembly metadata, and a negative mismatch case.

Release changes must additionally confirm that `release.yml` is copied to generated projects, that project paths inside it follow the generated identity, that the neutral placeholder guard remains intact, and that no source-repository name or ID is introduced into the generated workflow.

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

When commands, paths, generated content, versioning, repository settings, workflows, external quality integration, release authentication, or template exclusions change, update both the root README and this document in the same pull request. Keep the root README focused on consuming the template; keep implementation details here.
