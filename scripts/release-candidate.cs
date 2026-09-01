#:property RestorePackagesWithLockFile=false
#pragma warning disable CA1050 // File-based apps keep helper types at top level.

using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

if (args.Length == 0)
{
    PrintUsage();
    return 1;
}

try
{
    return args[0] switch
    {
        "manifest" => WriteManifest(args[1..]),
        "verify" => VerifyCandidate(args[1..]),
        _ => UsageError()
    };
}
catch (Exception exception)
{
    Console.Error.WriteLine(exception.Message);
    return 1;
}

static int WriteManifest(string[] args)
{
    var options = ParseOptions(
        args,
        "--version",
        "--tag",
        "--commit",
        "--package-id",
        "--package",
        "--output",
        "--checksums-output");

    var packagePath = Path.GetFullPath(options["--package"]);
    var manifestPath = Path.GetFullPath(options["--output"]);
    var checksumsPath = Path.GetFullPath(options["--checksums-output"]);

    if (!File.Exists(packagePath))
    {
        throw new FileNotFoundException("Release package was not found.", packagePath);
    }

    var packageHash = ComputeSha256(packagePath);
    var manifest = new ReleaseManifest(
        options["--version"],
        options["--tag"],
        options["--commit"],
        options["--package-id"],
        Path.GetFileName(packagePath),
        packageHash);

    Directory.CreateDirectory(Path.GetDirectoryName(manifestPath)!);
    Directory.CreateDirectory(Path.GetDirectoryName(checksumsPath)!);

    File.WriteAllText(
        manifestPath,
        JsonSerializer.Serialize(manifest, ReleaseManifestJsonContext.Default.ReleaseManifest)
            + Environment.NewLine);

    var manifestHash = ComputeSha256(manifestPath);
    File.WriteAllLines(
        checksumsPath,
        new[]
        {
            $"{packageHash}  {Path.GetFileName(packagePath)}",
            $"{manifestHash}  {Path.GetFileName(manifestPath)}"
        });

    Console.WriteLine($"Release manifest written: {manifestPath}");
    Console.WriteLine($"SHA256SUMS written: {checksumsPath}");
    return 0;
}

static int VerifyCandidate(string[] args)
{
    var options = ParseOptions(
        args,
        "--version",
        "--tag",
        "--commit",
        "--package-id",
        "--package",
        "--manifest",
        "--checksums");

    var packagePath = Path.GetFullPath(options["--package"]);
    var manifestPath = Path.GetFullPath(options["--manifest"]);
    var checksumsPath = Path.GetFullPath(options["--checksums"]);

    if (!File.Exists(packagePath))
    {
        throw new FileNotFoundException("Release package was not found.", packagePath);
    }

    if (!File.Exists(manifestPath))
    {
        throw new FileNotFoundException("Release manifest was not found.", manifestPath);
    }

    if (!File.Exists(checksumsPath))
    {
        throw new FileNotFoundException("SHA256SUMS was not found.", checksumsPath);
    }

    var manifest = JsonSerializer.Deserialize<ReleaseManifest>(
            File.ReadAllText(manifestPath),
            ReleaseManifestJsonContext.Default.ReleaseManifest)
        ?? throw new InvalidOperationException("Release manifest could not be parsed.");

    AssertEqual(options["--version"], manifest.Version, "manifest version");
    AssertEqual(options["--tag"], manifest.Tag, "manifest tag");
    AssertEqual(options["--commit"], manifest.Commit, "manifest commit");
    AssertEqual(options["--package-id"], manifest.PackageId, "manifest packageId");
    AssertEqual(Path.GetFileName(packagePath), manifest.PackageFileName, "manifest packageFileName");

    var packageHash = ComputeSha256(packagePath);
    AssertEqual(packageHash, manifest.PackageSha256, "manifest packageSha256");

    var checksums = ParseChecksums(checksumsPath);
    AssertChecksum(checksums, packagePath, packageHash);
    AssertChecksum(checksums, manifestPath, ComputeSha256(manifestPath));

    Console.WriteLine($"Release candidate verified: {Path.GetFileName(packagePath)}");
    Console.WriteLine($"Version: {manifest.Version}");
    Console.WriteLine($"Commit: {manifest.Commit}");
    return 0;
}

static Dictionary<string, string> ParseOptions(string[] args, params string[] required)
{
    var values = new Dictionary<string, string>(StringComparer.Ordinal);

    for (var index = 0; index < args.Length; index++)
    {
        var option = args[index];
        if (!option.StartsWith("--", StringComparison.Ordinal) || index + 1 >= args.Length)
        {
            throw new ArgumentException($"Invalid argument near '{option}'.");
        }

        values[option] = args[++index];
    }

    foreach (var option in required)
    {
        if (!values.TryGetValue(option, out var value) || string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"Required option missing or empty: {option}");
        }
    }

    return values;
}

static Dictionary<string, string> ParseChecksums(string checksumsPath)
{
    var checksums = new Dictionary<string, string>(StringComparer.Ordinal);

    foreach (var rawLine in File.ReadLines(checksumsPath))
    {
        var line = rawLine.TrimEnd();
        if (string.IsNullOrWhiteSpace(line))
        {
            continue;
        }

        var separator = line.IndexOf("  ", StringComparison.Ordinal);
        if (separator <= 0 || separator + 2 >= line.Length)
        {
            throw new InvalidOperationException($"Invalid checksum line: {line}");
        }

        var hash = line[..separator];
        var fileName = line[(separator + 2)..];
        checksums[fileName] = hash;
    }

    return checksums;
}

static void AssertChecksum(
    IReadOnlyDictionary<string, string> checksums,
    string path,
    string expectedHash)
{
    var fileName = Path.GetFileName(path);
    if (!checksums.TryGetValue(fileName, out var actualHash))
    {
        throw new InvalidOperationException($"Checksum entry missing for '{fileName}'.");
    }

    AssertEqual(expectedHash, actualHash, $"checksum for {fileName}");
}

static string ComputeSha256(string path)
{
    using var stream = File.OpenRead(path);
    return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
}

static void AssertEqual(string expected, string actual, string field)
{
    if (!string.Equals(expected, actual, StringComparison.Ordinal))
    {
        throw new InvalidOperationException($"{field}: expected '{expected}', got '{actual}'.");
    }
}

static int UsageError()
{
    PrintUsage();
    return 1;
}

static void PrintUsage()
{
    Console.Error.WriteLine(
        "Usage: dotnet run --file scripts/release-candidate.cs -- manifest "
        + "--version <version> --tag <tag> --commit <sha> --package-id <id> "
        + "--package <nupkg> --output <manifest> --checksums-output <SHA256SUMS>");
    Console.Error.WriteLine(
        "   or: dotnet run --file scripts/release-candidate.cs -- verify "
        + "--version <version> --tag <tag> --commit <sha> --package-id <id> "
        + "--package <nupkg> --manifest <manifest> --checksums <SHA256SUMS>");
}

public sealed record ReleaseManifest(
    string Version,
    string Tag,
    string Commit,
    string PackageId,
    string PackageFileName,
    string PackageSha256);

[JsonSourceGenerationOptions(
    WriteIndented = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
[JsonSerializable(typeof(ReleaseManifest))]
internal sealed partial class ReleaseManifestJsonContext : JsonSerializerContext;
