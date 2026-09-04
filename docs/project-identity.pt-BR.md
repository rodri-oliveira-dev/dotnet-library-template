# Contrato de identidade do projeto gerado

Este documento define o contrato de nomenclatura usado pelo `.NET Library Template` quando uma nova biblioteca é gerada por `dotnet new` ou pelo inicializador do GitHub Template Repository.

É uma documentação exclusiva de manutenção e não deve ser copiada para as bibliotecas geradas.

## Regra de identidade canônica

O valor informado como nome do template é a **identidade canônica do projeto**.

Na geração por CLI, esse valor vem de:

```bash
dotnet new rodri-lib -n <nome>
```

Na inicialização por GitHub Template Repository, o valor equivalente vem de:

```text
project_name = <nome>
```

O template deve usar esse valor de forma consistente para a solução gerada, paths dos projetos, nome do projeto, namespace padrão, identidade do assembly, referências entre projetos, testes, metadados do pacote e `PackageId` do NuGet em todos os pontos em que `Template.Library` representa a identidade de origem.

O template **não** adiciona automaticamente `RodriOliveira.`, nome de empresa, proprietário do repositório ou qualquer outro prefixo de namespace/pacote.

Quando um prefixo for desejado, ele deve ser informado explicitamente como parte do nome.

## Exemplos

Informando:

```text
ReliableWebhooks
```

as identidades esperadas incluem:

```text
Solução:           ReliableWebhooks.slnx
Projeto principal: src/ReliableWebhooks/ReliableWebhooks.csproj
Projeto de testes: tests/ReliableWebhooks.Tests/ReliableWebhooks.Tests.csproj
Namespace padrão:  ReliableWebhooks
Assembly name:     ReliableWebhooks
NuGet PackageId:   ReliableWebhooks
```

O template **não** deve transformar silenciosamente esse valor em:

```text
RodriOliveira.ReliableWebhooks
```

Se a identidade desejada for:

```text
RodriOliveira.ReliableWebhooks
```

então esse valor exato deve ser informado em `-n` ou `project_name`.

## Paridade entre CLI e GitHub Template

Os dois fluxos abaixo devem permanecer equivalentes para o mesmo nome de entrada:

```bash
dotnet new rodri-lib -n ReliableWebhooks
```

```text
Initialize repository
project_name = ReliableWebhooks
```

O inicializador do GitHub deve chamar o template engine canônico do .NET, sem reimplementar regras próprias de nomenclatura.

`.template.config/template.json` continua sendo a fonte de verdade por meio de:

```text
sourceName = Template.Library
```

e o initializer deve preservar a paridade com a geração direta por `dotnet new`.

## Nome do repositório versus identidade do projeto

O nome do repositório GitHub não sobrescreve nem adiciona prefixos implicitamente à identidade do projeto gerado.

Um repositório chamado `ReliableWebhooks` pode intencionalmente conter um pacote chamado `ReliableWebhooks`, enquanto outro projeto pode optar por uma identidade totalmente qualificada como `Company.Product.Library`.

Por isso, o valor de `-n` / `project_name` deve ser escolhido com base na identidade pública desejada para .NET e NuGet, e não com base em uma convenção presumida do proprietário do template.

## Requisitos de validação

Mudanças nas regras de nomenclatura, inicialização, empacotamento ou renomeação do template devem preservar este contrato e manter verdes os testes automatizados de geração.

A validação deve comprovar que:

- o nome informado substitui `Template.Library` nos pontos de identidade do projeto gerado;
- nenhum prefixo de proprietário/vendor é injetado implicitamente;
- paths de projeto e namespaces seguem o nome informado;
- o `PackageId` gerado segue o nome informado;
- geração via CLI e inicialização via GitHub Template produzem saídas equivalentes para o mesmo nome;
- `Template.Library` não vaza para o conteúdo final do produto, exceto onde for preservado intencionalmente como comparação/guard neutro.

Qualquer mudança futura que passe a derivar a identidade de pacote ou namespace de forma diferente do nome informado deve ser tratada como uma alteração de contrato do template, documentada e validada explicitamente.