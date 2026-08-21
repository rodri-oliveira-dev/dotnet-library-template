# .NET Library Template

Template opinativo e reutilizável para iniciar bibliotecas .NET 10 com uma baseline consistente de build, testes, dependências, empacotamento, CI, segurança e governança.

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
- manifesto local de ferramentas .NET;
- `.nupkg`, `.snupkg`, documentação XML e Source Link;
- validação do pacote em um consumidor temporário;
- licença MIT, contribuição, Code of Conduct e changelog;
- GitHub Actions para CI, análise CodeQL e validação end-to-end do custom template;
- artefatos de cobertura Cobertura e pacotes NuGet publicados pelo CI para diagnóstico.

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
- configure os secrets exigidos pelos workflows que você decidir usar;
- configure branch protection ou rulesets para `main`;
- revise as permissões padrão do GitHub Actions;
- configure environments quando houver deploy/publicação protegida;
- confirme a disponibilidade do code scanning e revise os recursos de segurança apropriados, como Dependabot alerts, secret scanning e push protection quando disponíveis.

**Secrets, environments, rulesets, branch protection, permissões administrativas do Actions e demais settings do repositório não são copiados por um GitHub Template Repository.**

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

## Análise de segurança com CodeQL

`.github/workflows/codeql.yml` executa análise CodeQL para C# em pull requests para `main`, pushes em `main` e uma agenda semanal. A baseline usa CodeQL Action v4 com `build-mode: manual`, restaurando dependências em `--locked-mode` e compilando em Release para que a análise observe o mesmo contrato de build reproduzível do projeto.

O workflow mantém permissões mínimas (`contents: read` e `security-events: write`), não usa secrets customizados e permanece separado do CI principal para não duplicar testes, cobertura e empacotamento.

## Estrutura resumida

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
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

A maior parte da baseline é copiada: código, testes, lock files, build policies, dependências centralizadas, governança, workflows de CI e CodeQL e tooling de pacote.

Conteúdo usado apenas para manter o template é excluído da saída:

- `.template.config/**`;
- `.github/workflows/template-validation.yml`;
- `docs/template-development.md`;
- este README de manutenção.

`docs/library-readme.md` é renomeado para `README.md` durante a geração. Assim, uma biblioteca criada por `dotnet new` recebe documentação orientada ao projeto gerado, e não instruções de manutenção do template-base.

A cópia feita pelo botão **Use this template** é diferente: como o GitHub não executa `.template.config/template.json`, ela copia os arquivos versionados sem essas transformações.

## Validação automática

Três workflows possuem responsabilidades diferentes:

- `.github/workflows/ci.yml` é o CI principal: tooling, locked restore, políticas de build, CPM, format, build, testes, cobertura Cobertura, packaging, Source Link, consumo do pacote, governança e limpeza da árvore. O workflow também publica os artefatos `coverage` e `nuget-packages` e cancela execuções antigas do mesmo ref;
- `.github/workflows/codeql.yml` faz análise estática de segurança do código C# com build manual reproduzível e envia os resultados para code scanning;
- `.github/workflows/template-validation.yml` instala o checkout como custom template, gera `Validation.SampleLibrary` e prova que a saída possui paths corretos, lock files, workflows esperados, build/test/pack funcionais, PackageId parametrizado e ausência de resíduos de `Template.Library` ou projetos usados como referência.

Separar os workflows torna regressões de CI, segurança e template engine distinguíveis no GitHub Actions.

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
