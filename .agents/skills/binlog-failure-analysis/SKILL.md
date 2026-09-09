---
name: binlog-failure-analysis
description: "Analyze MSBuild binary logs to diagnose build failures. USE FOR: unclear MSBuild errors, cascading failures across multi-project builds, tracing target execution/order, and inspecting evaluated properties/items. Requires an existing .binlog or explicit permission to generate one. DO NOT USE FOR: non-MSBuild build systems."
license: MIT
---

# Analyzing MSBuild Failures with Binary Logs

This skill diagnoses MSBuild failures from `.binlog` evidence.

> **Repository integration:** a binlog MCP server is optional, not assumed. Use it only when the current agent environment exposes one. Otherwise use MSBuild's built-in binary-log replay path. Do not attempt to read a `.binlog` as plain text.

## Preferred path — structured binlog tooling when available

If a binlog-aware MCP/tool is available, use it to inspect:

- errors and warnings;
- MSBuild properties and final values;
- items such as `PackageReference` and `ProjectReference`;
- project evaluation data;
- target execution details;
- embedded project/source contents when supported.

Synthesize findings as evidence accumulates. Do not keep exploring after the cause and affected target/property chain are sufficiently established.

## Fallback — replay binary log to focused text logs

```bash
dotnet msbuild build.binlog -noconlog \
  -fl  -flp:v=diag;logfile=full.log;performancesummary \
  -fl1 -flp1:errorsonly;logfile=errors.log \
  -fl2 -flp2:warningsonly;logfile=warnings.log
```

PowerShell requires appropriate quoting around semicolon-delimited logger parameters.

Then search the generated text logs rather than the binary file itself:

```bash
cat errors.log
grep -n -B2 -A2 "CS0246" full.log
grep -i "CoreCompile.*FAILED\|Build FAILED\|error MSB" full.log
```

## Generating a binlog when needed

If no binlog exists and the task requires one:

```bash
dotnet build /bl:build.binlog
```

Prefer the narrowest failing project/command that reproduces the issue. Treat the generated binlog and replay logs as temporary diagnostic artifacts unless the user explicitly asks to retain them.

## Validation

- [ ] Cause is supported by properties/items/targets from the log rather than guessed from the final console error
- [ ] Cascading errors are distinguished from the first causal failure
- [ ] No binary log was parsed with plain-text tools
- [ ] Temporary diagnostic artifacts are not committed
- [ ] Any proposed fix is validated with the repository's deterministic build/test commands
