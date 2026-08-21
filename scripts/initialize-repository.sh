#!/usr/bin/env bash
set -euo pipefail

source_repository='rodri-oliveira-dev/dotnet-library-template'
template_short_name="${INITIALIZE_REPOSITORY_TEMPLATE_SHORT_NAME:-rodri-lib}"
cleanup_root=''

fail() {
  echo "::error::$1"
  exit 1
}

cleanup() {
  if [[ -n "$cleanup_root" ]]; then
    rm -rf "$cleanup_root"
  fi
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

resolve_directory() {
  local path="$1"

  mkdir -p "$path"
  (
    cd "$path"
    pwd -P
  )
}

validate_project_name() {
  local name="$1"
  local trimmed
  trimmed="$(trim "$name")"

  if [[ -z "$trimmed" ]]; then
    fail 'Project name must not be empty or whitespace only.'
  fi

  if [[ "$name" != "$trimmed" ]]; then
    fail 'Project name must not contain leading or trailing whitespace.'
  fi

  if [[ "$name" == *'..'* ]]; then
    fail 'Project name must not contain path traversal segments.'
  fi

  if [[ "$name" == *'/'* || "$name" == *'\'* ]]; then
    fail 'Project name must not contain path separators.'
  fi

  if [[ "$name" =~ [[:cntrl:]] ]]; then
    fail 'Project name must not contain control characters.'
  fi

  if [[ ! "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$ ]]; then
    fail 'Project name must be a valid dotted .NET identifier, for example MyCompany.MyLibrary.'
  fi
}

validate_github_context() {
  local root="$1"
  local repository="${INITIALIZE_REPOSITORY_REPOSITORY:-${GITHUB_REPOSITORY:-}}"
  local ref_name="${INITIALIZE_REPOSITORY_REF_NAME:-${GITHUB_REF_NAME:-}}"
  local default_branch="${INITIALIZE_REPOSITORY_DEFAULT_BRANCH:-${GITHUB_DEFAULT_BRANCH:-}}"
  local remote_url=''

  if [[ "$repository" == "$source_repository" ]]; then
    fail "Initialize repository must not run against the source template repository '$source_repository'."
  fi

  if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    remote_url="$(git -C "$root" config --get remote.origin.url || true)"
    case "$remote_url" in
      *github.com[:/]rodri-oliveira-dev/dotnet-library-template|*github.com[:/]rodri-oliveira-dev/dotnet-library-template.git)
        fail "Initialize repository must not run against the source template repository '$source_repository'."
        ;;
    esac
  fi

  if [[ -n "$ref_name" || -n "$default_branch" ]]; then
    if [[ -z "$ref_name" || -z "$default_branch" ]]; then
      fail 'Default-branch validation requires both the current ref name and default branch.'
    fi

    if [[ "$ref_name" != "$default_branch" ]]; then
      fail "Initialize repository must run from the default branch '$default_branch'. Current ref: '$ref_name'."
    fi
  fi
}

assert_safe_root() {
  local root="$1"
  local generated="$2"

  if [[ -z "$root" || "$root" == '/' ]]; then
    fail 'Repository root resolved to an unsafe path.'
  fi

  if [[ "$root" == "$generated" || "$generated" == "$root"/* ]]; then
    fail 'Generated output must be outside the repository root.'
  fi
}

validate_template_source() {
  local template_source="$1"

  if [[ ! -f "$template_source/.template.config/template.json" ]]; then
    fail "Template source '$template_source' does not contain .template.config/template.json."
  fi
}

validate_destination_root() {
  local root="$1"

  if [[ ! -f "$root/.template.config/template.json" ]]; then
    fail "Destination '$root' does not look like an uninitialized GitHub Template copy."
  fi
}

validate_generated_output() {
  local generated="$1"
  local project_name="$2"
  local required=(
    "$project_name.slnx"
    "src/$project_name/$project_name.csproj"
    "tests/$project_name.Tests/$project_name.Tests.csproj"
    'README.md'
    'Directory.Build.props'
    'Directory.Packages.props'
    'global.json'
    '.github/workflows/ci.yml'
    '.github/workflows/release.yml'
    'scripts/verify-package.cs'
  )
  local forbidden=(
    '.template.config'
    '.github/workflows/initialize-repository.yml'
    '.github/workflows/template-validation.yml'
    '.github/workflows/sonar-template-validation.yml'
    '.github/workflows/versioning-validation.yml'
    '.github/workflows/release-publishing-validation.yml'
    '.github/workflows/github-template-initialization-validation.yml'
    'docs/template-development.md'
    'docs/repository-administration.md'
    'docs/library-readme.md'
    'README.en.md'
    'scripts/initialize-repository.sh'
  )
  local path
  local matches

  for path in "${required[@]}"; do
    if [[ ! -e "$generated/$path" ]]; then
      fail "Generated output is missing expected path: $path."
    fi
  done

  for path in "${forbidden[@]}"; do
    if [[ -e "$generated/$path" ]]; then
      fail "Maintenance-only path leaked into generated output: $path."
    fi
  done

  matches="$(grep -R -I -n -E 'Template\.Library' "$generated" \
    --exclude-dir=.git \
    --exclude-dir=bin \
    --exclude-dir=obj \
    --exclude-dir=artifacts || true)"

  if [[ -n "$matches" ]]; then
    echo "$matches"
    fail 'Generated output still contains the neutral Template.Library identity.'
  fi
}

replace_repository_tree() {
  local root="$1"
  local generated="$2"

  (
    cd "$(dirname "$root")"
    find "$(basename "$root")" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf -- {} +
  )

  cp -a "$generated"/. "$root"/
}

main() {
  local project_name="${1:-${PROJECT_NAME:-}}"
  local root_argument="${2:-${GITHUB_WORKSPACE:-$PWD}}"
  local template_argument="${3:-$root_argument}"
  local root
  local template_source
  local temp_root
  local generated

  validate_project_name "$project_name"

  root="$(resolve_directory "$root_argument")"
  template_source="$(resolve_directory "$template_argument")"
  validate_github_context "$root"
  validate_destination_root "$root"
  validate_template_source "$template_source"

  temp_root="$(mktemp -d)"
  cleanup_root="$temp_root"
  trap cleanup EXIT
  generated="$temp_root/generated/$project_name"
  mkdir -p "$(dirname "$generated")"

  assert_safe_root "$root" "$generated"

  dotnet new install "$template_source" --force
  dotnet new "$template_short_name" -n "$project_name" -o "$generated"

  validate_generated_output "$generated" "$project_name"

  cd "$temp_root"
  replace_repository_tree "$root" "$generated"
  validate_generated_output "$root" "$project_name"

  echo "Repository initialized as '$project_name'."
}

main "$@"
