# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases should follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Primary GitHub Actions CI workflow with locked restore, Release build, tests, Cobertura coverage, NuGet packaging, package validation, and downloadable coverage/package artifacts.
- CodeQL security analysis for C# on pull requests, pushes to `main`, and a weekly scheduled scan using a reproducible manual .NET build.
- Dependency Review on pull requests to block newly introduced dependencies with high or critical known vulnerabilities.
- Release workflow with SemVer validation, NuGet.org Trusted Publishing through GitHub OIDC, symbol publishing, GitHub Release creation, and a package-identity guard that prevents publishing the source template placeholder while still allowing source-template GitHub Releases without package artifacts.
- Manual release flow through `workflow_dispatch` that validates `main`, rejects existing tags, builds/tests/packs/validates the package, and only then creates the requested Git tag at the exact validated commit SHA.
- Portable VS Code recommendations, workspace settings, and tasks for restore, build, test, coverage, and NuGet packaging.
- Maintenance-only GitHub repository administration baseline covering template status, Actions permissions, `main` ruleset checks, security features, and final v1.0 verification.
- Optional SonarQube Cloud analysis using a locally pinned SonarScanner for .NET, repository-secret opt-in, configurable repository coordinates, and Coverlet/OpenCover coverage import.
- Centralized SemVer versioning with base version `1.0.0`, tag-driven release overrides, packaged assembly metadata validation, and E2E stable/prerelease/mismatch checks.
- Maintenance-only release-publishing validation covering manual release request validation, tag/SHA guarantees, the `NUGET_USER` opt-in decision matrix, and generated-template behavior.
- Reproducible .NET SDK selection through `global.json`, SDK analyzer baseline validation, native SDK Package Validation, packaged README metadata, and a generated `SECURITY.md` policy.
- One-time GitHub Template Repository initializer that uses the real `dotnet new` engine, validates the generated repository, commits the canonical output, and removes bootstrap-only assets after successful initialization.
- Maintenance E2E validation for GitHub Template initialization parity against direct `dotnet new` output.

### Changed

- Hardened GitHub Actions permissions to job scope where applicable and pinned `NuGet/login` to the immutable v1.2.0 commit SHA used by the release workflow.
- Hardened all eligible GitHub Actions references with immutable commit SHAs and disabled credential persistence on read-only checkouts.
- Extended `.editorconfig` with production-scoped reliability/API-usage rules and low-noise performance rules while keeping `CA1859` as a suggestion.
- NuGet.org publication is explicitly opt-in through the `NUGET_USER` repository variable; when it is absent, empty, or whitespace-only, the release still creates its tag and GitHub Release without starting OIDC authentication or `dotnet nuget push`.
- GitHub Release creation is now independent from NuGet enablement; when NuGet publication is enabled, the GitHub Release still waits for a successful NuGet publication before it is created.
- README quick-start guidance now shows the full clone/install/generate flow, optional `-o` output usage, unambiguous uninstall commands, and the automated GitHub Template initialization path in Portuguese and English.
- GitHub Template initialization now uses a dedicated `INITIALIZE_REPOSITORY_TOKEN` secret with workflow-write permission for the self-removing push, while keeping the workflow `GITHUB_TOKEN` read-only.
