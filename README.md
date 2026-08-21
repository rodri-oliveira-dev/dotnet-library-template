# .NET Library Template

Template de referência para criação de bibliotecas .NET com uma baseline técnica consistente, simples de evoluir e adequada para projetos reutilizáveis.

O objetivo deste repositório é reduzir o trabalho repetitivo de configuração de novas bibliotecas, concentrando em um único lugar as decisões de estrutura, build, testes, automação, empacotamento e governança que serão implementadas ao longo do roadmap.

## Estado atual

A primeira etapa do template fornece uma solução mínima em .NET 10 com:

- um projeto de biblioteca em `src/Template.Library`;
- um projeto de testes em `tests/Template.Library.Tests`;
- solução no formato `.slnx`;
- testes com xUnit;
- validação automática de restore, build e testes no GitHub Actions.

As demais capacidades, como Central Package Management, empacotamento NuGet, coverage, release, segurança e parametrização via `dotnet new`, serão adicionadas nas próximas etapas do roadmap.

## Estrutura

```text
.
├── .github/
│   └── workflows/
│       └── validation.yml
├── src/
│   └── Template.Library/
│       ├── Class1.cs
│       └── Template.Library.csproj
├── tests/
│   └── Template.Library.Tests/
│       ├── Class1Tests.cs
│       └── Template.Library.Tests.csproj
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

## Executando localmente

A partir da raiz do repositório:

### Restaurar dependências

```bash
dotnet restore Template.Library.slnx
```

### Compilar

```bash
dotnet build Template.Library.slnx --configuration Release --no-restore
```

### Executar os testes

```bash
dotnet test Template.Library.slnx --configuration Release --no-build
```

## Validação automática

O workflow `.github/workflows/validation.yml` executa automaticamente em pull requests e pushes para a branch `main`.

Ele valida a mesma sequência esperada para desenvolvimento local:

1. restauração das dependências;
2. compilação em `Release`;
3. execução dos testes.

Essa validação inicial existe para garantir que a baseline do template permaneça funcional enquanto as demais capacidades são adicionadas.

## Convenção de nomes

`Template.Library` é um nome neutro e temporário utilizado como base para o template. Em uma etapa posterior, ele será utilizado como identificador substituível pelo template engine do .NET, permitindo gerar novas bibliotecas com nomes próprios sem substituições manuais.

## Roadmap

O desenvolvimento do template está organizado nas issues do repositório. A versão 1.0 deverá incluir, entre outros itens:

- padronização de `.editorconfig`, `.gitattributes` e `.gitignore`;
- `Directory.Build.props`;
- Central Package Management;
- ferramentas locais .NET;
- empacotamento NuGet, símbolos e Source Link;
- documentação e governança;
- Dependabot;
- CI completa com coverage e pack;
- CodeQL e Dependency Review;
- workflow de release;
- parametrização via `dotnet new`;
- validação end-to-end do projeto gerado;
- configuração do repositório como GitHub Template.

A issue [#20](https://github.com/rodri-oliveira-dev/dotnet-library-template/issues/20) centraliza a ordem e a definição de pronto dessas entregas.

## Princípio do projeto

O template deve permanecer genérico. Dependências ou decisões específicas de domínio, banco de dados, framework web ou infraestrutura não devem fazer parte da baseline sem um caso de uso claro e reutilizável.
