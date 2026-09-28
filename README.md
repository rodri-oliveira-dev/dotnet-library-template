# .NET Library Template

[English](README.en.md) | **Português**

[![Build & Tests](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml)
[![software_quality_security_issues](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=software_quality_security_issues)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=coverage)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Template opinativo e reutilizável para iniciar bibliotecas .NET 10 com uma baseline consistente de build, testes, dependências, empacotamento, CI, segurança, qualidade, versionamento, release e governança.

O template fornece uma **fundação técnica previsível**, não uma arquitetura de domínio pronta. A identidade neutra `Template.Library` é substituída pelo nome informado na geração, enquanto o pacote público que instala o template é `RodriOliveira.DotNet.Library.Template`.

## Escolha como usar o template

| Fluxo | Quando usar | Recomendação |
| --- | --- | --- |
| **NuGet + `dotnet new`** | Criar uma biblioteca pela CLI | **Padrão recomendado para a maioria dos consumidores** |
| **GitHub Template Repository** | Criar primeiro o repositório no GitHub e inicializá-lo por Actions | Use quando o repositório e suas regras administrativas precisam existir antes da geração |
| **Clone + instalação local** | Evoluir, testar ou contribuir com o próprio template | Fluxo de manutenção; não é o caminho normal de consumo |

Os fluxos via CLI e GitHub Template usam o template engine oficial do .NET e devem produzir a mesma identidade para o mesmo nome de entrada.

## Quick Start

Pré-requisitos: **.NET SDK 10** e Git.

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
dotnet new list rodri-lib

dotnet new rodri-lib -n MyCompany.MyLibrary
cd MyCompany.MyLibrary

dotnet tool restore
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

`preferNameDirectory` cria o diretório `MyCompany.MyLibrary/`, e `sourceName = Template.Library` substitui a identidade neutra nos projetos, namespaces, solution, referências e `PackageId` gerados.

Para controlar o diretório explicitamente:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary -o ./MyCompany.MyLibrary
```

## Baseline técnica

A saída gerada inclui, entre outras garantias:

- **Build:** .NET 10, solução `.slnx`, nullable, implicit usings, warnings como erros, analyzers do SDK/segurança, code style no build e build determinístico.
- **SDK e dependências:** `global.json`, Central Package Management, `packages.lock.json`, restore com `--locked-mode` e NuGet Audit com falha para vulnerabilidades High/Critical.
- **Testes e qualidade:** xUnit v3 sobre Microsoft Testing Platform, AwesomeAssertions, NSubstitute, Coverlet MTP, `dotnet format`, validação de consumo do pacote e SonarQube Cloud opcional.
- **Empacotamento:** `.nupkg` + `.snupkg`, documentação XML, README no pacote, PDB portátil, Source Link e Package Validation nativo do SDK.
- **CI e segurança:** CodeQL, Dependency Review, Dependabot, permissões mínimas nos workflows, actions pinadas por SHA e checkout sem persistência de credenciais.
- **Versionamento e release:** Semantic Versioning, versão base centralizada, release manual validada antes de publicar, release candidate com manifesto/checksums e NuGet.org Trusted Publishing via GitHub OIDC.
- **Governança:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` e `CHANGELOG.md`.

As automações exclusivas de validação do template permanecem no repositório-fonte e não fazem parte da saída gerada.

Detalhes de release, supply chain, OIDC, package validation e validações E2E ficam na [referência avançada](docs/advanced-reference.pt-BR.md).

## Instalar, atualizar e remover

Instalação/atualização pelo registry público principal:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template
```

Para reproduzir uma versão específica entre máquinas ou builds:

```bash
dotnet new install RodriOliveira.DotNet.Library.Template@1.2.0
```

Para remover:

```bash
dotnet new uninstall RodriOliveira.DotNet.Library.Template
```

Releases oficiais também espelham o template no GitHub Packages; configuração de fonte autenticada e detalhes de publicação estão na [seção GitHub Packages da referência avançada](docs/advanced-reference.pt-BR.md#github-packages).

## GitHub Template Repository

Use este fluxo quando você quer criar o repositório no GitHub antes de gerar a biblioteca:

```text
Use this template
→ Create a new repository
→ configurar INITIALIZE_REPOSITORY_TOKEN
→ Actions
→ Initialize repository
→ Run workflow
→ project_name = MyCompany.MyLibrary
```

O GitHub não executa `.template.config/template.json` durante **Use this template**. O workflow `Initialize repository` executa depois o `dotnet new rodri-lib`, valida a saída e abre um pull request de inicialização, preservando rulesets/branch protection.

O token temporário precisa de **Contents: Read and write**, **Pull requests: Read and write** e **Workflows: Read and write** no repositório de destino. Criação do token, troubleshooting e checklist pós-inicialização estão em [GitHub Template Repository — referência avançada](docs/advanced-reference.pt-BR.md).

## Clone + instalação local

Use apenas para manutenção, testes locais ou contribuição:

```bash
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
dotnet new list rodri-lib
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Ao terminar:

```bash
dotnet new uninstall .
```

A rotina completa de evolução e validação do template está em [docs/template-development.md](docs/template-development.md).

## Identidades de pacote e projeto

- **`RodriOliveira.DotNet.Library.Template`** é o NuGet Template Package público instalado por `dotnet new install`.
- **`Template.Library`** é somente a identidade neutra do repositório-fonte e do pacote placeholder usado em validações; ele não é o pacote público do template.
- O nome informado em `-n` ou `project_name` se torna a identidade canônica da biblioteca gerada, inclusive o `PackageId`, sem prefixo automático de proprietário.

Veja o [contrato de identidade do projeto](docs/project-identity.pt-BR.md).

## Mapa de documentação

- [Referência avançada](docs/advanced-reference.pt-BR.md) — GitHub Template, release/publicação, Trusted Publishing/OIDC, supply chain, package validation, versionamento e validações operacionais.
- [Template development](docs/template-development.md) — manutenção interna, arquitetura do NuGet Template Package, validações E2E e regras de evolução.
- [Administração do repositório](docs/repository-administration.md) — baseline recomendada de settings, rulesets e segurança do GitHub.
- [Contrato de identidade](docs/project-identity.pt-BR.md) — regras de nomeação e paridade CLI/GitHub Template.
- [Manutenção de dependências](docs/dependency-maintenance.md) — SDK, NuGet e automações de atualização.
- [SonarQube Cloud](docs/sonarqube-cloud.pt-BR.md) — configuração, Quality Gate, cobertura, forks e troubleshooting.
- [README da biblioteca gerada](docs/library-readme.md) — documentação que vira `README.md` após a geração.
- [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md) e [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Contribuição

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um pull request.

## Licença

Distribuído sob a [MIT License](LICENSE).
