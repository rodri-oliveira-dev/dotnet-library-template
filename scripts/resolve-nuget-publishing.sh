#!/usr/bin/env bash
set -euo pipefail

should_publish="${SHOULD_PUBLISH:-false}"
safe_to_publish="${SAFE_TO_PUBLISH:-false}"
nuget_user="${NUGET_USER:-}"

if [[ "$should_publish" != "true" && "$should_publish" != "false" ]]; then
  echo "::error::SHOULD_PUBLISH must be 'true' or 'false', got '$should_publish'."
  exit 1
fi

if [[ "$safe_to_publish" != "true" && "$safe_to_publish" != "false" ]]; then
  echo "::error::SAFE_TO_PUBLISH must be 'true' or 'false', got '$safe_to_publish'."
  exit 1
fi

trimmed_user="${nuget_user#"${nuget_user%%[![:space:]]*}"}"
trimmed_user="${trimmed_user%"${trimmed_user##*[![:space:]]}"}"

nuget_publishing_enabled=false
nuget_publishing_reason='disabled'

if [[ "$should_publish" != "true" ]]; then
  nuget_publishing_reason='release-disabled'
  echo 'NuGet publication disabled: release publication gate is disabled.'
elif [[ "$safe_to_publish" != "true" ]]; then
  nuget_publishing_reason='placeholder-package'
  echo 'NuGet publication disabled: source-template placeholder package detected.'
elif [[ -z "$trimmed_user" ]]; then
  nuget_publishing_reason='nuget-user-not-configured'
  echo 'NuGet publication disabled: NUGET_USER is not configured or is empty.'
else
  nuget_publishing_enabled=true
  nuget_publishing_reason='enabled'
  echo 'NuGet publication enabled: release is publishable and NUGET_USER is configured.'
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "nuget_publishing_enabled=$nuget_publishing_enabled"
    echo "nuget_publishing_reason=$nuget_publishing_reason"
  } >> "$GITHUB_OUTPUT"
else
  echo "nuget_publishing_enabled=$nuget_publishing_enabled"
  echo "nuget_publishing_reason=$nuget_publishing_reason"
fi
