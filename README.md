# .NET Library Template

[![Build & Tests](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira-dev/dotnet-library-template/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rodri-oliveira-dev_dotnet-library-template&metric=coverage)](https://sonarcloud.io/summary/new_code?id=rodri-oliveira-dev_dotnet-library-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Template opinativo e reutilizável para iniciar bibliotecas .NET 10 com uma baseline consistente de build, testes, dependências, empacotamento, CI, segurança, qualidade, release e governança.

O repositório pode ser usado de duas formas:

1. como **GitHub Template Repository**, copiando a estrutura versionada para um novo repositório;
2. como **custom template do .NET**, usando `dotnet new rodri-lib` para substituir automaticamente a identidade neutra `Template.Library` pelo nome da nova biblioteca.

Para manutenção do próprio template, consulte [docs/template-development.md](docs/template-development.md).

## O que a baseline fornece

- biblioteca e testes em .NET 10;
- solução no formato `.slnx`;
- nullable reference types, implicit usings, warnings como errors e build determinístico;
- Central Package Management em `Directory.Packages.props`;
- restore reproduzível com `packages.lock.json` e `--locked-mode`;
- NuGet Audit com falha para vulnerabilidades high/critical;
- xUnit v3 sobre Microsoft Testing Platform;
- AwesomeAssertions e NSubstitute;
- cobertura via Coverlet MTP;
- manifesto local de ferramentas .NET, incluindo SonarScanner for .NET;
- `.nupkg`, `.snupkg`, documentação XML e Source Link;
- validação do pacote em um consumidor temporário;
- licença MIT, contribuição, Code of Conduct e changelog;
- GitHub Actions para CI, CodeQL, Dependency Review, SonarQube Cloud opcional, release e validação end-to-end do custom template;
- artefatos de cobertura Cobertura e pacotes NuGet publicados pelo CI para diagnóstico;
- release por tag com versionamento validado, NuGet.org Trusted Publishing/OIDC e GitHub Release.

O template permanece deliberadamente genérico: não inclui ASP.NET Core, banco de dados, ORM, logging específico, Testcontainers de infraestrutura, BenchmarkDotNet ou outras dependências sem um caso de uso comum e comprovado.

## Pré-requisitos

- .NET SDK 10;
- Git.

Confirme o SDK instalado:

```bash
dotnet --version
```

## Opção 1 — GitHub Template Repository

O repositório está configurado como GitHub Template Repository. Na página do GitHub, use **Use this template** e escolha **Create a new repository**.

O GitHub faz uma cópia direta dos arquivos versionados. Ele **não executa** o template engine do .NET e, portanto, não substitui automaticamente `Template.Library` em nomes de solução, projetos, namespaces ou PackageId.

Se você quer preservar a estrutura exata e fazer a identidade manualmente, o fluxo do GitHub Template é adequado. Se quer que o nome seja substituído automaticamente, prefira o fluxo `dotnet new` abaixo.

### Checklist após criar um repositório pelo GitHub

Antes de publicar ou liberar a biblioteca:

- substitua a identidade `Template.Library` pelo nome real do projeto, caso tenha usado a cópia direta;
- personalize a descrição do pacote no `.csproj`;
- revise o README, licença e metadados públicos;
- configure uma política de NuGet.org Trusted Publishing para `.github/workflows/release.yml`;
- configure a repository variable `NUGET_USER` com o profile name do nuget.org;
- se quiser SonarQube Cloud, configure o repository secret `SONAR_TOKEN` e, quando necessário, as variables `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION` e `SONAR_HOST_URL`;
- configure branch protection ou rulesets para `main`;
- revise as permissões padrão do GitHub Actions;
- configure environments quando houver deploy/publicação protegida;
- confirme a disponibilidade do code scanning e revise os recursos de segurança apropriados, como Dependabot alerts, secret scanning e push protection quando disponíveis.

**Trusted Publishing policies, repository variables, secrets, environments, rulesets, branch protection, permissões administrativas do Actions e demais settings do repositório não são copiados por um GitHub Template Repository.**

## Opção 2 — `dotnet new`

Este é o fluxo recomendado quando você quer uma biblioteca já gerada com identidade própria.

Clone o repositório e, a partir da raiz, instale o template localmente:

```bash
dotnet new install .
dotnet new list rodri-lib
```

Gere a biblioteca:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Como `preferNameDirectory` está habilitado, o comando cria `MyCompany.MyLibrary/` e substitui `Template.Library` em paths e conteúdos relevantes.

Entre na saída e execute a baseline:

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

Quando terminar de testar o template localmente, remova a instalação:

```bash
dotnet new uninstall .
```

Detalhes de desenvolvimento, reinstalação e validação E2E estão em [docs/template-development.md](docs/template-development.md).

## Validar o repositório-base

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
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

## Empacotamento e Source Link

O projeto de produção é packable e gera:

- `Template.Library.<versão>.nupkg`;
- `Template.Library.<versão>.snupkg`;
- documentação XML para a API pública;
- PDB portátil com Source Link.

No .NET 10, Source Link para GitHub é fornecido pelo SDK para projetos SDK-style, portanto a baseline não adiciona `Microsoft.SourceLink.GitHub` como dependência explícita.

O `RepositoryUrl` não fica hard-coded no projeto: os metadados de repositório e commit são derivados do contexto de Git/build. Isso impede que uma biblioteca gerada publique por engano a URL do repositório-base.

## Análise de segurança

`.github/workflows/codeql.yml` executa análise CodeQL para C# em pull requests para `main`, pushes em `main` e uma agenda semanal. A baseline usa CodeQL Action v4 com `build-mode: manual`, restore em `--locked-mode` e build Release.

`.github/workflows/dependency-review.yml` analisa o delta de dependências dos pull requests para `main` e bloqueia vulnerabilidades novas High/Critical.

## Análise opcional com SonarQube Cloud

`.github/workflows/sonar.yml` executa SonarScanner for .NET em pull requests para `main` e pushes em `main`, mas somente quando o repository secret abaixo está disponível:

```text
SONAR_TOKEN
```

Se `SONAR_TOKEN` estiver ausente ou vazio, o workflow termina com sucesso e **não** inicia o scanner nem tenta enviar dados ao Sonar. Isso mantém o Sonar opt-in e também evita quebra de pull requests de forks que não recebem repository secrets.

O scanner está pinado como ferramenta local em `.config/dotnet-tools.json`, portanto `dotnet tool restore` prepara a mesma versão no CI e no projeto gerado.

Por padrão, o workflow deriva coordenadas compatíveis com projetos SonarQube Cloud importados do GitHub:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

Quando o projeto Sonar usa coordenadas diferentes, elas podem ser sobrescritas por Repository Variables:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

O fluxo usa locked restore, build Release não incremental e Coverlet MTP no formato OpenCover. O relatório `coverage.opencover*.xml` é enviado através de `sonar.cs.opencover.reportsPaths`, sem alterar o relatório Cobertura utilizado pelo CI principal.

Secrets e Repository Variables não são copiados para repositórios criados a partir deste template. O workflow é copiado, mas permanece inativo até que o novo repositório configure seu próprio `SONAR_TOKEN`.

## Release e publicação NuGet

`.github/workflows/release.yml` separa validação, publicação NuGet e criação do GitHub Release.

Publicação real acontece somente em tags no formato:

```text
vMAJOR.MINOR.PATCH
vMAJOR.MINOR.PATCH-prerelease
```

O workflow valida a tag, remove apenas o prefixo `v`, usa essa versão no build/pack e executa `verify-package.cs --expected-version` antes de qualquer publicação.

`workflow_dispatch` exige uma versão explícita, mas é **sempre dry-run**: executa build/test/pack sem autenticar no NuGet.org e sem criar GitHub Release.

A publicação no NuGet.org usa **Trusted Publishing** via GitHub OIDC e `NuGet/login@v1`. Não há `NUGET_API_KEY` de longa duração no template. Um repositório gerado precisa configurar:

1. uma Trusted Publishing policy no nuget.org apontando para `release.yml`;
2. a repository variable `NUGET_USER` com o profile name do nuget.org.

O job NuGet recebe apenas `contents: read` e `id-token: write`. O job que cria o GitHub Release recebe `contents: write` somente depois que a publicação NuGet termina com sucesso.

### Proteção contra publicação do placeholder

Antes de publicar, o workflow resolve o `PackageId` real do projeto. A identidade neutra do source template é montada em partes no script (`"Template" + "." + "Library"`) para que o template engine não a substitua ao gerar uma biblioteca.

Se o `PackageId` ainda corresponder a essa identidade placeholder, o output `safe-to-publish` fica `false` e os jobs de NuGet.org e GitHub Release são ignorados. Assim, este repositório — e também uma cópia direta criada pelo botão **Use this template** que ainda não tenha sido renomeada — pode validar restore/build/test/pack, mas não publicar o pacote placeholder.

Em uma biblioteca criada via `dotnet new`, o `PackageId` é substituído pelo nome real da biblioteca enquanto a identidade de bloqueio permanece neutra; portanto, depois de configurar Trusted Publishing, a publicação por tag fica habilitada sem carregar nome ou ID específico do repositório-base.

## Estrutura resumida

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       ├── dependency-review.yml
│       ├── release.yml
│       ├── sonar.yml
│       └── template-validation.yml
├── .template.config/
│   └── template.json
├── docs/
│   ├── library-readme.md
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
├── Template.Library.slnx
└── global.json
```

## O que entra no projeto gerado por `dotnet new`

A maior parte da baseline é copiada: código, testes, lock files, build policies, dependências centralizadas, governança, workflows de CI, CodeQL, Dependency Review, SonarQube Cloud opcional e release, além do tooling de pacote e do scanner local.

Conteúdo usado apenas para manter o template é excluído da saída:

- `.template.config/**`;
- `.github/workflows/template-validation.yml`;
- `docs/template-development.md`;
- este README de manutenção.

`docs/library-readme.md` é renomeado para `README.md` durante a geração. Assim, uma biblioteca criada por `dotnet new` recebe documentação orientada ao projeto gerado, e não instruções de manutenção do template-base.

A cópia feita pelo botão **Use this template** é diferente: como o GitHub não executa `.template.config/template.json`, ela copia os arquivos versionados sem essas transformações.

## Validação automática

Os workflows possuem responsabilidades separadas:

- `.github/workflows/ci.yml`: restore, build, testes, cobertura, pack e artefatos;
- `.github/workflows/codeql.yml`: análise estática CodeQL para C#;
- `.github/workflows/dependency-review.yml`: revisão do delta de dependências em pull requests;
- `.github/workflows/sonar.yml`: análise SonarQube Cloud opcional, ativada por `SONAR_TOKEN`;
- `.github/workflows/release.yml`: validação de versão, build/test/pack, Trusted Publishing e GitHub Release;
- `.github/workflows/template-validation.yml`: geração de `Validation.SampleLibrary` e validação E2E da saída do `dotnet new`.

Separar os workflows torna regressões de CI, segurança, qualidade externa, release e template engine distinguíveis no GitHub Actions.

## Convenção `Template.Library`

`Template.Library` é uma identidade neutra e intencional. Em `.template.config/template.json`, ela é o `sourceName` substituído pelo valor de `-n`/`--name`.

Não troque esse valor no repositório-base por um nome de domínio ou produto. Para alterar regras de geração, veja [docs/template-development.md](docs/template-development.md).

## Governança

- [CONTRIBUTING.md](CONTRIBUTING.md): fluxo de contribuição e breaking changes;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): padrões de participação;
- [CHANGELOG.md](CHANGELOG.md): mudanças relevantes a consumidores;
- [LICENSE](LICENSE): MIT.

## Roadmap

A issue [#20](https://github.com/rodri-oliveira-dev/dotnet-library-template/issues/20) centraliza o roadmap e a definição de pronto da versão 1.0.
