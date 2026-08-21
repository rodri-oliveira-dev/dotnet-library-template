# .NET Library Template

[English](README.en.md) | **Português**

[![Build & Tests](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml)
[![software_quality_security_issues](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=software_quality_security_issues)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=coverage)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Template opinativo e reutilizável para iniciar bibliotecas .NET 10 com uma baseline consistente de build, testes, dependências, empacotamento, CI, segurança, qualidade, versionamento, release e governança.

O objetivo não é fornecer uma arquitetura de domínio pronta. O template fornece uma **fundação técnica previsível** para que uma nova biblioteca comece com práticas de engenharia já configuradas, sem carregar dependências específicas de um produto.

## Escolha como usar o template

Existem dois fluxos suportados:

| Fluxo | Quando usar | Renomeia `Template.Library` automaticamente? |
| --- | --- | --- |
| [`dotnet new`](#opção-recomendada--dotnet-new) | Quando você quer gerar uma nova biblioteca já com identidade própria | Sim |
| [GitHub Template Repository](#alternativa--github-template-repository) | Quando você quer copiar a estrutura completa do repositório e ajustar a identidade manualmente | Não |

Para a maioria dos novos projetos, prefira **`dotnet new`**.

## O que a baseline fornece

### Build e dependências

- .NET 10;
- solução no formato `.slnx`;
- nullable reference types e implicit usings;
- warnings tratados como erros;
- build determinístico;
- Central Package Management em `Directory.Packages.props`;
- `packages.lock.json` e restore com `--locked-mode`;
- NuGet Audit com falha para vulnerabilidades High/Critical.

### Testes e qualidade

- xUnit v3 sobre Microsoft Testing Platform;
- AwesomeAssertions;
- NSubstitute;
- cobertura com Coverlet MTP;
- `dotnet format` no CI;
- SonarQube Cloud opcional;
- validação do pacote em um consumidor temporário.

### Empacotamento e versionamento

- `.nupkg` e `.snupkg`;
- documentação XML;
- PDB portátil e Source Link;
- Semantic Versioning;
- versão base centralizada em `Directory.Build.props`;
- validação da versão do pacote e da metadata do assembly;
- release por tag Git;
- NuGet.org Trusted Publishing via GitHub OIDC;
- GitHub Release após publicação bem-sucedida do pacote real.

### Segurança e governança

- CodeQL para C#;
- Dependency Review;
- Dependabot;
- licença MIT;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- `CHANGELOG.md`;
- workflows com permissões mínimas explícitas.

O template é deliberadamente genérico. Ele não inclui ASP.NET Core, banco de dados, ORM, logging específico, Testcontainers de infraestrutura, BenchmarkDotNet ou outras dependências sem um caso de uso comum e comprovado.

## Pré-requisitos

- .NET SDK 10;
- Git.

Confirme o SDK instalado:

```bash
dotnet --version
```

## Opção recomendada — `dotnet new`

Clone este repositório e instale o template a partir da raiz:

```bash
dotnet new install .
dotnet new list rodri-lib
```

Gere uma biblioteca:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Como `preferNameDirectory` está habilitado, o comando cria `MyCompany.MyLibrary/` e substitui a identidade neutra `Template.Library` nos paths e conteúdos relevantes.

Valide a saída:

```bash
cd MyCompany.MyLibrary
dotnet tool restore
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet pack src/MyCompany.MyLibrary/MyCompany.MyLibrary.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
```

Sem override de release, o pacote usa a versão base `1.0.0`.

Quando terminar de testar a instalação local:

```bash
dotnet new uninstall .
```

Detalhes de evolução e validação do template estão em [docs/template-development.md](docs/template-development.md).

## Alternativa — GitHub Template Repository

Na página do repositório, use **Use this template** e escolha **Create a new repository**.

Esse fluxo faz uma cópia direta dos arquivos versionados. O GitHub **não executa** o template engine do .NET e, portanto, não substitui automaticamente `Template.Library` em nomes de solução, projetos, namespaces ou `PackageId`.

Use esse fluxo quando você realmente quiser preservar a estrutura integral do repositório e aceitar a etapa de personalização manual.

### Checklist pós-criação

Antes do primeiro release de uma biblioteca criada pelo GitHub Template:

- substitua `Template.Library` pela identidade real da biblioteca;
- personalize a descrição e os metadados do pacote;
- revise a versão base em `Directory.Build.props`;
- revise README, licença e metadados públicos;
- configure NuGet.org Trusted Publishing para `.github/workflows/release.yml`;
- configure a repository variable `NUGET_USER`;
- configure `SONAR_TOKEN` se quiser habilitar SonarQube Cloud;
- configure ruleset ou branch protection para `main`;
- revise as permissões padrão do GitHub Actions;
- habilite e valide os recursos de segurança apropriados do GitHub;
- configure environments ou proteções adicionais quando houver publicação/deploy protegido.

> Configurações administrativas não são copiadas por um GitHub Template Repository. Isso inclui secrets, variables, environments, rulesets, branch protection, Trusted Publishing policies e outras configurações do repositório.

A baseline administrativa recomendada está documentada em [docs/repository-administration.md](docs/repository-administration.md).

## Validar o repositório-template

A partir da raiz deste repositório:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
dotnet pack src/Template.Library/Template.Library.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version 1.0.0
```

Os workflows de manutenção também validam geração end-to-end, contrato de versionamento e integração opcional com SonarQube Cloud.

## Versionamento e release

A versão base de desenvolvimento é declarada uma única vez em `Directory.Build.props`:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Os projetos não devem duplicar `Version`, `VersionPrefix` ou `PackageVersion`.

Em releases publicados, a **tag Git é a fonte de verdade**:

```text
v1.0.0          -> Version 1.0.0
v1.2.3          -> Version 1.2.3
v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` valida a tag, usa `Version` como único override de release, executa build/test/pack e valida o pacote antes de qualquer publicação externa.

`workflow_dispatch` é sempre **dry-run**: exige uma versão explícita, mas não publica no NuGet.org nem cria GitHub Release.

### NuGet.org Trusted Publishing

Para publicar um pacote real:

1. crie uma Trusted Publishing policy no nuget.org apontando para `release.yml`;
2. configure a repository variable `NUGET_USER` com o profile name do nuget.org.

O template não usa `NUGET_API_KEY` de longa duração.

### Proteção do placeholder

O repositório-template usa `Template.Library` como identidade neutra. O workflow de release detecta essa identidade e impede sua publicação acidental no NuGet.org.

O próprio template ainda pode criar GitHub Releases versionadas, mas sem publicar nem anexar o pacote placeholder. Em projetos gerados por `dotnet new`, o `PackageId` é substituído pelo nome real da biblioteca e a publicação passa a ser permitida depois que Trusted Publishing estiver configurado.

## Segurança e qualidade

Os principais workflows têm responsabilidades separadas:

| Workflow | Responsabilidade |
| --- | --- |
| `ci.yml` | restore, políticas de build, formatação, testes, cobertura, pack e validação de consumo |
| `codeql.yml` | análise CodeQL para C# |
| `dependency-review.yml` | bloqueio de novas vulnerabilidades High/Critical em PRs |
| `sonar.yml` | análise opcional no SonarQube Cloud |
| `release.yml` | versionamento, validação, publicação NuGet e GitHub Release |
| `template-validation.yml` | validação end-to-end do `dotnet new` |
| `sonar-template-validation.yml` | validação do contrato Sonar na saída gerada |
| `versioning-validation.yml` | validação do contrato SemVer e metadata do pacote/assembly |

Separar esses fluxos torna falhas de build, segurança, análise externa, geração e release independentes e diagnosticáveis.

## SonarQube Cloud opcional

A análise do Sonar é opt-in. Configure o repository secret:

```text
SONAR_TOKEN
```

Sem esse secret, `sonar.yml` termina com sucesso sem iniciar o scanner.

Por padrão, o workflow deriva:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

Quando necessário, sobrescreva com Repository Variables:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

## Conteúdo gerado versus manutenção do template

A maior parte da baseline é copiada para projetos gerados: código, testes, build policies, lock files, dependências centralizadas, governança, CI, segurança, qualidade, release e tooling de pacote.

Conteúdo específico de manutenção do template é excluído, incluindo:

- `.template.config/**`;
- workflows de validação exclusivos do template;
- `docs/template-development.md`;
- `docs/repository-administration.md`;
- `README.md` e `README.en.md` deste repositório.

`docs/library-readme.md` é renomeado para `README.md` durante a geração. Assim, a biblioteca gerada recebe documentação orientada ao projeto final, não ao repositório-template.

## Estrutura principal

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
├── .template.config/
│   └── template.json
├── docs/
│   ├── library-readme.md
│   ├── repository-administration.md
│   └── template-development.md
├── scripts/
│   └── verify-package.cs
├── src/
│   └── Template.Library/
├── tests/
│   └── Template.Library.Tests/
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── Directory.Build.props
├── Directory.Packages.props
├── LICENSE
├── README.md
├── README.en.md
├── Template.Library.slnx
└── global.json
```

## Documentação

- [README in English](README.en.md): versão em inglês desta visão geral;
- [Template development](docs/template-development.md): regras para manter e evoluir o custom template;
- [Repository administration](docs/repository-administration.md): baseline de settings administrativos no GitHub;
- [Generated library README](docs/library-readme.md): README usado em projetos criados por `dotnet new`;
- [CONTRIBUTING.md](CONTRIBUTING.md): processo de contribuição e breaking changes;
- [CHANGELOG.md](CHANGELOG.md): histórico de mudanças relevantes;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): padrões de participação.

## Convenção `Template.Library`

`Template.Library` é uma identidade neutra e intencional. Em `.template.config/template.json`, ela é o `sourceName` substituído pelo valor informado em `-n`/`--name`.

Não substitua essa identidade no repositório-base por um produto ou domínio real. Mudanças nas regras de geração devem preservar a neutralidade do template e ser cobertas pelas validações end-to-end.

## Contribuição

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um pull request.

## Licença

Distribuído sob a licença [MIT](LICENSE).
