# Mutation Candidate Catalog

Read this reference only for an explicitly exhaustive audit or when mutation semantics are unfamiliar. For focused analysis, use the smaller risk-ranked workflow in `SKILL.md`.

## Candidate categories

| Category | Typical changes | What a killing test must observe |
|---|---|---|
| Boundary | `<` ↔ `<=`, `>` ↔ `>=`, zero/one, first/last index | Exact value at and immediately around the boundary |
| Boolean/logic | `&&` ↔ `||`, negate/remove one condition, `true` ↔ `false` | Each condition independently changes asserted behavior |
| Return value | value ↔ default/empty/null, true ↔ false, count ±1 | The returned value or downstream state |
| Error/guard | remove guard, change exception/error type, swallow propagation | Invalid input and exact observable error semantics |
| Arithmetic | `+` ↔ `-`, `*` ↔ `/`, sign flip, increment ↔ decrement | Exact calculated result, not only a broad range |
| Collection | empty/non-empty, omit first/last item, order reversal | Contents, count, and order where relevant |
| State transition | skip assignment, retain old state, alter an existing update | Both result and resulting state |

## .NET-specific candidates

- remove null/range guards;
- change exception type;
- replace `??` fallback;
- change null-conditional access;
- return `default`;
- alter async cancellation/error propagation;
- change exact boundary operators;
- change arithmetic or conversion order where caller-visible.

## Equivalence and noise filters

Exclude:

- generated/designer/migration output;
- auto-properties, records/data holders, and trivial forwarding methods;
- logging-only or formatting-only changes unless contractual;
- impossible boundary values under the domain;
- redundant checks whose removal cannot affect public behavior;
- short-circuit or guard edits that fall through to the same return, exception, state, and side effects;
- private representation changes no current public input can distinguish;
- multiple syntax variants exercising the same missing behavior.

## Exhaustive audit procedure

1. Enumerate meaningful candidates by production behavior, not token/operator.
2. State the public input and different original/mutant observations.
3. Map each candidate to covering tests and relevant assertions.
4. Classify obvious killed/equivalent candidates statically.
5. Execute every candidate that might be reported as **Survived**.
6. After a green run, re-check that the mutation is publicly observable.
7. Revert after each run and confirm the clean baseline at the end.
8. Count only executed or definitively killed/equivalent candidates in totals; disclose omitted scope.
