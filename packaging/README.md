# Rodrigo Oliveira .NET Library Template

Opinionated `dotnet new` template for creating .NET 10 class libraries with a ready-to-use engineering baseline.

## Requirements

- .NET 10 SDK

## Install

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
```

## Create a Library

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
cd MyCompany.MyLibrary
```

The `rodri-lib` short name creates a new library project and replaces the neutral `Template.Library` identity in generated paths and files.

## Validate the Generated Project

```bash
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

## Included Baseline

- .NET 10 class library and test projects
- Central Package Management and reproducible restore
- nullable reference types, analyzers, and warnings as errors
- xUnit v3, AwesomeAssertions, NSubstitute, and Coverlet
- NuGet package metadata, symbols, Source Link, and package validation
- GitHub Actions for CI, security checks, quality analysis, versioning, and release automation

## Update Installed Templates

```bash
dotnet new update
```

## Uninstall

```bash
dotnet new uninstall RodriOliveira.DotNet.Library.Template
```

## Documentation

Full documentation is available in the GitHub repository:

https://github.com/rodri-oliveira-dev/dotnet-library-template
