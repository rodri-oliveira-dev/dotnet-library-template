#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

fallback_version="${FALLBACK_VERSION:-}"
semver_regex='^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'

numeric_greater_than() {
  local left="$1"
  local right="$2"

  while [[ "${#left}" -gt 1 && "${left:0:1}" == '0' ]]; do
    left="${left:1}"
  done

  while [[ "${#right}" -gt 1 && "${right:0:1}" == '0' ]]; do
    right="${right:1}"
  done

  if [[ "${#left}" -gt "${#right}" ]]; then
    return 0
  fi

  if [[ "${#left}" -lt "${#right}" ]]; then
    return 1
  fi

  [[ "$left" > "$right" ]]
}

semver_greater_than() {
  local left="${1#v}"
  local right="${2#v}"
  local left_core="${left%%-*}"
  local right_core="${right%%-*}"
  local left_pre=''
  local right_pre=''

  if [[ "$left" == *-* ]]; then
    left_pre="${left#*-}"
  fi

  if [[ "$right" == *-* ]]; then
    right_pre="${right#*-}"
  fi

  local left_major left_minor left_patch
  local right_major right_minor right_patch
  IFS='.' read -r left_major left_minor left_patch <<< "$left_core"
  IFS='.' read -r right_major right_minor right_patch <<< "$right_core"

  local left_parts=("$left_major" "$left_minor" "$left_patch")
  local right_parts=("$right_major" "$right_minor" "$right_patch")
  local index

  for index in 0 1 2; do
    if numeric_greater_than "${left_parts[$index]}" "${right_parts[$index]}"; then
      return 0
    fi

    if numeric_greater_than "${right_parts[$index]}" "${left_parts[$index]}"; then
      return 1
    fi
  done

  if [[ -z "$left_pre" && -n "$right_pre" ]]; then
    return 0
  fi

  if [[ -n "$left_pre" && -z "$right_pre" ]]; then
    return 1
  fi

  if [[ -z "$left_pre" ]]; then
    return 1
  fi

  local left_identifiers right_identifiers
  IFS='.' read -r -a left_identifiers <<< "$left_pre"
  IFS='.' read -r -a right_identifiers <<< "$right_pre"

  local max_length="${#left_identifiers[@]}"
  if [[ "${#right_identifiers[@]}" -gt "$max_length" ]]; then
    max_length="${#right_identifiers[@]}"
  fi

  for ((index = 0; index < max_length; index++)); do
    if [[ "$index" -ge "${#left_identifiers[@]}" ]]; then
      return 1
    fi

    if [[ "$index" -ge "${#right_identifiers[@]}" ]]; then
      return 0
    fi

    local left_identifier="${left_identifiers[$index]}"
    local right_identifier="${right_identifiers[$index]}"

    if [[ "$left_identifier" == "$right_identifier" ]]; then
      continue
    fi

    local left_numeric=false
    local right_numeric=false
    [[ "$left_identifier" =~ ^[0-9]+$ ]] && left_numeric=true
    [[ "$right_identifier" =~ ^[0-9]+$ ]] && right_numeric=true

    if [[ "$left_numeric" == true && "$right_numeric" == true ]]; then
      if numeric_greater_than "$left_identifier" "$right_identifier"; then
        return 0
      fi
      return 1
    fi

    if [[ "$left_numeric" == true ]]; then
      return 1
    fi

    if [[ "$right_numeric" == true ]]; then
      return 0
    fi

    if [[ "$left_identifier" > "$right_identifier" ]]; then
      return 0
    fi
    return 1
  done

  return 1
}

latest_tag=''
while IFS= read -r tag; do
  [[ -z "$tag" ]] && continue

  if [[ ! "$tag" =~ $semver_regex ]]; then
    echo "Ignoring non-SemVer release tag '$tag'." >&2
    continue
  fi

  if [[ -z "$latest_tag" ]] || semver_greater_than "$tag" "$latest_tag"; then
    latest_tag="$tag"
  fi
done < <(git tag --merged HEAD --list 'v*.*.*')

if [[ -n "$latest_tag" ]]; then
  printf 'version=%s\n' "${latest_tag#v}"
  printf 'source=release tag %s\n' "$latest_tag"
  exit 0
fi

if [[ -z "$fallback_version" ]]; then
  echo 'Could not resolve a Sonar project version from release tags or FALLBACK_VERSION.' >&2
  exit 1
fi

printf 'version=%s\n' "$fallback_version"
printf 'source=PackageVersion fallback\n'
