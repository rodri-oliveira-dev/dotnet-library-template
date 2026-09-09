---
name: authoring-github-workflows
description: "Author and review GitHub Actions workflow YAML safely so syntactically-valid YAML can't ship a workflow that GitHub Actions refuses to run. USE FOR: editing, adding, or reviewing any file under .github/workflows/, writing run-name/name/if/env/run values that contain ${{ }} expressions, diagnosing a run that fails with 'This run likely failed because of a workflow file issue' and no jobs starting, deciding when a workflow scalar must be quoted, validating workflows with actionlint. DO NOT USE FOR: authoring application YAML unrelated to GitHub Actions, Azure Pipelines, GitLab CI, or non-workflow YAML. SCOPE: syntactic/structural workflow correctness; pair with ci-release-governance for semantic CI/release design. INVOKES: actionlint plus git/grep for inspection."
license: MIT
---

# Authoring GitHub Actions Workflows Safely

GitHub Actions workflow files are YAML, but **valid YAML is not the same as a valid workflow**. A workflow can parse cleanly with `yaml.safe_load` (or a casual review) yet still be rejected by GitHub Actions at load time — producing the opaque failure *"This run likely failed because of a workflow file issue"* with **zero jobs started**. This skill teaches the YAML-vs-Actions traps (the `#`-as-comment trap above all), how to quote expression scalars correctly, and how to validate with `actionlint` before merge.

> **Scope: syntactic vs. semantic.** This skill is about the *syntactic and structural* correctness of workflow YAML — quoting, parsing, and `actionlint`-level validity that determines whether GitHub Actions will load and run a file at all. It is **not** about what a workflow should do. For semantic and functional CI/release design in this template, use [`ci-release-governance`](../ci-release-governance/SKILL.md). The two are complementary.

## When to Use

- Editing, adding, or reviewing any file under `.github/workflows/`.
- Writing a `run-name`, `name`, `if`, `env`, `with`, or `run` value that embeds a `${{ }}` expression.
- A workflow run failed with *"This run likely failed because of a workflow file issue"* and **no jobs ran**.
- CI suddenly breaks after a workflow edit even though the change looked syntactically valid.
- Deciding whether a YAML scalar needs quoting.

## When Not to Use

- Authoring non-Actions YAML (app config, Kubernetes, Compose, Azure Pipelines, GitLab CI).
- Pure shell/script logic inside an already-valid `run:` block.

## The #1 Trap: `#` inside an unquoted expression becomes a YAML comment

In YAML, a space followed by `#` starts a **comment**. In an unquoted (plain) scalar, everything from a space-then-`#` to end-of-line is silently discarded:

```yaml
# BAD — the run-name is silently truncated at " #"
run-name: ${{ inputs.pr_number != '' && format('Evaluate PR #{0} @ {1}', inputs.pr_number, inputs.head_sha) || '' }}
```

YAML parses this as `run-name: ${{ inputs.pr_number != '' && format('Evaluate PR` — an **unterminated `${{` expression**. `yaml.safe_load` succeeds, but GitHub Actions rejects the malformed expression and refuses to start any run.

```yaml
# GOOD — wrap the whole value in double quotes so '#' stays inside the scalar
run-name: "${{ inputs.pr_number != '' && format('Evaluate PR #{0} @ {1}', inputs.pr_number, inputs.head_sha) || '' }}"
```

## Other characters that force quoting in a plain scalar

| Character / pattern | Why it breaks | Fix |
|---------------------|---------------|-----|
| space then `#` | Starts a YAML comment; truncates the value | Quote the whole value |
| Leading `*`, `&`, `!`, `?`, `\|`, `>`, `@`, `` ` `` | YAML anchors/aliases/tags/block scalars | Quote the value |
| Leading `{` or `[` | Parsed as flow mapping/sequence | Quote the value |
| `:` then space inside the value | Parsed as a nested mapping key | Quote the value |
| Leading/trailing spaces that matter | Plain scalars strip them | Quote the value |
| Values such as `true`, `false`, numbers that must stay strings | YAML type coercion | Quote the value |

**Rule of thumb:** if a `name`, `run-name`, `if`, `env`, or `with` value contains a `${{ }}` expression and any literal `#`, `:`, or leading special character, wrap the entire scalar in double quotes.

## Workflow

### Step 1: Identify changed workflow files

```bash
git diff --name-only origin/main... -- .github/workflows/
```

For each file, scan every line that contains `${{` together with `#`, colon-space, or a leading special character.

### Step 2: Quote risky expression scalars

Wrap the full value in double quotes when it embeds an expression and contains a risky character. Prefer double quotes when the inner expression uses single quotes, and vice versa. Do **not** escape the `${{ }}` braces.

### Step 3: Validate with actionlint

`actionlint` understands the GitHub Actions schema and expression grammar. Use the repository's pinned validation command when available. For manual validation, the repository baseline is:

```bash
ACTIONLINT_VERSION=1.7.12
ACTIONLINT_SHA256=8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8
curl \
  --fail \
  --silent \
  --show-error \
  --location \
  --proto '=https' \
  --proto-redir '=https' \
  --output actionlint.tar.gz \
  "https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz"
echo "${ACTIONLINT_SHA256}  actionlint.tar.gz" | sha256sum -c -
tar -xzf actionlint.tar.gz actionlint
./actionlint -shellcheck= -pyflakes= -color .github/workflows/*.yml
```

Pin both version and checksum. Keep the pin current enough to understand GitHub Actions schema additions already used by the repository, such as newer `permissions` scopes. When a download follows redirects, restrict both the initial request and redirects to HTTPS (`--proto '=https' --proto-redir '=https'`) rather than trusting the redirect target implicitly.

The truncated-expression bug surfaces as:

```text
got unexpected EOF while lexing end of string literal, expecting ''' [expression]
```

A clean exit code `0` means the workflows are structurally valid.

### Step 4: Confirm a YAML-only check is not enough

Do **not** rely on `yaml.safe_load`, `yamllint`, or "it parses" as proof. They can accept values that GitHub Actions rejects. Use `actionlint` or GitHub's own workflow parser.

### Step 5: Keep the governance gate green

This template validates GitHub Actions structure through `.github/workflows/agent-governance-validation.yml`. Ensure workflow changes pass its `actionlint` validation before requesting review.

## Validation

- [ ] Risky `${{ }}` scalars are quoted.
- [ ] `actionlint -shellcheck= -pyflakes= .github/workflows/*.yml` exits `0`.
- [ ] The pinned `actionlint` version recognizes every GitHub Actions feature currently used by the repository.
- [ ] Downloads that follow redirects enforce HTTPS for both the source and redirect targets.
- [ ] No workflow run reports that the workflow file could not be loaded.
- [ ] Agent governance validation is green on the PR.

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Unquoted `run-name`/`name` with `#` inside the expression | Wrap the whole value in double quotes |
| Trusting YAML parsing alone | Run `actionlint` |
| Using an old actionlint schema against newer GitHub permission scopes | Update the pinned version and checksum deliberately |
| Following download redirects without restricting their protocol | Use `--proto '=https' --proto-redir '=https'` |
| Escaping `${{` braces to fix parsing | Quote the scalar instead |
| Adding shellcheck noise while validating workflow syntax | Run with `-shellcheck= -pyflakes=` |
| Assuming a green YAML lint means the workflow will run | Validate with actionlint/GitHub Actions |

## References

- [actionlint](https://github.com/rhysd/actionlint)
- [GitHub Actions: workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [YAML 1.2 spec — comments](https://yaml.org/spec/1.2.2/#66-comments)
- [`ci-release-governance`](../ci-release-governance/SKILL.md)
