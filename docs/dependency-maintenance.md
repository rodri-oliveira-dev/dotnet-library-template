# Dependency maintenance baseline

Repositories generated from this template include a versioned Dependabot baseline for the three parts of the .NET build supply chain that can drift independently:

- NuGet packages;
- the .NET SDK selected by `global.json`;
- GitHub Actions references.

## Scheduling and review

All three ecosystems use a weekly schedule in `America/Sao_Paulo`. NuGet and GitHub Actions minor/patch updates may be grouped to reduce noise. SDK updates are intentionally kept in dedicated pull requests so compiler and toolchain changes remain explicit.

Major updates should be reviewed as compatibility changes. An automated pull request is a proposal, not evidence that the new version is safe to merge.

## SDK policy

`global.json` remains the source of truth for the SDK version, roll-forward behavior, and prerelease policy. Dependabot updates that file; it does not override those policies.

A generated repository should run its normal CI, CodeQL, Dependency Review, package validation, and any additional project-specific gates on SDK update pull requests before merge.

## Template drift protection

The existing template validation workflow is the canonical drift gate for this policy. It verifies that:

- `.github/dependabot.yml` contains exactly the NuGet, `dotnet-sdk`, and GitHub Actions ecosystems;
- each ecosystem monitors the repository root on a weekly schedule in `America/Sao_Paulo`;
- NuGet and GitHub Actions group minor/patch updates while SDK updates remain dedicated pull requests;
- a project generated with `dotnet new rodri-lib` receives the same three-ecosystem baseline;
- generated `global.json` remains identical to the source template's toolchain policy;
- this dependency-maintenance policy is included in generated repositories.

Keeping these assertions in the existing end-to-end template validation avoids a second overlapping workflow and ensures dependency-policy changes are validated together with the rest of the generated repository contract.

Repository administrators remain responsible for GitHub-side features such as Dependabot alerts, secret scanning, push protection, rulesets, and publishing trust configuration.
