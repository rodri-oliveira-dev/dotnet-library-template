# Agent Skill Sources

This repository intentionally vendors the agent skills under `.agents/skills/`.
The repository-local skills are authoritative for this template and for
repositories generated from it. External plugins are optional references only;
they do not replace the vendored template baseline.

## Provenance Manifest

Classification values:

- `upstream-adapted`: adapted from a third-party upstream project.
- `internal-adapted`: adapted from another repository maintained by this organization.
- `local`: created for this repository, with no literal external source established.

`not established` means repository history and checked upstream evidence did not
establish an exact source revision. It is recorded deliberately instead of
guessing lineage.

<!-- agent-sources:start -->
| Skill | Classification | Source repository | Source path | Source revision | License | Local adaptations | Distribution | Update policy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| authoring-github-workflows | upstream-adapted | https://github.com/dotnet/skills | .agents/skills/authoring-github-workflows/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this template's pinned actionlint version, HTTPS redirect policy, GitHub Actions governance gate, and pairing with ci-release-governance. | emitted | Review upstream changes manually, preserve local workflow policies, and update this record plus notices in the same PR. |
| nuget-trusted-publishing | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-advanced/skills/nuget-trusted-publishing/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this template's NuGet.org OIDC guidance, placeholder PackageId safeguards, pinned Actions, and release workflow semantics. | emitted | Review upstream changes manually, preserve local release safeguards, and update this record plus notices in the same PR. |
| test-gap-analysis | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-test/skills/test-gap-analysis/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this library's behavior-first test expectations and existing deterministic validation baseline. | emitted | Review upstream changes manually, preserve local test-quality policy, and update this record plus notices in the same PR. |
| microbenchmarking | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-diag/skills/microbenchmarking/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this repository's cost-aware BenchmarkDotNet usage and library-focused validation expectations. | emitted | Review upstream changes manually, preserve local performance-validation scope, and update this record plus notices in the same PR. |
| directory-build-organization | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-msbuild/skills/directory-build-organization/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this template's Central Package Management, Directory.Build evaluation guidance, and locked restore baseline. | emitted | Review upstream changes manually, preserve local MSBuild and CPM policy, and update this record plus notices in the same PR. |
| binlog-failure-analysis | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-msbuild/skills/binlog-failure-analysis/SKILL.md | c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7 | MIT, .NET Foundation and Contributors | Adapted to this repository's existing MSBuild validation flow and rule that binlogs are generated only with explicit need or permission. | emitted | Review upstream changes manually, preserve local diagnostic boundaries, and update this record plus notices in the same PR. |
| coverage-analysis | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-test/skills/coverage-analysis/SKILL.md | not established | MIT, .NET Foundation and Contributors | Local history first introduced a shortened Portuguese library-specific adaptation in this repository at 26d76b403cd0c320608f471d6fce29c34cadcfe6. The upstream path is verified in dotnet/skills at c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7, but the exact upstream revision used by the earlier local adaptation is not established. Related internal evidence exists in rodri-oliveira-dev/poc-arquitetura at .agents/skills/coverage-analysis/SKILL.md revision 683de59caaca3e8d433ee6d110e3a0df3d600b65. | emitted | Review upstream changes manually, preserve local coverage and Coverlet policy, and update this record plus notices in the same PR. |
| test-anti-patterns | upstream-adapted | https://github.com/dotnet/skills | plugins/dotnet-test/skills/test-anti-patterns/SKILL.md | not established | MIT, .NET Foundation and Contributors | Local history first introduced a shortened Portuguese library-specific adaptation in this repository at 26d76b403cd0c320608f471d6fce29c34cadcfe6. The upstream path is verified in dotnet/skills at c4a3f7ad4fd8fb50c02a42a6375c0aba4f92e9f7, but the exact upstream revision used by the earlier local adaptation is not established. Related internal evidence exists in rodri-oliveira-dev/poc-arquitetura at .agents/skills/test-anti-patterns/SKILL.md revision 0415c639831af8e0c6d1d22ba9dc5dab1a69b030. | emitted | Review upstream changes manually, preserve local test-audit policy, and update this record plus notices in the same PR. |
| ci-release-governance | internal-adapted | https://github.com/rodri-oliveira-dev/poc-arquitetura | .agents/skills/ci-release-governance/SKILL.md | cc834bbcd9bb1a4c1f01c8cfa0637fdab90535f0 | MIT in local front matter | Adapted from service-repository CI and release guidance to this template's library packaging, versioning, GitHub Actions pinning, locked restore, and trusted publishing safeguards. | emitted | Review source changes manually, preserve template-specific release behavior, and update this record in the same PR. |
| dotnet-refactoring-engineer | internal-adapted | https://github.com/rodri-oliveira-dev/poc-arquitetura | .agents/skills/dotnet-refactoring-engineer/SKILL.md | 50746557d0533fe5967e8b96b16294157c89903e | MIT in local front matter | Adapted from broader service/API refactoring guidance to library-focused behavior preservation, public API compatibility, and deterministic validation. | emitted | Review source changes manually, preserve library-specific refactoring constraints, and update this record in the same PR. |
| dotnet-library-change | local | this repository | .agents/skills/dotnet-library-change/SKILL.md | 26d76b403cd0c320608f471d6fce29c34cadcfe6 | MIT | Created for this library template; no literal external or internal source path was established. | emitted | Maintain locally with AGENTS.md routing, generated-template validation, and this manifest updated in the same PR. |
| dotnet-issue-implementation | local | this repository | .agents/skills/dotnet-issue-implementation/SKILL.md | c786185c23e90f32f7e7c85bee3c06d704e60157 | MIT | Created for issue-oriented implementation in this library template; no literal external or internal source path was established. | emitted | Maintain locally with AGENTS.md routing, generated-template validation, and this manifest updated in the same PR. |
| dotnet-bug-investigation | local | this repository | .agents/skills/dotnet-bug-investigation/SKILL.md | fb92abbecdaff32ba45b45aac2573b445700a9a8 | MIT | Created for repository-specific bug and regression investigation; no literal external or internal source path was established. | emitted | Maintain locally with AGENTS.md routing, generated-template validation, and this manifest updated in the same PR. |
| dotnet-pr-review | local | this repository | .agents/skills/dotnet-pr-review/SKILL.md | 5376f1db2568a66bb1dfb02c718b862a1cae590a | MIT | Created for repository-specific PR review; no literal external or internal source path was established. | emitted | Maintain locally with AGENTS.md routing, generated-template validation, and this manifest updated in the same PR. |
| dotnet-security-review | local | this repository | .agents/skills/dotnet-security-review/SKILL.md | d7b0d87e62565e70c8da67d1b451c1c8df0fd44c | MIT | Created for repository-specific security review; no literal external or internal source path was established. | emitted | Maintain locally with AGENTS.md routing, generated-template validation, and this manifest updated in the same PR. |
<!-- agent-sources:end -->

## Distribution

All skills listed above are part of the source template contract and are emitted
into repositories generated with `dotnet new rodri-lib`. Supporting reference
files under each skill directory are emitted with their parent skill unless the
template configuration explicitly excludes them.

## Maintenance Policy

- repository-local skills are authoritative for this template and generated repositories.
- Source revisions for adapted skills must be immutable commit SHAs, not branch names such as `main`.
- Upstream or internal source changes require manual review before incorporation.
- Repository-specific adaptations must be preserved deliberately.
- Updating a third-party-derived skill must update its source revision, adaptation notes and `.agents/THIRD-PARTY-NOTICES.md` in the same PR.
- Updating an internal-adapted skill must update its source revision and adaptation notes in the same PR when the source changes.
- Adding a new skill must add its provenance record in the same PR.
- Removing a skill must remove or update AGENTS.md routing, this manifest, generated-template validation and notices as appropriate.
- external plugins are optional consumption aids and do not replace the vendored template baseline.
- There is no unattended upstream synchronization. All synchronization is reviewed and committed intentionally.
