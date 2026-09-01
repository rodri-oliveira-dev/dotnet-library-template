#:property RestorePackagesWithLockFile=false

using System.IO.Compression;
using System.Xml.Linq;

const string ExpectedPackageId = "RodriOliveira.DotNet.Library.Template";
const string ExpectedPackageType = "Template";
const string ExpectedTitle = "Rodrigo Oliveira .NET Library Template";
const string ExpectedAuthors = "Rodrigo de Oliveira";
const string ExpectedRepositoryUrl = "https://github.com/rodri-oliveira-dev/dotnet-library-template";
const string ExpectedProjectUrl = "https://github.com/rodri-oliveira-dev/dotnet-library-template";
const string ExpectedReadme = "README.md";
const string ExpectedIcon = "nuget-icon.png";
const string ExpectedShortName = "rodri-lib";
const string ExpectedSourceName = "Template.Library";
const string RequiredPackageTagsText = "dotnet;csharp;library;template;dotnet-new;net10;nuget";
const long MaxNuGetIconSizeInBytes = 1_048_576;

if (args.Length < 1)
{
    PrintUsage();
    return 1;
}

var packagePath = Path.GetFullPath(args[0]);
string? expectedVersion = null;

for (var index = 1; index < args.Length; index++)
{
    switch (args[index])
    {
        case "--expected-version" when index + 1 < args.Length:
            expectedVersion = args[++index];
            break;
        default:
            PrintUsage();
            return 1;
    }
}

var nupkg = ResolvePackage(packagePath);
using var archive = ZipFile.OpenRead(nupkg);

var nuspecEntry = archive.Entries.Single(entry =>
    entry.FullName.EndsWith(".nuspec", StringComparison.OrdinalIgnoreCase));

using var nuspecStream = nuspecEntry.Open();
var nuspec = XDocument.Load(nuspecStream);
var ns = nuspec.Root!.Name.Namespace;
var metadata = nuspec.Root.Element(ns + "metadata")
    ?? throw new InvalidOperationException("Package metadata was not found in the nuspec.");

AssertEqual(ExpectedPackageId, metadata.Element(ns + "id")?.Value, "PackageId");
AssertEqual(ExpectedTitle, metadata.Element(ns + "title")?.Value, "Title");
AssertEqual(ExpectedAuthors, metadata.Element(ns + "authors")?.Value, "Authors");
AssertDescription(metadata.Element(ns + "description")?.Value);
AssertPackageTags(metadata.Element(ns + "tags")?.Value);
AssertEqual(ExpectedReadme, metadata.Element(ns + "readme")?.Value, "PackageReadme");
AssertEqual(ExpectedIcon, metadata.Element(ns + "icon")?.Value, "PackageIcon");
AssertDeprecatedMetadataAbsent(metadata, ns);
var license = metadata.Element(ns + "license");
AssertEqual("expression", license?.Attribute("type")?.Value, "LicenseType");
AssertEqual("MIT", license?.Value, "LicenseExpression");

if (!string.IsNullOrWhiteSpace(expectedVersion))
{
    AssertEqual(expectedVersion, metadata.Element(ns + "version")?.Value, "Version");
}

var packageType = metadata
    .Element(ns + "packageTypes")
    ?.Elements(ns + "packageType")
    .SingleOrDefault()
    ?.Attribute("name")
    ?.Value;
AssertEqual(ExpectedPackageType, packageType, "PackageType");

var repository = metadata.Element(ns + "repository");
AssertEqual("git", repository?.Attribute("type")?.Value, "RepositoryType");
AssertEqual(ExpectedRepositoryUrl, repository?.Attribute("url")?.Value, "RepositoryUrl");
AssertEqual(ExpectedProjectUrl, metadata.Element(ns + "projectUrl")?.Value, "ProjectUrl");

var entries = archive.Entries
    .Where(entry => !string.IsNullOrEmpty(entry.Name))
    .Select(entry => entry.FullName.Replace('\\', '/'))
    .ToArray();
var entrySet = entries.ToHashSet(StringComparer.Ordinal);

var requiredEntries = new[]
{
    "content/.template.config/template.json",
    ExpectedReadme,
    ExpectedIcon,
    "content/resources/nuget-icon.png",
    "content/Template.Library.slnx",
    "content/Directory.Build.props",
    "content/Directory.Packages.props",
    "content/global.json",
    "content/LICENSE",
    "content/.config/dotnet-tools.json",
    "content/.editorconfig",
    "content/src/Template.Library/Template.Library.csproj",
    "content/src/Template.Library/Class1.cs",
    "content/src/Template.Library/packages.lock.json",
    "content/tests/Template.Library.Tests/Template.Library.Tests.csproj",
    "content/tests/Template.Library.Tests/Class1Tests.cs",
    "content/tests/Template.Library.Tests/packages.lock.json",
    "content/docs/library-readme.md",
    "content/.github/workflows/ci.yml",
    "content/docs/library-release.yml",
    "content/scripts/release-candidate.cs",
    "content/scripts/verify-package.cs",
};

foreach (var entry in requiredEntries)
{
    AssertContains(entrySet, entry);
}

var iconEntry = archive.GetEntry(ExpectedIcon)
    ?? throw new InvalidOperationException("NuGet package icon entry was not found.");
if (iconEntry.Length <= 0 || iconEntry.Length > MaxNuGetIconSizeInBytes)
{
    throw new InvalidOperationException(
        $"PackageIcon '{ExpectedIcon}' must be non-empty and at most {MaxNuGetIconSizeInBytes} bytes, got {iconEntry.Length} bytes.");
}

var templateJsonEntry = archive.GetEntry("content/.template.config/template.json")
    ?? throw new InvalidOperationException("Template configuration entry was not found.");
using (var templateJsonReader = new StreamReader(templateJsonEntry.Open()))
{
    var templateJson = templateJsonReader.ReadToEnd();
    AssertStringContains(templateJson, "\"shortName\": \"rodri-lib\"", "template.json shortName");
    AssertStringContains(templateJson, "\"sourceName\": \"Template.Library\"", "template.json sourceName");
    AssertStringContains(templateJson, "\"rename\":", "template.json rename");
    AssertStringContains(templateJson, "\"docs/library-release.yml\": \".github/workflows/release.yml\"", "template.json release workflow rename");
}

var generatedReleaseEntry = archive.GetEntry("content/docs/library-release.yml")
    ?? throw new InvalidOperationException("Generated release workflow template entry was not found.");
using (var generatedReleaseReader = new StreamReader(generatedReleaseEntry.Open()))
{
    var generatedRelease = generatedReleaseReader.ReadToEnd();
    AssertStringContains(generatedRelease, "workflow_dispatch:", "generated release workflow_dispatch");
    AssertStringContains(generatedRelease, "publish:", "generated release publish input");
    AssertStringContains(generatedRelease, "release-candidate-${{ steps.release-metadata.outputs.version }}", "generated release candidate artifact");
    AssertStringContains(generatedRelease, "scripts/release-candidate.cs", "generated release candidate helper");
    AssertStringContains(generatedRelease, "release-manifest.json", "generated release manifest");
    AssertStringContains(generatedRelease, "SHA256SUMS", "generated release checksums");
    AssertStringContains(generatedRelease, "actions/attest@", "generated release attestation");
    AssertStringContains(generatedRelease, "NuGet/login@8d196754b4036150537f80ac539e15c2f1028841", "generated NuGet Trusted Publishing");

    AssertStringDoesNotContain(generatedRelease, "RodriOliveira.DotNet.Library.Template", "generated release template PackageId");
    AssertStringDoesNotContain(generatedRelease, "packaging/", "generated release packaging path");
    AssertStringDoesNotContain(generatedRelease, "packaging\\", "generated release packaging path");
    AssertStringDoesNotContain(generatedRelease, "verify-template-package", "generated release template verifier");
    AssertStringDoesNotContain(generatedRelease, "validate-template-package-e2e", "generated release template E2E validator");
}

var forbiddenPrefixes = new[]
{
    "content/.git/",
    "content/artifacts/",
    "content/packaging/",
    "content/TestResults/",
    "content/.vs/",
    "content/.idea/",
    "content/.dotnet/",
    "content/.dotnet-home/",
    "content/.nuget/",
    "content/packages/",
    "lib/",
    "ref/",
    "runtimes/",
    "tools/",
    "build/",
    "buildTransitive/",
};

var forbiddenExactEntries = new[]
{
    "content/.git",
    "content/.github/workflows/release.yml",
    "content/.github/workflows/template-package-validation.yml",
    "content/scripts/verify-template-package.cs",
    "content/scripts/validate-template-package-e2e.sh",
};

foreach (var entry in entries)
{
    var fileName = Path.GetFileName(entry);

    if (forbiddenPrefixes.Any(prefix => entry.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        || entry.Contains("/bin/", StringComparison.OrdinalIgnoreCase)
        || entry.Contains("/obj/", StringComparison.OrdinalIgnoreCase)
        || entry.Contains("/TestResults/", StringComparison.OrdinalIgnoreCase)
        || entry.EndsWith(".nupkg", StringComparison.OrdinalIgnoreCase)
        || entry.EndsWith(".snupkg", StringComparison.OrdinalIgnoreCase)
        || entry.EndsWith(".user", StringComparison.OrdinalIgnoreCase)
        || entry.EndsWith(".suo", StringComparison.OrdinalIgnoreCase)
        || entry.EndsWith(".binlog", StringComparison.OrdinalIgnoreCase)
        || fileName.EndsWith(".pfx", StringComparison.OrdinalIgnoreCase)
        || fileName.EndsWith(".pem", StringComparison.OrdinalIgnoreCase)
        || fileName.EndsWith(".key", StringComparison.OrdinalIgnoreCase)
        || fileName.Equals(".env", StringComparison.OrdinalIgnoreCase)
        || fileName.Contains("secret", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException($"Forbidden package entry found: {entry}");
    }
}

foreach (var entry in forbiddenExactEntries)
{
    if (entrySet.Contains(entry))
    {
        throw new InvalidOperationException($"Template-package maintenance entry should not be packed: {entry}");
    }
}

Console.WriteLine($"Template package validated: {Path.GetFileName(nupkg)}");
Console.WriteLine($"PackageId: {ExpectedPackageId}");
Console.WriteLine($"PackageType: {ExpectedPackageType}");
Console.WriteLine($"Title: {ExpectedTitle}");
Console.WriteLine($"Authors: {ExpectedAuthors}");
Console.WriteLine($"RepositoryUrl: {ExpectedRepositoryUrl}");
Console.WriteLine($"PackageIcon: {ExpectedIcon} ({iconEntry.Length} bytes)");
Console.WriteLine($"Template short name: {ExpectedShortName}");
Console.WriteLine($"Template source name: {ExpectedSourceName}");

if (!string.IsNullOrWhiteSpace(expectedVersion))
{
    Console.WriteLine($"Version: {expectedVersion}");
}

return 0;

static string ResolvePackage(string path)
{
    if (File.Exists(path))
    {
        if (!path.EndsWith(".nupkg", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith(".snupkg", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Expected a .nupkg file, got '{path}'.");
        }

        return path;
    }

    if (!Directory.Exists(path))
    {
        throw new DirectoryNotFoundException($"Package path was not found: {path}");
    }

    return Directory.EnumerateFiles(path, $"{ExpectedPackageId}.*.nupkg")
        .Where(file => !file.EndsWith(".snupkg", StringComparison.OrdinalIgnoreCase))
        .Single();
}

static void PrintUsage()
{
    Console.Error.WriteLine(
        "Usage: dotnet run --file scripts/verify-template-package.cs -- <package-directory-or-nupkg> "
        + "[--expected-version <version>]");
}

static void AssertContains(ISet<string> values, string expected)
{
    if (!values.Contains(expected))
    {
        throw new InvalidOperationException($"Required package entry was not found: {expected}");
    }
}

static void AssertStringContains(string value, string expected, string field)
{
    if (!value.Contains(expected, StringComparison.Ordinal))
    {
        throw new InvalidOperationException($"{field} was not found.");
    }
}

static void AssertStringDoesNotContain(string value, string forbidden, string field)
{
    if (value.Contains(forbidden, StringComparison.Ordinal))
    {
        throw new InvalidOperationException($"{field} leaked forbidden content: {forbidden}");
    }
}

static void AssertDescription(string? description)
{
    AssertNotBlank(description, "Description");
    AssertStringContains(description!, "dotnet new template", "Description");
    AssertStringContains(description!, ".NET 10 class libraries", "Description");
    AssertStringContains(description!, "release automation", "Description");
}

static void AssertPackageTags(string? tags)
{
    AssertNotBlank(tags, "PackageTags");

    var normalizedTags = tags!
        .Replace(';', ' ')
        .Replace(',', ' ');
    var tagSet = normalizedTags
        .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    foreach (var tag in RequiredPackageTagsText.Split(';'))
    {
        if (!tagSet.Contains(tag))
        {
            throw new InvalidOperationException($"PackageTags must include '{tag}'.");
        }
    }
}

static void AssertDeprecatedMetadataAbsent(XElement metadata, XNamespace ns)
{
    // NuGet SDK emits licenseUrl as a compatibility shim for PackageLicenseExpression.
    foreach (var elementName in new[] { "iconUrl", "owners", "summary" })
    {
        if (metadata.Element(ns + elementName) is not null)
        {
            throw new InvalidOperationException($"Deprecated NuGet metadata must not be used: {elementName}");
        }
    }
}

static void AssertEqual(string expected, string? actual, string field)
{
    if (!string.Equals(expected, actual, StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            $"{field}: expected '{expected}', got '{actual ?? "<null>"}'.");
    }
}

static void AssertNotBlank(string? value, string field)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"{field} cannot be blank.");
    }
}
