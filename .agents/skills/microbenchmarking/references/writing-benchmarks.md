# Benchmark authoring techniques

Incorrect benchmarks can silently produce misleading results. Use these invariants when authoring BenchmarkDotNet code.

## Dead code elimination

Return a computed result when needed so the JIT cannot eliminate the work:

```csharp
[Benchmark]
public int Parse() => int.Parse(_value);
```

Operations with observable side effects do not need an artificial return solely for DCE prevention.

## Setup and cleanup

Use `[GlobalSetup]` for data/configuration that should not be measured. Use `[IterationSetup]` only when benchmark state must be reset between iterations; it can force single-invocation behavior and make very fast operations noisy.

## OperationsPerInvoke

Use `OperationsPerInvoke` only when a single benchmark invocation intentionally performs multiple logical operations whose setup cannot be moved out. Do not add manual loops merely to make a benchmark take longer.

## No accidental state growth

Benchmark methods should have stable performance characteristics across invocations. If the operation mutates state, reset that state intentionally outside the measured work where possible.

## Async benchmarks

BDN supports `Task`, `Task<T>`, `ValueTask`, and `ValueTask<T>` benchmark methods. Do not wrap synchronous operations in fake async code because the state-machine overhead becomes part of the measurement.

## Deferred execution

Returning an unmaterialized `IEnumerable<T>` can benchmark query creation instead of execution. Materialize or consume deferred sequences when execution is the intended measurement.

## Constant folding

Do not benchmark literals/`const` inputs that the JIT can precompute. Store inputs in fields, `[Params]`, or argument sources.

## Randomness and reproducibility

Use fixed seeds for generated benchmark data unless randomness itself is under investigation.

## Benchmark class constraints

Follow the installed BDN version's class/method constraints. In normal cases benchmark classes/methods should be public instance members that BDN can generate a harness around.

## Parameterization

Use `[Params]`, `[ParamsSource]`, `[Arguments]`, `[ArgumentsSource]`, and generic type arguments intentionally. Remember that parameter dimensions multiply case count.

If different benchmarks need materially different parameter spaces, prefer separate classes rather than a large Cartesian product.

## Validation checklist

- [ ] Setup work is outside the measured method unless intentionally measured
- [ ] Results/work cannot be optimized away
- [ ] Deferred execution is actually executed
- [ ] Inputs are not accidentally constant-folded
- [ ] Random data is reproducible
- [ ] State is reset correctly
- [ ] Parameter/job count is intentional
- [ ] A comparison has a clear baseline
