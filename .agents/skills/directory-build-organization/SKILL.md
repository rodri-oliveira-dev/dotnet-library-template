---
name: directory-build-organization
description: "Guide for organizing MSBuild infrastructure with Directory.Build.props, Directory.Build.targets, Directory.Packages.props, and Directory.Build.rsp. USE FOR: structuring multi-project repos, centralizing build settings, preserving or implementing Central Package Management, consolidating duplicated properties, and understanding MSBuild evaluation order. Critical pitfall: TargetFramework-dependent properties in .props may evaluate too early."
license: MIT
---

# Organizing Build Infrastructure with Directory.Build Files

> **Repository integration:** this template already uses `Directory.Build.props` and `Directory.Packages.props`. Preserve its current conventions; do not re-bootstrap CPM or reorganize build infrastructure unless the task requires it.

## Evaluation order

```text
Directory.Build.props → SDK .props → .csproj → SDK .targets → Directory.Build.targets
```

| Use `.props` for | Use `.targets` for |
|---|---|
| property defaults | custom build targets |
| common items | late-bound property overrides |
| package/assembly metadata | logic depending on final SDK properties |
| analyzer PackageReferences | post-build/pack validation |

### TargetFramework pitfall

Property conditions on `$(TargetFramework)` in `.props` files can silently fail for single-target projects because the project may set the TFM after `.props` import. Move such property logic to `.targets` or the project file. See [references/targetframework-props-pitfall.md](references/targetframework-props-pitfall.md).

## Central Package Management

When CPM is enabled:

- package versions belong in `Directory.Packages.props`;
- project `PackageReference` items normally omit `Version=`;
- do not migrate away from the repository's existing package-governance model as part of unrelated work.

## Multi-level Directory.Build files

MSBuild auto-imports the first `Directory.Build.props`/`.targets` it finds walking upward. If a repo intentionally uses multiple levels, inner files must explicitly import the parent. See [references/multi-level-examples.md](references/multi-level-examples.md).

## Workflow

1. Audit relevant `.csproj`, `Directory.Build.props`, `Directory.Build.targets`, and `Directory.Packages.props` files.
2. Identify duplicated vs project-specific settings.
3. Preserve existing ownership of versioning, analyzers, packaging, and warnings.
4. Move only clearly shared defaults into `.props`.
5. Keep custom targets/late SDK-dependent logic in `.targets`.
6. Validate with restore/build/test and, when needed, preprocessed MSBuild output.

Useful diagnosis:

```bash
dotnet msbuild -pp:output.xml path/to/Project.csproj
```

## Validation

- [ ] No `TargetFramework`-dependent property was moved to an early `.props` evaluation point
- [ ] CPM remains consistent
- [ ] Project-specific settings were not generalized without evidence
- [ ] Restore/build/test still pass
- [ ] Packaging metadata/output remains unchanged unless intentionally modified

See [references/common-patterns.md](references/common-patterns.md) for common layouts and validation examples.
