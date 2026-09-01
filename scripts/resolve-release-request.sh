#!/usr/bin/env bash
set -euo pipefail

event_name="${EVENT_NAME:-}"
requested_version="${REQUESTED_VERSION:-${MANUAL_VERSION:-}}"
publish_requested="${PUBLISH_REQUESTED:-false}"

if [[ "$publish_requested" != "true" && "$publish_requested" != "false" ]]; then
  echo "::error::PUBLISH_REQUESTED must be 'true' or 'false', got '$publish_requested'."
  exit 1
fi

case "$event_name" in
  pull_request)
    should_publish=false
    ;;
  workflow_dispatch)
    should_publish="$publish_requested"
    ;;
  *)
    echo "::error::Unsupported release event '$event_name'."
    exit 1
    ;;
esac

if [[ -z "$requested_version" ]]; then
  echo '::error::REQUESTED_VERSION is required.'
  exit 1
fi

semver_regex='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'

if [[ ! "$requested_version" =~ $semver_regex ]]; then
  echo "::error::Release version '$requested_version' must match MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-prerelease without a leading v."
  exit 1
fi

release_tag="v$requested_version"
is_prerelease=false

if [[ "$requested_version" == *-* ]]; then
  is_prerelease=true
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "version=$requested_version"
    echo "tag=$release_tag"
    echo "is_prerelease=$is_prerelease"
    echo "should_publish=$should_publish"
    echo "package_version=$requested_version"
    echo "release_tag=$release_tag"
  } >> "$GITHUB_OUTPUT"
else
  echo "version=$requested_version"
  echo "tag=$release_tag"
  echo "is_prerelease=$is_prerelease"
  echo "should_publish=$should_publish"
  echo "package_version=$requested_version"
  echo "release_tag=$release_tag"
fi
