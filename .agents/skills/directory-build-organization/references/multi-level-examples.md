# Multi-level Directory.Build Examples

Use multi-level `Directory.Build.props` only when subtrees genuinely need distinct policy. Inner files must explicitly import the parent because MSBuild automatically stops at the first matching file it finds while walking upward.

## Root

```xml
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

## Child props importing parent

```xml
<Project>
  <Import Project="$([MSBuild]::GetPathOfFileAbove('Directory.Build.props', '$(MSBuildThisFileDirectory)../'))"
          Condition="Exists('$([MSBuild]::GetPathOfFileAbove('Directory.Build.props', '$(MSBuildThisFileDirectory)../'))')" />

  <PropertyGroup>
    <IsPackable>true</IsPackable>
  </PropertyGroup>
</Project>
```

## Centralizing duplicated package versions

With Central Package Management:

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Example.Package" Version="1.2.3" />
  </ItemGroup>
</Project>
```

```xml
<!-- project file -->
<ItemGroup>
  <PackageReference Include="Example.Package" />
</ItemGroup>
```

In this template, preserve the existing CPM structure and only reorganize build files when the task demonstrates a concrete benefit.
