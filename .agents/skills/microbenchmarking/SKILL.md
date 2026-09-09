---
name: microbenchmarking
description: >
  Activate when BenchmarkDotNet is involved or when a .NET performance question requires controlled microbenchmark measurement. Covers benchmark design, BDN configuration, project setup, cost-aware execution, side-by-side comparisons, diagnostics, and interpretation. Do not use for profiling/tracing, production telemetry, or load/stress testing.
license: MIT
---

# Benchmark Authoring Guidelines

BenchmarkDotNet (BDN) is the default tool for controlled .NET microbenchmarks in this skill.

> **Repository integration:** preserve `AGENTS.md`, Central Package Management, existing benchmark conventions, and deterministic validation. Do not add inline dependency versions when the repository centralizes them. Read only the reference files relevant to the task before writing benchmark code.

## Benchmarks are comparative instruments

A single number has limited value. Identify the comparison axis first:

- approaches (A vs B);
- runtimes;
- package versions;
- builds (before/after);
- runtime configuration;
- input scale;
- hardware/OS;
- historical measurements.

See [references/comparison-strategies.md](references/comparison-strategies.md) before configuring non-trivial comparisons.

## Benchmark lifecycle

Choose the use case before creating code:

1. **Coverage suite** — permanent benchmarks representing real caller scenarios.
2. **Issue investigation** — task-scoped reproduction/diagnosis of a reported performance problem.
3. **Change validation** — task-scoped before/after validation for a change or PR.
4. **Development feedback** — temporary experiment while choosing an implementation.

Only permanent coverage-suite benchmarks should automatically become repository code. Temporary investigation/validation benchmarks should remain isolated unless the task explicitly asks to keep them.

## Cost awareness

Each BDN case has real wall-clock cost. `[Params]` creates Cartesian products and multiple jobs multiply the case count.

| Preset | Typical purpose |
|---|---|
| `--job Dry` | correctness/compilation validation |
| `--job Short` | quick development measurements |
| default | final normal measurements |
| `--job Medium` | higher confidence |
| `--job Long` | exceptional high-confidence runs |

Always estimate method × parameter × job case count before running a large suite.

## Entry points

- `BenchmarkSwitcher` supports interactive discovery; agents must pass `--filter` to avoid prompts.
- `BenchmarkRunner` only honors CLI args when they are passed to the runner overload.

Read [references/project-setup-and-running.md](references/project-setup-and-running.md) before modifying entry points or CLI behavior.

## Running benchmarks

Redirect verbose BDN output and inspect generated summary reports first:

```bash
dotnet run -c Release -- --filter "*MethodName" --noOverwrite > benchmark.log 2>&1
```

Use `--filter` to keep runs narrow. Run `--job Dry` before committing to longer measurements.

## Writing new benchmarks

Before writing code, determine:

- the use case;
- comparison axis;
- real-world scenario/input shape;
- whether parameters create unnecessary Cartesian growth;
- setup/reset needs;
- whether allocations or additional diagnostics matter.

Follow [references/writing-benchmarks.md](references/writing-benchmarks.md). Key invariants:

- return results when needed to prevent dead-code elimination;
- move initialization to `[GlobalSetup]`;
- do not add manual loops merely to increase measurement work;
- mark an explicit baseline for comparisons;
- store inputs in fields/params, not constants that the JIT can fold;
- use seeded randomness for reproducibility;
- materialize deferred execution when that execution is what should be measured.

## Dependency/setup rule

If BenchmarkDotNet is not already present, follow repository dependency governance. In this template that means keeping package versions in `Directory.Packages.props`, preserving lock files through SDK-generated restore, and avoiding ad-hoc inline `Version=` attributes.

## Diagnostics

Use [references/diagnosers-and-exporters.md](references/diagnosers-and-exporters.md) when timing alone is insufficient. Memory allocation, disassembly, threading, EventPipe, and hardware counters have different platform/cost implications.

## Validation

1. Build the benchmark project in Release.
2. Run a dry representative case.
3. Run a narrow real measurement.
4. Confirm the comparison baseline and input set are correct.
5. Read the Markdown/CSV result artifact rather than inferring from console noise.
6. Report environment and statistical limitations; do not overstate tiny differences.
