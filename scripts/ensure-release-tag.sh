#!/usr/bin/env bash
set -euo pipefail

is_manual_release="${IS_MANUAL_RELEASE:-false}"
release_tag="${RELEASE_TAG:-}"
validated_sha="${VALIDATED_SHA:-}"
remote_name="${REMOTE_NAME:-origin}"

if [[ "$is_manual_release" != "true" && "$is_manual_release" != "false" ]]; then
  echo "::error::IS_MANUAL_RELEASE must be 'true' or 'false', got '$is_manual_release'."
  exit 1
fi

if [[ -z "$release_tag" ]]; then
  echo '::error::RELEASE_TAG is required.'
  exit 1
fi

if [[ -z "$validated_sha" ]]; then
  echo '::error::VALIDATED_SHA is required.'
  exit 1
fi

if [[ "$is_manual_release" == "true" ]]; then
  if ! remote_tag="$(git ls-remote --tags "$remote_name" "refs/tags/$release_tag")"; then
    echo "::error::Could not query remote '$remote_name' before creating release tag '$release_tag'."
    exit 1
  fi

  if [[ -n "$remote_tag" ]]; then
    echo "::error::Release tag '$release_tag' was created after validation started. Aborting to avoid publishing a different commit."
    exit 1
  fi

  git tag "$release_tag" "$validated_sha"
  git push "$remote_name" "refs/tags/$release_tag"
  echo "Release tag '$release_tag' created at '$validated_sha'."
else
  if ! remote_tag_refs="$(git ls-remote --tags "$remote_name" "refs/tags/$release_tag" "refs/tags/$release_tag^{}")"; then
    echo "::error::Could not query remote '$remote_name' before verifying release tag '$release_tag'."
    exit 1
  fi

  if [[ -z "$remote_tag_refs" ]]; then
    echo "::error::Release tag '$release_tag' no longer exists on remote '$remote_name'."
    exit 1
  fi

  direct_ref="refs/tags/$release_tag"
  peeled_ref="refs/tags/$release_tag^{}"
  direct_sha="$(awk -v ref="$direct_ref" '$2 == ref { print $1; exit }' <<< "$remote_tag_refs")"
  peeled_sha="$(awk -v ref="$peeled_ref" '$2 == ref { print $1; exit }' <<< "$remote_tag_refs")"
  resolved_sha="${peeled_sha:-$direct_sha}"

  if [[ -z "$resolved_sha" ]]; then
    echo "::error::Could not resolve remote release tag '$release_tag' to a commit."
    exit 1
  fi

  if [[ "$resolved_sha" != "$validated_sha" ]]; then
    echo "::error::Remote release tag '$release_tag' resolves to '$resolved_sha', expected validated SHA '$validated_sha'."
    exit 1
  fi

  echo "Remote release tag '$release_tag' matches validated SHA '$validated_sha'."
fi
