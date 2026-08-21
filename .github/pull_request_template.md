## Summary

Describe what changed and why.

## Related issue

Closes #

## Validation

Describe the checks you ran and any relevant limitations.

## Checklist

- [ ] The scope and rationale of this PR are described above.
- [ ] Tests were added or updated for behavioral changes, or the reason they are not needed is explained.
- [ ] `dotnet tool restore` completed successfully.
- [ ] `dotnet restore --locked-mode` completed successfully.
- [ ] `dotnet build --configuration Release --no-restore` completed successfully.
- [ ] `dotnet test --configuration Release --no-build` completed successfully.
- [ ] `CHANGELOG.md` was updated for a consumer-relevant change, or no changelog entry is required.
- [ ] Breaking changes are explicitly described with migration guidance, or this PR is not breaking.
- [ ] New dependencies are justified and use Central Package Management, or no dependency was added.
- [ ] No secrets, credentials, personal data, or other sensitive information were included.
