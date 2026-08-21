#!/usr/bin/env bash
set -euo pipefail

event_name="${EVENT_NAME:-}"
manual_version="${MANUAL_VERSION:-}"
ref_name="${REF_NAME:-}"
ref_type="${REF_TYPE:-}"
release_branch="${RELEASE_BRANCH:-main}"
remote_name="${REMOTE_NAME:-origin}"

case "$event_name" in
  workflow_dispatch)
    if [[ "$ref_type" != "branch" || "$ref_name" != "$release_branch" ]]; then
      echo "::error::Manual releases must run from branch '$release_branch'. Current ref: ${ref_type:-unknown}/${ref_name:-unknown}."
      exit 1
    fi

    release_tag="$manual_version"
    is_manual_release=true
    ;;
  push)
    if [[ "$ref_type" != "tag" ]]; then
      echo "::error::Push-triggered releases must run from a tag ref. Current ref: ${ref_type:-unknown}/${ref_name:-unknown}."
      exit 1
    fi

    release_tag="$ref_name"
    is_manual_release=false
    ;;
  *)
    echo "::error::Unsupported release event '$event_name'."
    exit 1
    ;;
esac

semver_regex='^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'

if [[ ! "$release_tag" =~ $semver_regex ]]; then
  echo "::error::Release version '$release_tag' must match vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH-prerelease."
  exit 1
fi

if [[ "$is_manual_release" == "true" ]]; then
  if ! remote_tag="$(git ls-remote --tags "$remote_name" "refs/tags/$release_tag")"; then
    echo "::error::Could not query remote '$remote_name' for release tag '$release_tag'."
    exit 1
  fi

  if [[ -n "$remote_tag" ]]; then
    echo "::error::Release tag '$release_tag' already exists. Choose a new version."
    exit 1
  fi
fi

package_version="${release_tag#v}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "package_version=$package_version"
    echo "release_tag=$release_tag"
    echo "should_publish=true"
    echo "is_manual_release=$is_manual_release"
  } >> "$GITHUB_OUTPUT"
else
  echo "package_version=$package_version"
  echo "release_tag=$release_tag"
  echo "should_publish=true"
  echo "is_manual_release=$is_manual_release"
fi
