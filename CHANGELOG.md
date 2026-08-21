# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases should follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Primary GitHub Actions CI workflow with locked restore, Release build, tests, Cobertura coverage, NuGet packaging, package validation, and downloadable coverage/package artifacts.
- CodeQL security analysis for C# on pull requests, pushes to `main`, and a weekly scheduled scan using a reproducible manual .NET build.
- Dependency Review on pull requests to block newly introduced dependencies with high or critical known vulnerabilities.
- Tag-based release workflow with SemVer validation, NuGet.org Trusted Publishing through GitHub OIDC, symbol publishing, GitHub Release creation, manual dry-run validation, and a package-identity guard that prevents publishing the source template placeholder while still allowing source-template GitHub Releases without package artifacts.
- Portable VS Code recommendations, workspace settings, and tasks for restore, build, test, coverage, and NuGet packaging.
- Maintenance-only GitHub repository administration baseline covering template status, Actions permissions, `main` ruleset checks, security features, and final v1.0 verification.
- Optional SonarQube Cloud analysis using a locally pinned SonarScanner for .NET, repository-secret opt-in, configurable repository coordinates, and Coverlet/OpenCover coverage import.
- Centralized SemVer versioning with base version `1.0.0`, tag-driven release overrides, packaged assembly metadata validation, and E2E stable/prerelease/mismatch checks.
- Maintenance-only release-publishing validation covering the `NUGET_USER` opt-in decision matrix and generated-template behavior.

### Changed

- Hardened GitHub Actions permissions to job scope where applicable and pinned `NuGet/login` to the immutable v1.2.0 commit SHA used by the release workflow.
- NuGet.org publication is now explicitly opt-in through the `NUGET_USER` repository variable; when it is absent, empty, or whitespace-only, release validation/build/pack continues without starting OIDC authentication or `dotnet nuget push`.
