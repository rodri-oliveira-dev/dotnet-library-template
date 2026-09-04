# Generated project identity contract

This document defines the naming contract used by the `.NET Library Template` when a new library is generated through either `dotnet new` or the GitHub Template Repository initializer.

It is maintenance-only documentation and must not be copied into generated libraries.

## Canonical identity rule

The value supplied as the template name is the **canonical project identity**.

For CLI generation, that value comes from:

```bash
dotnet new rodri-lib -n <name>
```

For GitHub Template Repository initialization, the equivalent value comes from:

```text
project_name = <name>
```

The template must use that value consistently for the generated solution, project paths, project name, default namespace, assembly identity, project references, tests, package metadata, and NuGet `PackageId` wherever `Template.Library` is the source identity.

The template does **not** automatically prepend `RodriOliveira.`, a company name, repository owner, or any other namespace/package prefix.

If a prefix is desired, it must be supplied explicitly as part of the name.

## Examples

Given:

```text
ReliableWebhooks
```

expected generated identities include:

```text
Solution:          ReliableWebhooks.slnx
Library project:   src/ReliableWebhooks/ReliableWebhooks.csproj
Test project:      tests/ReliableWebhooks.Tests/ReliableWebhooks.Tests.csproj
Default namespace: ReliableWebhooks
Assembly name:     ReliableWebhooks
NuGet PackageId:   ReliableWebhooks
```

The template must **not** silently transform that value into:

```text
RodriOliveira.ReliableWebhooks
```

If the intended identity is instead:

```text
RodriOliveira.ReliableWebhooks
```

then that exact value must be passed to `-n` or `project_name`.

## CLI and GitHub Template parity

These two flows must remain equivalent for the same input name:

```bash
dotnet new rodri-lib -n ReliableWebhooks
```

and:

```text
Initialize repository
project_name = ReliableWebhooks
```

The GitHub initializer must call the canonical .NET template engine rather than reimplementing naming rules itself.

`.template.config/template.json` remains the source of truth through:

```text
sourceName = Template.Library
```

and the initializer must preserve parity with direct `dotnet new` generation.

## Repository name versus project identity

The GitHub repository name does not implicitly override or prefix the generated project identity.

A repository named `ReliableWebhooks` may intentionally contain a package named `ReliableWebhooks`, while another repository may choose a fully qualified package name such as `Company.Product.Library`.

Consumers should therefore choose the `-n` / `project_name` value based on the desired public .NET and NuGet identity, not on an assumed template-owner naming convention.

## Validation requirements

Changes to template naming, initialization, packaging, or rename behavior must preserve this contract and keep automated generation tests green.

Validation should prove that:

- the supplied name replaces `Template.Library` in generated identity locations;
- no owner/vendor prefix is injected implicitly;
- project paths and namespaces follow the supplied name;
- the generated `PackageId` follows the supplied name;
- CLI generation and GitHub Template initialization produce equivalent output for the same name;
- `Template.Library` does not leak into generated product content except where intentionally preserved as a neutral comparison/guard.

Any future behavior that intentionally derives package or namespace identity differently from the supplied name is a breaking template-contract change and must be documented and validated explicitly.