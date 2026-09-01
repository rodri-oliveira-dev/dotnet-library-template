#!/usr/bin/env bash
set -euo pipefail

package_path="${1:-}"
repository_root="${2:-$PWD}"
package_id='RodriOliveira.DotNet.Library.Template'

if [[ -z "$package_path" ]]; then
  echo 'Usage: scripts/validate-template-package-e2e.sh <template-package.nupkg> [repository-root]' >&2
  exit 1
fi

package_path="$(cd "$(dirname "$package_path")" && pwd)/$(basename "$package_path")"
repository_root="$(cd "$repository_root" && pwd)"

if [[ ! -f "$package_path" ]]; then
  echo "Template package not found: $package_path" >&2
  exit 1
fi

if [[ ! -f "$repository_root/.template.config/template.json" ]]; then
  echo "Repository template source not found: $repository_root/.template.config/template.json" >&2
  exit 1
fi

work_root="${TEMPLATE_PACKAGE_E2E_ROOT:-$(mktemp -d)}"
dotnet_home="$work_root/dotnet-home"
package_output="$work_root/package/Validation.SampleLibrary"
repository_output="$work_root/repository/Validation.SampleLibrary"

mkdir -p "$dotnet_home" "$(dirname "$package_output")" "$(dirname "$repository_output")"

export DOTNET_CLI_HOME="$dotnet_home"
export DOTNET_NOLOGO=true

cleanup() {
  dotnet new uninstall "$package_id" >/dev/null 2>&1 || true
  dotnet new uninstall "$repository_root" >/dev/null 2>&1 || true
}
trap cleanup EXIT

dotnet new install "$package_path"

listing="$(dotnet new list rodri-lib)"
echo "$listing"
if [[ "$listing" != *"rodri-lib"* ]]; then
  echo 'Template rodri-lib was not listed after installing the nupkg.' >&2
  exit 1
fi

dotnet new rodri-lib -n Validation.SampleLibrary -o "$package_output"
dotnet new uninstall "$package_id"

dotnet new install "$package_path"
dotnet new list rodri-lib >/dev/null
dotnet new uninstall "$package_id"

dotnet new install "$repository_root"
dotnet new rodri-lib -n Validation.SampleLibrary -o "$repository_output"
dotnet new uninstall "$repository_root"

diff -ruN \
  --exclude='.git' \
  --exclude='bin' \
  --exclude='obj' \
  --exclude='artifacts' \
  "$repository_output" \
  "$package_output"

git -C "$package_output" init -b main
git -C "$package_output" config user.name 'Template Package Validation'
git -C "$package_output" config user.email 'template-package-validation@example.invalid'
git -C "$package_output" add --all
git -C "$package_output" commit -m 'Initial generated library'
git -C "$package_output" remote add origin https://github.com/example/Validation.SampleLibrary.git

dotnet tool restore --tool-manifest "$package_output/.config/dotnet-tools.json"
dotnet restore "$package_output/Validation.SampleLibrary.slnx" --locked-mode
dotnet format "$package_output/Validation.SampleLibrary.slnx" --verify-no-changes --no-restore
dotnet build "$package_output/Validation.SampleLibrary.slnx" --configuration Release --no-restore
dotnet test "$package_output/Validation.SampleLibrary.slnx" --configuration Release --no-build
dotnet pack "$package_output/src/Validation.SampleLibrary/Validation.SampleLibrary.csproj" \
  --configuration Release \
  --no-build \
  --output "$package_output/artifacts/packages"
dotnet run --file "$package_output/scripts/verify-package.cs" -- "$package_output/artifacts/packages" \
  --require-source-link \
  --expected-version 1.0.0

if [[ -e "$package_output/packaging" ]]; then
  echo 'Template-package packaging infrastructure leaked into generated output.' >&2
  exit 1
fi

if [[ -e "$package_output/.github/workflows/template-package-validation.yml" ||
      -e "$package_output/scripts/verify-template-package.cs" ||
      -e "$package_output/scripts/validate-template-package-e2e.sh" ]]; then
  echo 'Template-package maintenance assets leaked into generated output.' >&2
  exit 1
fi

echo "Template package E2E validation succeeded: $package_path"
