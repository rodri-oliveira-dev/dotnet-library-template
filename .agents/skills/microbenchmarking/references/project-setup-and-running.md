# Running benchmarks

This reference covers how to build, run, and read BenchmarkDotNet results.

## Entry points

**BenchmarkSwitcher** forwards CLI arguments and otherwise can prompt interactively. Agents should always provide `--filter` to avoid hanging:

```csharp
BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
```

**BenchmarkRunner** honors CLI args only when an overload receives them. Check the current entry point before assuming flags work.

## Creating a benchmark project

Prefer an existing benchmark project. If a new one is necessary, follow repository dependency governance and Central Package Management rather than inserting package versions directly into `.csproj` files.

For multi-runtime comparison, the benchmark project must target all compared TFMs via `TargetFrameworks`.

## Build and run strategy

Build first, then run narrow filtered measurements with output redirected:

```bash
dotnet build -c Release
dotnet run -c Release --no-build -- --filter "*MethodName" --noOverwrite > benchmark.log 2>&1
```

Read generated Markdown reports first; inspect the verbose log only for errors or unexpected behavior.

## Useful CLI flags

| Flag | Purpose |
|---|---|
| `--filter "*"` | run all benchmarks without interactive prompt |
| `--filter "*MethodName"` | run a focused method set |
| `--list flat` | list discoverable benchmark names |
| `--job Dry` | validate compilation/execution quickly |
| `--job Short` | development measurement |
| `--artifacts ./path` | control result location |
| `--noOverwrite` | preserve previous result files |
| `--exporters json` | add JSON output when needed |
| `--keepFiles` | retain generated project for build diagnosis |

Filters are glob-style and should normally include a leading `*` unless the complete benchmark name is known.

## Dry-run validation

Always validate with a dry run before a full benchmark suite:

```bash
dotnet run -c Release --no-build -- --filter "*" --job Dry --noOverwrite
```

A dry run proves setup/compilation/execution, not performance.
