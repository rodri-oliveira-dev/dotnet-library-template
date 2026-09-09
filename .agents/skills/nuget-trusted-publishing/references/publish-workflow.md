# Publish Workflow Reference

Reference pattern for tag-triggered NuGet publishing with trusted publishing. Adapt it to the repository's existing release workflow instead of replacing governance wholesale.

## Core Pattern

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    environment: release
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@<approved-pinned-sha>

      - name: Setup .NET
        uses: actions/setup-dotnet@<approved-pinned-sha>

      - name: Restore
        run: dotnet restore --locked-mode

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Test
        run: dotnet test --configuration Release --no-build

      - name: Pack
        run: dotnet pack --configuration Release --no-build --output ./artifacts

      - name: NuGet login (OIDC)
        id: login
        uses: NuGet/login@<approved-pinned-reference>
        with:
          user: ${{ secrets.NUGET_USER }}

      - name: Push to NuGet
        run: >
          dotnet nuget push ./artifacts/*.nupkg
          --api-key ${{ steps.login.outputs.NUGET_API_KEY }}
          --source https://api.nuget.org/v3/index.json
          --skip-duplicate
```

## Adaptation Rules

- Preserve the repository's existing version derivation, package validation, release metadata, Source Link checks, signing, GitHub Release behavior, and recovery semantics.
- Keep dependency versions centralized when Central Package Management is enabled.
- Keep GitHub Actions pinned according to repository policy.
- Use the exact workflow filename and environment in the nuget.org trusted publishing policy.
- Keep CI separate from publish permissions: normal PR CI does not need `id-token: write`.
- Do not remove the old API-key path until a real trusted-publishing release succeeds.
- Do not re-tag or reuse a version after publication errors; resolve the workflow/release obstacle instead.
