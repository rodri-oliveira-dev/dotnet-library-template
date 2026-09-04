# Sonar quality issue synchronization

[Português](sonar-quality-issues.pt-BR.md) | **English**

This template includes an optional workflow at `.github/workflows/sonar-quality-issues.yml` that reconciles high-impact Sonar findings with GitHub Issues.

It complements `.github/workflows/sonar.yml`: the normal Sonar workflow performs analysis, coverage import and Quality Gate enforcement, while this workflow turns open `HIGH`/`BLOCKER` findings into trackable repository work.

## Triggers

The synchronization runs:

- every Monday at `12:17 UTC` (`09:17 America/Sao_Paulo` while UTC-3 applies);
- on demand through `workflow_dispatch`.

The non-round minute intentionally avoids the busiest part of the GitHub Actions scheduling window.

## Configuration

The workflow uses the same Sonar coordinates as `sonar.yml`:

```text
SONAR_TOKEN       secret   required to enable synchronization
SONAR_PROJECT_KEY variable optional; defaults to <github-owner>_<repository-name>
SONAR_HOST_URL    variable optional; defaults to https://sonarcloud.io
SONAR_ISSUE_LABEL variable optional; defaults to Sonar Quality Issues
```

`SONAR_TOKEN` is the only credential. Do not commit it. If the secret is absent or empty, scheduled and manual runs exit successfully without contacting Sonar or writing GitHub Issues.

Generated repositories do not inherit GitHub secrets or variables. Configure their own Sonar project and `SONAR_TOKEN`; override the variables only when the default coordinates do not match.

## Reconciliation behavior

Each qualifying Sonar issue key maps to one workflow-managed GitHub Issue.

On every successful synchronization the workflow:

1. queries all Sonar findings that are `OPEN` with `HIGH` or `BLOCKER` impact;
2. creates a GitHub Issue when no managed issue exists for that Sonar key;
3. updates the managed title/body when Sonar metadata changes;
4. reopens a managed GitHub Issue if the same Sonar finding qualifies again;
5. restores the managed label if it was manually removed;
6. closes a managed GitHub Issue when its Sonar finding is no longer returned as open with `HIGH`/`BLOCKER` impact.

Closing therefore means that the Sonar finding was resolved, closed, or no longer has a tracked impact severity at the time of a complete successful reconciliation. If it later qualifies again, the same GitHub Issue is reopened rather than duplicated.

## Managed content and manual notes

The workflow owns only the section between these markers:

```text
<!-- sonar-sync:start -->
...
<!-- sonar-sync:end -->
```

Manual notes added below the managed section are preserved when the workflow refreshes Sonar metadata.

A hidden `sonar-issue-key` marker provides stable deduplication. The workflow accepts a managed key only from Issues created by `github-actions[bot]`, reducing the risk that a user-authored Issue can spoof a public Sonar key. Removing only the label does not cause a duplicate; the workflow restores it.

Do not manually remove the managed markers from a synchronized Issue. Doing so intentionally breaks the workflow's ownership/deduplication contract.

## Permissions and security

The workflow deliberately uses only:

```yaml
permissions:
  contents: read
  issues: write
```

`contents: read` is required to check out the reconciliation script and to resolve repository metadata. `issues: write` is required to create, update, reopen, close and label managed Issues.

Third-party Actions are pinned to immutable commit SHAs. Checkout does not persist credentials. The workflow does not build or execute repository application code and has no `pull_request` or `pull_request_target` trigger.

## Implementation

The workflow YAML contains triggers, permissions and configuration. Reconciliation logic lives in:

```text
.github/scripts/sync-sonar-quality-issues.js
```

Keeping the API and issue-management logic outside the YAML makes it easier to review and evolve without turning the workflow file into a large embedded program.

### Sonar analysis and coverage

The synchronization script remains in Sonar's source analysis, so JavaScript maintainability, reliability, security, duplication and architecture checks can still report findings against it.

The baseline does not currently introduce an npm test toolchain or LCOV generation only for this GitHub-hosted orchestration script. To avoid treating the absence of JavaScript coverage infrastructure as uncovered product code, `sonar.yml` uses the narrow coverage-only exclusion:

```text
.github/scripts/sync-sonar-quality-issues.js
```

This is configured through `sonar.coverage.exclusions`, not `sonar.exclusions`; the script is still analyzed by Sonar. If the script later gains a real JavaScript test suite with LCOV reporting, remove this coverage exclusion and import that report instead.

## Manual execution

Open:

```text
Actions
→ Sync Sonar Quality Issues
→ Run workflow
```

A successful run writes a summary with counts for qualifying findings, created, updated, reopened, closed and unchanged Issues, plus restored managed labels.

## Operational notes

- A Sonar API failure stops reconciliation; the workflow does not close Issues based on an incomplete/failed query.
- Pagination is bounded to 100 pages of 500 findings as a safety limit.
- Only `HIGH` and `BLOCKER` impact severities are synchronized by this baseline.
- GitHub pull requests returned by the Issues API are ignored.
- Duplicate workflow-managed Issues for the same Sonar key are reported as warnings; the first discovered managed Issue remains canonical.

## Related documentation

For Sonar project setup, Quality Gate behavior, versioning and coverage import, see [sonarqube-cloud.md](sonarqube-cloud.md).
