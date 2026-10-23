# Adopt ADR Guard for architecture decisions

## Status

Accepted

## Context

Libraries created from this template need a lightweight and reproducible way to preserve the reasoning behind consequential architectural decisions. Markdown files alone are easy to add, but their names, lifecycle states, required sections, and relationships can drift between contributors and between local development and continuous integration.

The template is distributed both as a NuGet template package and as a GitHub Template Repository. The same deterministic validation must therefore work in the source template and in projects created through either distribution path. It must not require a global tool installation, credentials, network-backed language models, or a decision about the architecture of any particular generated library.

## Decision Drivers

- Keep architectural decision history close to the code and review it through the existing pull request workflow.
- Use the same versioned validator locally and in CI.
- Preserve parity between NuGet template generation and GitHub Template Repository initialization.
- Keep authoring assistance optional and validation deterministic.
- Avoid adding a parallel CI pipeline or global developer prerequisite.

## Options Considered

1. Keep unvalidated Markdown ADRs. This has no tooling cost, but it cannot detect structural drift or provide a reproducible local and CI contract.
2. Add a custom validation script to this repository. This could enforce a narrow convention, but the template would own and maintain behavior already provided by a dedicated tool.
3. Adopt ADR Guard as a repository-local .NET tool and run its deterministic `check` command in the existing CI workflow.
4. Use the official ADR Guard GitHub Action. It is suitable for Action-only consumers, but it would duplicate the validation already supplied by the local manifest and introduce a second version-selection path for this template.
5. Require an AI-backed review service. This would introduce credentials, external data handling, and nondeterministic availability that are unnecessary for structural validation.

## Decision

Adopt ADR Guard as the deterministic ADR validation mechanism for the template and generated libraries. Pin the CLI in the repository-local .NET tool manifest, store canonical ADRs in `docs/adr`, and execute `adr-guard check docs/adr` in the existing CI workflow after local tools are restored.

Recommend the independently distributed VS Code extension and provide explicit check and index tasks in the reusable workspace. The check task is read-only. Index generation remains an explicit developer action because it writes `docs/adr/README.md`.

The baseline does not enable ADR drafting, technical review, or any other AI-backed capability.

## Rationale

A local tool manifest gives the source repository, generated repositories, developer machines, and CI the same CLI version without requiring a global installation. Reusing the existing CI workflow keeps build, test, coverage, packaging, security, and ADR validation in one deterministic gate. Keeping the extension optional avoids coupling editor support to the CLI distribution model.

## Consequences

Architectural decisions added to the template or to a generated library must follow the configured canonical structure and pass ADR Guard validation. Both template distribution paths must retain the manifest, configuration, ADR directory, workspace, editor recommendations, and CI command.

## Positive Consequences

- Structural ADR errors fail locally and in CI with the same pinned CLI.
- Contributors have a discoverable workflow for validating and indexing decisions.
- Generated libraries inherit governance documentation without inheriting product-specific architectural claims.
- Validation works without secrets, external providers, or global tools.

## Negative Consequences

- The local tool restore downloads one additional package and requires the runtime supported by that package.
- Maintainers must deliberately update and validate the pinned ADR Guard version.
- The VS Code extension does not automatically discover every repository-local tool installation; some environments require a host-local executable configuration.

## Risks

- A CLI upgrade can change accepted document rules or runtime requirements. Mitigate this by pinning an explicit version and running both template E2E paths before merging an update.
- The two template distribution paths can drift. Mitigate this with generated-output parity checks and execution of ADR Guard in both validation paths.
- Contributors may assume structural validation approves the technical merits of a decision. Documentation must state that human review remains responsible for architectural judgment.

## References

- [ADR Guard](https://github.com/rodri-oliveira-dev/adr-guard)
- [ADR Guard CLI package](https://www.nuget.org/packages/RodriOliveira.AdrGuard)
