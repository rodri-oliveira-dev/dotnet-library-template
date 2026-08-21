# Contributing

Thank you for contributing. Keep changes focused, reviewable, and aligned with the library's public contract.

## Code of Conduct

By participating in this project, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Prerequisites

Install:

- .NET SDK 10;
- Git.

No globally installed .NET tool should be required for the standard development workflow.

## Prepare the repository

From the repository root, restore local tools and locked dependencies:

```bash
dotnet tool restore
dotnet restore --locked-mode
```

## Validate a change

Before opening a pull request, run the same core checks expected by CI:

```bash
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

When the change affects packaging, public metadata, symbols, or source mapping, also generate and validate the package:

```bash
dotnet pack --configuration Release --no-build --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

## Keep changes focused

A contribution should address one cohesive concern. Avoid mixing unrelated refactors, formatting changes, dependency updates, and feature work in the same pull request unless they are required by the change.

Prefer the smallest change that solves the problem while preserving the repository's build, test, packaging, and security guarantees.

## Tests

Behavior changes should be covered by tests. Bug fixes should include a regression test when practical. If a change cannot reasonably be tested, explain why in the pull request.

Do not weaken existing validation merely to make a change pass.

## Changelog

Update [CHANGELOG.md](CHANGELOG.md) under `Unreleased` for changes that are notable to consumers, including:

- new public functionality;
- behavior changes;
- deprecations or removals;
- bug fixes with user-visible impact;
- security-relevant changes.

Internal refactors, documentation-only corrections, and maintenance work that do not affect consumers do not require a changelog entry.

## Public API and breaking changes

Treat the public API as a compatibility contract. A breaking change should be deliberate and should include:

- a clear rationale;
- affected API surface and migration guidance;
- updated tests and documentation;
- an entry in `CHANGELOG.md`;
- an explicit note in the pull request that the change is breaking.

Breaking changes must be released under an appropriate major version according to Semantic Versioning. Do not introduce a breaking public API change as an incidental refactor.

## Pull requests

Pull requests should:

- explain what changed and why;
- link the relevant issue when one exists;
- describe how the change was validated;
- call out public API, package, security, or compatibility impact;
- keep generated or unrelated files out of the diff.

Reviewers may request smaller changes, additional tests, clearer documentation, or migration guidance before approval.

## Review expectations

Address review feedback with additional commits while the pull request is open. Resolve discussions only after the concern has been addressed or agreement has been reached.

A pull request is ready to merge when the intended behavior is clear, required checks pass, documentation is consistent with the implementation, and no known compatibility issue is left unexplained.
