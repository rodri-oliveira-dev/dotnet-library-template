# .NET Library Template

Template de referência para criação de bibliotecas .NET com uma baseline técnica consistente, simples de evoluir e adequada para projetos reutilizáveis.

O objetivo deste repositório é reduzir o trabalho repetitivo de configuração de novas bibliotecas, concentrando em um único lugar as decisões de estrutura, build, testes, dependências, automação, empacotamento e governança.

## Estado atual

A baseline atual fornece:

- biblioteca e testes em .NET 10;
- solução no formato `.slnx`;
- políticas compartilhadas em `Directory.Build.props`;
- Central Package Management em `Directory.Packages.props`;
- restore reproduzível com `packages.lock.json`;
- testes com xUnit v3 usando Microsoft Testing Platform;
- assertions com AwesomeAssertions e substitutes com NSubstitute;
- cobertura com Coverlet MTP;
- manifesto local de ferramentas .NET;
- empacotamento NuGet com `.nupkg` e `.snupkg`;
- documentação XML e Source Link integrado pelo SDK do .NET;
- validação automática no GitHub Actions.

As capacidades restantes do roadmap, como documentação de governança, release e evolução do template via `dotnet new`, são implementadas em etapas independentes.

## Estrutura

```text
.
├── .config/
│   └── dotnet-tools.json
├── .github/
│   └── workflows/
│       └── validation.yml
├── scripts/
│   └── verify-package.cs
├── src/
│   └── Template.Library/
├── tests/
│   └── Template.Library.Tests/
├── Directory.Build.props
├── Directory.Packages.props
├── global.json
├── Template.Library.slnx
└── README.md
```

## Pré-requisitos

- .NET SDK 10
- Git

Confirme a versão instalada com:

```bash
dotnet --version
```

## Ferramentas locais .NET

O repositório mantém um manifesto em `.config/dotnet-tools.json` para que ferramentas de linha de comando, quando necessárias, sejam versionadas junto com o projeto em vez de depender de instalações globais na máquina do desenvolvedor ou no agente de CI.

Restaure as ferramentas locais com:

```bash
dotnet tool restore
```

Consulte as ferramentas disponíveis com:

```bash
dotnet tool list --local
```

Quando uma ferramenta estiver registrada no manifesto, ela poderá ser executada com:

```bash
dotnet tool run <comando>
```

O manifesto começa **intencionalmente vazio**. A cobertura atual é fornecida por `coverlet.MTP` como dependência do projeto de testes, portanto adicionar `dotnet-coverage` neste momento duplicaria uma capacidade que já possui implementação e consumidor claros. Uma nova ferramenta só deve entrar no manifesto quando houver um workflow, script ou comando documentado que efetivamente a utilize.

Nenhum fluxo principal do template deve exigir uma ferramenta .NET instalada globalmente.

## Executando localmente

A partir da raiz do repositório:

### Restaurar ferramentas locais

```bash
dotnet tool restore
```

### Restaurar dependências

```bash
dotnet restore Template.Library.slnx --locked-mode
```

### Compilar

```bash
dotnet build Template.Library.slnx --configuration Release --no-restore
```

### Executar os testes

```bash
dotnet test Template.Library.slnx --configuration Release --no-build
```

### Executar cobertura

```bash
dotnet test Template.Library.slnx --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

### Gerar os pacotes NuGet

```bash
dotnet pack src/Template.Library/Template.Library.csproj \
  --configuration Release \
  --no-build \
  --output artifacts/packages
```

O comando gera:

- `Template.Library.<versão>.nupkg`, contendo a biblioteca e a documentação XML;
- `Template.Library.<versão>.snupkg`, contendo o PDB portátil usado para depuração.

O projeto usa `Template.Library` como `PackageId` neutro e substituível. A descrição do pacote está marcada como `TODO` para que o projeto gerado a personalize antes da publicação.

### Validar o pacote gerado

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

A validação verifica o `.nuspec`, documentação XML, pacote de símbolos, metadados de repositório e a entrada Source Link do PDB portátil.

## Source Link

No .NET 10, Source Link para GitHub já faz parte do SDK e é habilitado automaticamente para projetos SDK-style. Por isso o template não adiciona `Microsoft.SourceLink.GitHub` como dependência.

`PublishRepositoryUrl` faz com que o repositório e o commit detectados durante o build sejam publicados no `.nuspec`. O template **não possui `RepositoryUrl` hard-coded**, de modo que uma biblioteca gerada pode publicar os metadados do seu próprio repositório.

A baseline usa PDB portátil e `.snupkg`, formato aceito pelo servidor de símbolos do NuGet.org.

## Validação automática

O workflow `.github/workflows/validation.yml` executa automaticamente em pull requests e pushes para a branch `main`.

Entre as verificações atuais estão:

1. restauração e listagem das ferramentas locais;
2. restore de dependências em `--locked-mode`;
3. políticas compartilhadas de build e Central Package Management;
4. formatação;
5. build em `Release`;
6. testes via Microsoft Testing Platform;
7. cobertura com Coverlet MTP;
8. geração de `.nupkg` e `.snupkg`;
9. inspeção de metadados, XML docs e Source Link;
10. instalação e build do pacote em um projeto consumidor temporário;
11. line endings e limpeza da árvore de trabalho.

## Convenção de nomes

`Template.Library` é um nome neutro e temporário utilizado como base para o template. Em uma etapa posterior, ele será utilizado como identificador substituível pelo template engine do .NET, permitindo gerar novas bibliotecas com nomes próprios sem substituições manuais.

## Roadmap

O desenvolvimento do template está organizado nas issues do repositório. A issue [#20](https://github.com/rodri-oliveira-dev/dotnet-library-template/issues/20) centraliza a ordem e a definição de pronto da versão 1.0.

## Princípio do projeto

O template deve permanecer genérico. Dependências ou decisões específicas de domínio, banco de dados, framework web ou infraestrutura não devem fazer parte da baseline sem um caso de uso claro e reutilizável.
