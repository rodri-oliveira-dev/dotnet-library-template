---
name: test-gap-analysis
description: >-
  Pseudo-mutation analysis for behavioral blind spots: determine whether existing tests would catch meaningful caller-visible production changes, identify survivors or untested outcomes, and optionally close verified gaps with focused tests. Use for behavioral gaps and missing edge cases. Use coverage-analysis for project-wide coverage arithmetic and test-anti-patterns for broad test-quality smells.
license: MIT
---

# Test Gap Analysis

Answer one question: **which caller-visible production behaviors could change without an existing test failing?** Mutation reasoning is a probe, not the goal. Inventory public outcomes first, then verify only credible gaps.

## Decision flow

### 1. Set scope

Discover production and test files from the repository manifests and existing test layout. Keep a focused request focused.

| Request | Action |
|---|---|
| One component or named risk | Inventory every high-risk public outcome in scope; do not edit production code unless verification was requested |
| General small-component review | Inventory distinct outcomes and report caller-visible gaps from source/assertion mapping |
| Explicit survivor verification | Execute one representative observable candidate for each distinct high-risk outcome under verification |
| Explicit exhaustive audit | Read [references/mutation-catalog.md](references/mutation-catalog.md) and classify all meaningful candidates |
| Add tests to an existing suite | Analyze first; add tests only for verified survivors or demonstrated no-coverage outcomes |
| Create a new suite | Follow the repository's existing test conventions and the task's implementation skill; do not invent a new framework |

### 2. Establish one baseline

Run the narrowest existing repository-compatible test command once. Confirm tests actually executed. If the suite cannot run, continue statically and label executable mutation candidates **unverified**; do not invent a project-configuration cause.

For advisory reviews such as "would tests catch this?", source-to-assertion mapping is sufficient evidence for **No coverage** and **Candidate survivor (unverified)**. Apply temporary mutations only for explicit verification, exhaustive audit, or requested gap-closing tests.

### 3. Inventory public outcomes

For each public entry point, map:

- input partitions and guard boundaries;
- each independent return/result/exception/state transition/side effect;
- private-helper behavior only as observed through public outcomes;
- exact boundaries, rounding, retries, cancellation, and error propagation when relevant.

Use:

```text
public input/sequence -> expected outcome -> existing assertion -> gap
```

One asserted field does not cover another. One allowed result does not cover its denial. One boundary value does not protect both sides of the boundary.

### 4. Admit only observable candidates

Before reporting a mutation candidate, replay it mentally against existing asserted inputs. If an existing assertion observes the changed result, it is **Likely killed** and not a gap.

For survivors, state:

```text
witness -> original observation -> mutant observation
```

Exclude generated code, formatting/logging-only changes unless contractual, non-compiling edits, equivalent mutations, impossible domain values, trivial forwarding members, and private representation changes that callers cannot distinguish.

### 5. Rank and classify

Rank gaps by:

1. security denials, money/data correctness, errors, state changes;
2. wholly unasserted public outcomes;
3. boundaries/exact values reached only by weak assertions;
4. alternate variants of already-protected behavior.

Use these result labels:

| Result | Meaning |
|---|---|
| **Likely killed** | An existing assertion observes the changed outcome |
| **Candidate survivor (unverified)** | Observable change appears unasserted; not executed |
| **Survived** | Exact observable mutation executed and tests stayed green |
| **No coverage** | No test reaches the public outcome |
| **Equivalent** | No public observation changes; omit from findings |

Verdict:

- **Strong**: core branches and primary boundaries are protected; only minor variants remain.
- **Mixed**: meaningful protection exists but at least one important outcome partition is unprotected.
- **Weak**: important outcomes are broadly unprotected.

### 6. Verify safely when requested

1. Apply one temporary candidate and confirm the diff changes exactly one intended expression.
2. Run the narrowest covering tests.
3. Green = **Survived**; red = **Killed**, for that edit only.
4. Revert immediately and confirm the source baseline is clean.
5. Never leave temporary mutations in the workspace or commit them.

### 7. Close gaps only when requested

- Add focused tests only for demonstrated no-coverage outcomes or verified survivors.
- Prefer behavior-focused tests that kill related mutations over one test per syntax edit.
- Re-apply the representative mutation when practical and prove the new test kills it, then restore production code.
- Preserve assertion quality; do not add tests only to inflate coverage.

## Output contract

For focused analysis return:

1. one-line verdict (**Strong**, **Mixed**, or **Weak**);
2. a short strengths sentence;
3. one compact row per actionable gap:

| Risk | Public outcome | Change | Result/evidence | Smallest test |
|---|---|---|---|---|

Every gap needs a distinguishing witness and a concrete smallest test. Do not repeat the table in prose.

## Reliability rules

- A passing test that does not assert the changed outcome does not kill a mutation.
- Coverage is per behavior partition, not merely per executed line.
- Private helpers reached through a public method remain relevant only through observable behavior.
- Never recommend a redundant test for behavior the existing suite already protects.
- `AGENTS.md`, repository test conventions, and deterministic validation prevail over this skill.

## Validation

- [ ] Scope stayed proportional to the request
- [ ] Original tests passed, or static-only limits are explicit
- [ ] High-risk public outcomes in scope were inventoried
- [ ] Original and mutant observations differ publicly
- [ ] Every **Survived** candidate was actually executed
- [ ] Temporary mutations were reverted
- [ ] Findings exclude trivial, generated, and equivalent changes
- [ ] Recommendations target demonstrated gaps
