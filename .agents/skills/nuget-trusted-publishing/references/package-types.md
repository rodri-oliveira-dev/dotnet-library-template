# NuGet Package Type Reference

Structural requirements for each NuGet package type. The agent uses this to validate a repo's packaging setup before configuring trusted publishing.

## Detection Logic

Inspect `.csproj` files and `Directory.Build.props` for these MSBuild properties:

```text
1. Has <PackageType>Template</PackageType>?           → Template package
2. Has <PackageType>McpServer</PackageType>?         → MCP server (also a dotnet tool)
3. Has <PackAsTool>true</PackAsTool>?                → Dotnet tool
4. Has <IsPackable>true</IsPackable> or no OutputType? → NuGet library
5. Has <OutputType>Exe</OutputType> + <IsPackable>true</IsPackable>? → Application package
6. Has <OutputType>Exe</OutputType> without PackAsTool or IsPackable? → Not packable by default
```

Check in order — MCP servers may also have `PackAsTool`.

## NuGet Library

Common package metadata includes `PackageId`, versioning, authors, description, tags, README, SPDX license, repository URL, and Source Link metadata. In repositories using Central Package Management or repo-wide package metadata, inspect `Directory.Build.props` and `Directory.Packages.props` before assuming a project is incomplete.

### Including README in Package

`PackageReadmeFile` alone is not enough; include the file in the package:

```xml
<PropertyGroup>
  <PackageReadmeFile>README.md</PackageReadmeFile>
</PropertyGroup>
<ItemGroup>
  <None Include="README.md" Pack="true" PackagePath="/" />
</ItemGroup>
```

## Dotnet Tool

Typical required properties:

| Property | Notes |
|---|---|
| `OutputType=Exe` | executable project |
| `PackAsTool=true` | marks tool package |
| `PackageId` | permanent package identifier |
| package version | may come from project or shared props |

`ToolCommandName` is optional but recommended.

## MCP Server

An MCP server packaged through NuGet commonly combines dotnet-tool packaging with `PackageType=McpServer` and `.mcp/server.json`. Keep package/version metadata synchronized and ensure the descriptor is included in the package.

## Template Package

A template package uses `PackageType=Template` and includes `.template.config/template.json` under its content tree. Template identity, name, `shortName`, and type metadata must be valid before publish.

## Common Gotchas

- Class libraries are normally packable; console apps normally are not unless configured.
- Shared package metadata may live in `Directory.Build.props`.
- With Central Package Management, dependency versions belong in `Directory.Packages.props`; do not add inline `Version=` attributes when the repository forbids them.
- Multi-project repositories may publish multiple packages from one governed release workflow.
- Prefer explicit `dotnet pack`/repository-owned packaging validation before publication.
- Package IDs and published versions are effectively permanent; validate before push.
