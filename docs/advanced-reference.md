# .NET Library Template advanced reference

**English** | [Português](advanced-reference.pt-BR.md)

This reference keeps operational details out of the primary onboarding path: GitHub Template Repository initialization, release/publication, Trusted Publishing/OIDC, supply chain, Package Validation, versioning, E2E validation, and the generated-content versus template-maintenance boundary.

To create a library from the CLI, start with the [main README](../README.en.md). For internal maintenance and evolution rules, also see [template-development.md](template-development.md).

## Alternative — GitHub Template Repository

On the repository page, select **Use this template** and then **Create a new repository**. Then initialize the copy through GitHub Actions:

```text
Use this template
→ Create a new repository
→ Actions
→ Initialize repository
→ Run workflow
→ project_name = MyCompany.MyLibrary
```

GitHub **does not run** `.template.config/template.json` when it copies the repository. It only performs the initial copy. The **Initialize repository** workflow then runs the real .NET template engine inside the copy, using `dotnet new rodri-lib -n MyCompany.MyLibrary`, so `sourceName`, `exclude`, `rename`, and `preferNameDirectory` are applied from the template's authoritative configuration.

After a successful initialization:

- `Template.Library` is replaced with the provided identity;
- template-maintenance-only files are removed;
- `docs/library-readme.md` becomes the generated library `README.md`;
- the `Initialize repository` workflow and its helper remove themselves;
- changes are pushed to `initialize-repository/<project>`;
- the workflow opens a pull request to the default branch, preserving rulesets and branch protection;
- normal development continues after that pull request is merged.

Run this workflow before normal development starts in the new repository. It must be started from the default branch and fails if it is executed in the source template repository `rodri-oliveira-dev/dotnet-library-template`.

### Prerequisites and expected failures

- GitHub Actions must be enabled in the new repository;
- configure repository secret `INITIALIZE_REPOSITORY_TOKEN` before running the workflow;
- that token should be temporary and have these target-repository permissions: **Contents: Read and write**, **Pull requests: Read and write**, and **Workflows: Read and write**;
- remove or revoke `INITIALIZE_REPOSITORY_TOKEN` after successful initialization;
- rulesets may block creation/update of the initialization branch or opening/merging the pull request;
- if validation, build, tests, or packaging fail, the workflow should not commit or push a partial initialization;
- if an operation is blocked, adjust the repository rules or use an approved equivalent process without weakening security automatically.

### How to create `INITIALIZE_REPOSITORY_TOKEN`

`INITIALIZE_REPOSITORY_TOKEN` is a **Repository Secret** whose value should be a temporary **Fine-grained Personal Access Token (PAT)**. It is not copied when a new repository is created with **Use this template**, so it must be configured in the destination repository before the first workflow run.

Create the token from a GitHub account with administrative access to the destination repository:

1. open your GitHub avatar and go to **Settings**;
2. open **Developer settings** → **Personal access tokens** → **Fine-grained tokens**;
3. click **Generate new token**;
4. use a temporary name such as `Initialize MyCompany.MyLibrary`;
5. choose a short expiration, preferably only a few days;
6. under **Resource owner**, select the user or organization that owns the new repository;
7. under **Repository access**, choose **Only select repositories** and select only the repository that will be initialized;
8. under **Repository permissions**, configure:
   - **Contents** → **Read and write**;
   - **Pull requests** → **Read and write**;
   - **Workflows** → **Read and write**;
9. generate the token and copy the displayed value. GitHub may not show it again.

Then, in the **destination repository**:

1. go to **Settings** → **Secrets and variables** → **Actions**;
2. on the **Secrets** tab, click **New repository secret**;
3. use exactly this name:

```text
INITIALIZE_REPOSITORY_TOKEN
```

4. paste the Fine-grained PAT into **Secret**;
5. save the secret;
6. run **Actions** → **Initialize repository** → **Run workflow**.

The token needs `Contents: Read and write` because the initializer creates and pushes the generated initialization branch, `Pull requests: Read and write` because it automatically opens the initialization pull request, and `Workflows: Read and write` because initialization also removes/replaces files under `.github/workflows`.

After a successful initialization, delete repository secret `INITIALIZE_REPOSITORY_TOKEN` and revoke or delete the PAT under **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**. Do not reuse this token as a permanent CI credential and do not store it in version-controlled files.

### Possible initialization errors

#### `Configure repository secret INITIALIZE_REPOSITORY_TOKEN...`

```text
Configure repository secret INITIALIZE_REPOSITORY_TOKEN before running this one-time initializer.
For a fine-grained token, grant this repository Contents: write, Pull requests: write, and Workflows: write.
```

The workflow did not receive the secret. Confirm it was created under **Settings** → **Secrets and variables** → **Actions** in the **generated repository**, using the exact name `INITIALIZE_REPOSITORY_TOKEN`. Secrets from the source template repository are not copied into newly created repositories.

#### `error IMPORTS: Fix imports ordering`

```text
error IMPORTS: Fix imports ordering.
```

This can occur in copies created from older template revisions because replacing `Template.Library` with the new library name can change the lexical ordering of `using` directives. The current initializer runs `dotnet format --no-restore` after generation and then `dotnet format --verify-no-changes --no-restore`, normalizing generated output before the formatting gate.

If this error occurs in a repository created from an older revision, update `.github/workflows/initialize-repository.yml` to the current implementation or recreate the copy from the latest template revision. When the workflow itself has changed, prefer starting a **new workflow run** instead of re-running an attempt tied to the old workflow revision.

#### `fatal: could not read Username for 'https://github.com'`

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

This means `git push` could not authenticate. The current initializer uses HTTP Basic authentication with `x-access-token` and the value of `INITIALIZE_REPOSITORY_TOKEN`.

If it still occurs:

- confirm the PAT has not expired or been revoked;
- confirm **Repository access** includes the destination repository;
- confirm `Contents: Read and write` and `Workflows: Read and write`;
- confirm the secret contains the complete PAT without extra whitespace;
- if the repository copy contains an older initializer, update the workflow before running it again.

#### `Resource not accessible by personal access token (createPullRequest)`

```text
pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)
```

This error means generation and the branch push may already have succeeded, but the PAT cannot create the pull request. Edit or recreate the Fine-grained PAT and grant **Pull requests → Read and write** for the destination repository. Then update repository secret `INITIALIZE_REPOSITORY_TOKEN` and run the initializer again, or manually open the pull request from the existing `initialize-repository/<project>` branch.

#### Operation rejected by a ruleset or branch protection

The initializer does not write directly to the default branch: it pushes `initialize-repository/<project>` and opens a pull request. Rulesets can still restrict creation/update of that branch or prevent merge until required checks succeed. Adjust only the necessary rules or follow the normal review process; do not permanently disable protections just to bypass the initializer.

#### Format, build, test, pack, or package-validation failure

The initializer validates generated output before pushing it. A failure in any of these steps stops execution and prevents a partial initialization from being pushed. Fix the cause reported by the first failed step and run the workflow again. The initialization commit should only be pushed after every preceding validation succeeds.

### Post-initialization checklist

Before the first release of a library created from the GitHub Template:

- customize package description and metadata;
- review the base version in `Directory.Build.props`;
- review README, license, and public metadata;
- if NuGet.org publication is desired, configure Trusted Publishing for `.github/workflows/release.yml` and the `NUGET_USER` Repository Variable;
- [configure SonarQube Cloud](#optional-sonarqube-cloud) if analysis should be enabled;
- configure a ruleset or branch protection for `main`;
- review default GitHub Actions permissions;
- enable and verify the appropriate GitHub security features;
- configure environments or additional protection when publishing/deployment requires them.

> Administrative settings are not copied by a GitHub Template Repository. This includes secrets, variables, environments, rulesets, branch protection, Trusted Publishing policies, and other repository settings.

The recommended administrative baseline is documented in [docs/repository-administration.md](repository-administration.md).

## Validate the source template repository

From the repository root:

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

Maintenance workflows additionally validate end-to-end generation, the versioning contract, optional SonarQube Cloud integration, and the release/publication flow.

## Versioning and releases

The development baseline version is declared once in `Directory.Build.props`:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Individual projects should not duplicate `Version`, `VersionPrefix`, or `PackageVersion`.

For releases, the manual `version` input is the source of truth and the tag is derived from it:

```text
1.0.0           -> tag v1.0.0          -> Version 1.0.0
1.2.3           -> tag v1.2.3          -> Version 1.2.3
1.3.0-beta.1    -> tag v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` uses `Version` as the single release override, runs restore, format, build, test, pack, validates the placeholder package, packs and validates the real template package, runs E2E/parity checks, generates `release-manifest.json` and `SHA256SUMS`, and uploads a single `release-candidate-<version>` artifact.

### Manual release through GitHub Actions

The recommended manual-release flow is:

1. open the repository **Actions** tab;
2. select the **Release** workflow;
3. click **Run workflow**;
4. select branch **main**;
5. enter **version** without a leading `v`, for example `1.2.0` or `1.3.0-beta.1`;
6. keep **publish=false** to validate without external mutations, or select **publish=true** for official publication;
7. run the workflow.

Pull requests and manual runs with `publish=false` only build and validate the release candidate. They do not create tags, create GitHub Releases, request NuGet OIDC credentials, or run `dotnet nuget push`.

With `publish=true`, the workflow requires `refs/heads/main`, rejects a conflicting existing tag before the expensive build, downloads the same candidate validated by the build job, verifies version, tag, commit, manifest, and SHA-256 checksums, attests the artifacts, creates or resumes a draft GitHub Release, publishes the package through NuGet Trusted Publishing/OIDC, publishes the same `.nupkg` to GitHub Packages, and only then finalizes the GitHub Release. If any publication fails, the release remains draft and the workflow fails.

### NuGet.org Trusted Publishing

NuGet.org publication is explicitly **opt-in** through the `publish=true` input and the `NUGET_USER` Repository Variable. `NUGET_USER` is not a secret and identifies the nuget.org user/profile used by the Trusted Publishing policy.

To configure it when it does not exist yet:

1. open the repository on GitHub;
2. go to **Settings**;
3. open **Secrets and variables** → **Actions**;
4. select the **Variables** tab;
5. click **New repository variable**;
6. set **Name** to `NUGET_USER`;
7. set **Value** to the nuget.org profile name/username used by the Trusted Publishing policy;
8. save the variable.

On nuget.org, also create a **Trusted Publishing policy** for the repository targeting:

```text
.github/workflows/release.yml
```

The workflow centralizes the decision in `nuget-publishing-enabled`. NuGet publication is enabled only when:

```text
publish=true
AND refs/heads/main
AND validated artifact matches version/tag/commit
AND NUGET_USER is configured and non-empty
```

If `NUGET_USER` is absent, empty, or whitespace-only, `publish=false` still works as validation. With `publish=true`, the run fails before external authentication because an official publication must be able to publish the validated package.

The workflow creates or resumes a draft GitHub Release before external publication so it can attach the validated artifacts. It is finalized only after NuGet.org and GitHub Packages publication both succeed, so the repository does not advertise an incomplete distribution.

The template does not use a long-lived `NUGET_API_KEY`.

### GitHub Packages

Official releases also publish `RodriOliveira.DotNet.Library.Template.<version>.nupkg` to GitHub Packages:

```text
https://nuget.pkg.github.com/rodri-oliveira-dev/index.json
```

This publication is an authenticated mirror for consumers that already use GitHub Packages. NuGet.org remains the primary public registry and the recommended path for `dotnet new install`.

To consume the GitHub Packages mirror, configure an authenticated NuGet source with your GitHub username and a token that has `read:packages`:

```bash
dotnet nuget add source "https://nuget.pkg.github.com/rodri-oliveira-dev/index.json" \
  --name github-rodri-oliveira-dev \
  --username GITHUB_USERNAME \
  --password GITHUB_PACKAGES_TOKEN \
  --store-password-in-clear-text

dotnet new install RodriOliveira.DotNet.Library.Template \
  --add-source "https://nuget.pkg.github.com/rodri-oliveira-dev/index.json"
```

`GITHUB_USERNAME` and `GITHUB_PACKAGES_TOKEN` are placeholders. Use a token scoped to the minimum required access and never commit it to the repository. The `--add-source` argument lets `dotnet new install` resolve the template from the authenticated mirror after the source is registered.

### Placeholder publication guard

The source repository uses `Template.Library` as its neutral identity. The release workflow detects that identity and blocks accidental publication to NuGet.org.

In this source repository, the only publishable package is `RodriOliveira.DotNet.Library.Template.<version>.nupkg`. The `Template.Library` package can be built, packed, and validated locally, but it is kept in validation artifacts and never enters the publishable release candidate. In projects generated through `dotnet new`, the delivered workflow publishes only the generated library's real PackageId when Trusted Publishing, `NUGET_USER`, the `release` environment, and `publish=true` are configured.

## Security and quality

The main workflows have separate responsibilities:

| Workflow | Responsibility |
| --- | --- |
| `ci.yml` | restore, build policies, formatting, tests, coverage, pack, and consumption validation |
| `codeql.yml` | CodeQL analysis for C# |
| `dependency-review.yml` | blocks newly introduced High/Critical vulnerabilities in pull requests |
| `sonar.yml` | optional SonarQube Cloud analysis |
| `release.yml` | release candidate validation, attestation, draft GitHub Release, NuGet Trusted Publishing, GitHub Packages, and release finalization |
| `template-validation.yml` | end-to-end `dotnet new` validation |
| `template-package-validation.yml` | maintenance-only validation of the real NuGet Template Package |
| `sonar-template-validation.yml` | validates the Sonar contract in generated output |
| `versioning-validation.yml` | validates the SemVer and package/assembly metadata contract |
| `release-publishing-validation.yml` | maintenance-only validation of the release candidate, explicit publication, OIDC, draft release, and NuGet opt-in |
| `github-template-initialization-validation.yml` | maintenance-only validation of GitHub Template Repository initialization |

Keeping these concerns separate makes build, security, external-analysis, generation, and release failures independently diagnosable.

## Optional SonarQube Cloud

Sonar analysis is opt-in and implemented by `.github/workflows/sonar.yml`. To enable it correctly:

1. create or import the project in SonarQube Cloud and bind it to the GitHub repository;
2. keep **Automatic Analysis disabled** for the Sonar project because this baseline uses CI-based analysis to run the .NET build and import coverage;
3. configure repository secret `SONAR_TOKEN` with a token authorized to analyze the project;
4. configure `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, and `SONAR_HOST_URL` as Repository Variables only when the automatically derived values do not match the Sonar project coordinates;
5. for release-based baselines, configure **New Code → Previous Version**; the workflow reports `sonar.projectVersion` from the highest reachable release tag using SemVer precedence and falls back to `PackageVersion` before the first release;
6. use **Sonar way** or an intentional custom Quality Gate. The workflow sets `sonar.qualitygate.wait=true` with a 300-second timeout, so an evaluated failed gate fails the job on pull requests and pushes to `main`;
7. validate at least one pull request before making the Sonar check required in the `main` ruleset.

The required secret is:

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

Coverage is generated in OpenCover format and imported through `sonar.cs.opencover.reportsPaths`. Governance and release scripts under `scripts/**` intentionally remain in Sonar analysis; do not add `sonar.exclusions=scripts/**` merely to alter metrics.

**Fork pull requests:** GitHub does not expose Repository Secrets such as `SONAR_TOKEN` to `pull_request` workflows from forks. In that case the workflow emits a warning and completes the disabled path without running the scanner or Quality Gate. Therefore a green Sonar check on a fork PR does not prove that Sonar evaluated the contribution and must not be the only required quality gate for untrusted fork contributions.

The complete setup, including coverage, SemVer versioning, branch protection, fork behavior, and troubleshooting, is documented in [docs/sonarqube-cloud.md](sonarqube-cloud.md). The Portuguese version is available at [docs/sonarqube-cloud.pt-BR.md](sonarqube-cloud.pt-BR.md).

## Generated content versus template maintenance

Most of the baseline is copied into generated projects: code, tests, build policies, lock files, centralized dependencies, governance, CI, security, quality, release automation, and package tooling.

Template-maintenance-only content is excluded, including:

- `.template.config/**`;
- `packaging/**`;
- the GitHub Template Repository initialization workflow and helper;
- template-only validation workflows;
- NuGet Template Package validation workflow and scripts;
- `docs/template-development.md`;
- `docs/advanced-reference.md`;
- `docs/advanced-reference.pt-BR.md`;
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
│   ├── advanced-reference.md
│   ├── advanced-reference.pt-BR.md
│   ├── library-readme.md
│   ├── repository-administration.md
│   └── template-development.md
├── scripts/
│   ├── release-candidate.cs
│   ├── resolve-nuget-publishing.sh
│   ├── resolve-release-request.sh
│   └── verify-package.cs
├── packaging/
│   └── RodriOliveira.DotNet.Library.Template.csproj
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
├── SECURITY.md
├── Template.Library.slnx
└── global.json
```
