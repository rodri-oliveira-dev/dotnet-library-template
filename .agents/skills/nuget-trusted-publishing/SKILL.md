---
name: nuget-trusted-publishing
description: >
  Set up NuGet trusted publishing (OIDC) on a GitHub Actions repo — replaces long-lived API keys
  with short-lived tokens. USE FOR: trusted publishing, NuGet OIDC, keyless NuGet publish,
  migrate from NuGet API key, NuGet/login, secure NuGet publishing.
  DO NOT USE FOR: publishing to private feeds or Azure Artifacts (OIDC is nuget.org only).
license: MIT
---

# NuGet Trusted Publishing Setup

Set up [NuGet trusted publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing) on a GitHub Actions repo. Replaces long-lived API keys with OIDC-based short-lived tokens — no secrets to rotate or leak.

> **Repository integration:** `AGENTS.md` and the repository's existing release workflow are authoritative. Preserve Central Package Management, locked restore, existing package validation, and SHA-pinned GitHub Actions. Examples below use generic action tags only as reference; do not weaken the repository's pinning policy when applying them.

## Prerequisites

- **GitHub Actions** — this skill covers GitHub Actions setup only
- **nuget.org account** — the user needs access to create trusted publishing policies

## When to Use This Skill

Use this skill when:
- Setting up trusted publishing for a NuGet package
- Migrating from `secrets.NUGET_API_KEY` to OIDC-based publishing
- Asked about keyless or secure NuGet publishing
- Creating a new NuGet publish workflow from scratch
- Asked to "remove NuGet API key" or "use NuGet/login"
- Setting up publishing for a dotnet tool, MCP server, or template package
- Asked about `NuGet/login@v1` or `id-token: write`

## Safety Rules

> **Bail-out rule**: If any phase fails after one fix attempt on an infrastructure/auth issue, stop and ask the user. Don't loop on environment problems.

> **Never delete or overwrite without confirmation**: Removing API key secrets, deleting tags/releases, removing workflow steps, or changing package IDs. NuGet package IDs are permanent — mistakes can't be undone.

## Process

### Phase 1: Assess

Inspect the repo and report findings before making changes.

1. **Find and classify packable projects** — check `.csproj` files and `Directory.Build.props`. Classify in this order:
   - `<PackageType>Template</PackageType>` → **Template**
   - `<PackageType>McpServer</PackageType>` → **MCP server**
   - `<PackAsTool>true</PackAsTool>` → **Dotnet tool**
   - Class library (`IsPackable=true` or no `OutputType`) → **Library**
   - `<OutputType>Exe</OutputType>` with `<IsPackable>true</IsPackable>` → **Application package**
   - `<OutputType>Exe</OutputType>` without `PackAsTool` or `IsPackable` → Not packable by default

2. **Validate structure** for each project's type:

   | Type | Required |
   |------|----------|
   | All | `PackageId`, `Version` (directly or through repo-wide properties) |
   | Dotnet tool | `PackAsTool`; `ToolCommandName` optional but recommended |
   | MCP server | `PackageType=McpServer`, `.mcp/server.json` included in package |
   | Template | `PackageType=Template`, `.template.config/template.json` under content dir |

3. **Find existing publish workflows** in `.github/workflows/` — look for `dotnet nuget push`, `nuget push`, or `dotnet pack`.
4. **Check version consistency** for package-specific metadata.
5. **Report findings** before changing authentication or release behavior.

See [references/package-types.md](references/package-types.md) for package details.

### Phase 2: Local Verification

Pack and verify before touching nuget.org — publishing errors waste a permanent version number.

1. Run the repository's existing deterministic restore/build/test/package validation first.
2. Run `dotnet pack -c Release -o ./artifacts` or the repository-equivalent pack command.
3. Inspect package contents and metadata before publishing.

### Phase 3: nuget.org Policy

This phase requires user action on nuget.org.

1. Determine the **repo owner**, **repo name**, and exact **workflow filename** that publishes.
2. Create the trusted publishing policy at nuget.org with those exact values.
3. If the workflow uses a GitHub Environment, ensure the policy environment matches exactly.
4. Prefer a protected `release` environment when it matches the repository's release design.

> Wait for the user to confirm the policy before removing old API-key paths or secrets.

### Phase 4: Workflow Setup

For migration from an API key:

1. Add OIDC permission to the publishing job:

```yaml
permissions:
  id-token: write
  contents: read
```

2. Add NuGet login before push, using the repository's approved pinned action reference:

```yaml
- name: NuGet login (OIDC)
  id: login
  uses: NuGet/login@<approved-pinned-reference>
  with:
    user: ${{ secrets.NUGET_USER }}
```

3. Replace the static API key in the push step:

```yaml
--api-key ${{ steps.login.outputs.NUGET_API_KEY }} --skip-duplicate
```

4. Verify a real publish before removing any legacy secret.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `NuGet/login` 403 | Missing `id-token: write` | Add to job permissions |
| "no matching policy" | Workflow filename/environment mismatch | Verify exact policy values |
| Push unauthorized | Package not owned by policy account | Check policy owner on nuget.org |
| Token expired | Login too far before push | Move login closer to push |
| `already_exists` on push | Re-running same version | Keep `--skip-duplicate` where appropriate |
| GitHub Release 422 | Duplicate release for tag | Resolve the release conflict without reusing package versions |

## References

- [references/package-types.md](references/package-types.md)
- [references/publish-workflow.md](references/publish-workflow.md)
- [NuGet Trusted Publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing)
