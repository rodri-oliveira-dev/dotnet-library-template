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
- target framework baseline: `net10.0`.

Keep the parameter surface intentionally small. Add a new parameter only when there is a concrete reusable need and an automated generation test for it.

## Generated content versus maintenance-only content

Most versioned files belong in generated libraries: source, tests, shared build policies, Central Package Management, package lock files, governance files, the main CI workflow, the CodeQL security workflow, and package verification tooling.

The following content exists only to maintain the source template and is excluded from `dotnet new` output:

- `.template.config/**`;
- `.github/workflows/template-validation.yml`;
- `docs/template-development.md`;
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
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

`.github/workflows/ci.yml` performs the equivalent baseline checks automatically. It also publishes a Cobertura report as the `coverage` artifact and the generated `.nupkg`/`.snupkg` files as the `nuget-packages` artifact. The strict Source Link option is appropriate here because the source template is expected to be built from a real Git checkout with repository metadata.

`.github/workflows/codeql.yml` is intentionally separate from CI. It initializes CodeQL for C# with `build-mode: manual`, restores dependencies in locked mode, builds the Release solution, and uploads analysis results with only `contents: read` and `security-events: write` permissions.

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
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

`PublishRepositoryUrl` and Source Link depend on Git repository metadata. To validate them strictly, initialize the generated directory as a repository, create a commit, configure a remote URL, rebuild/repack, and run:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

The automated E2E workflow performs this Git initialization and strict Source Link check for you.

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

## Automated generation test

`.github/workflows/template-validation.yml` automates the development sample described above. It installs the template from the current checkout, confirms the CLI registration, generates `Validation.SampleLibrary`, checks the expected paths and exclusions, confirms that reusable CI/security workflows are present and parametrized, initializes a temporary Git repository with a remote, restores locked dependencies, formats, builds, tests, packs, validates Source Link, and fails on leaked template/reference identities.

The workflow is intentionally separate from `.github/workflows/ci.yml` and `.github/workflows/codeql.yml` so failures in the source baseline, security analysis, and template generation remain distinguishable in GitHub Actions.

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

The automated workflow also attempts to uninstall the template at the end so the lifecycle remains explicit.

## Documentation checks

When commands, paths, generated content, repository settings, workflows, or template exclusions change, update both the root README and this document in the same pull request. Keep the root README focused on consuming the template; keep implementation details here.
