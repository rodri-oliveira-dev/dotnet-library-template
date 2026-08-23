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
| [GitHub Template Repository](#alternativa--github-template-repository) | Quando você quer criar primeiro um repositório no GitHub e inicializá-lo por Actions | Sim, depois do workflow `Initialize repository` |

Para a maioria dos novos projetos, prefira **`dotnet new`**.

## Quick Start

Fluxo recomendado para gerar uma biblioteca localmente:

```bash
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
dotnet new list rodri-lib

dotnet new rodri-lib -n MyCompany.MyLibrary
cd MyCompany.MyLibrary

dotnet restore --locked-mode
dotnet build -c Release
dotnet test -c Release
```

Esse caminho executa o template engine do .NET, cria o diretório `MyCompany.MyLibrary/` por causa de `preferNameDirectory` e substitui `Template.Library` nos paths e conteúdos relevantes.

## O que a baseline fornece

### Build e dependências

- .NET 10;
- solução no formato `.slnx`;
- nullable reference types e implicit usings;
- warnings tratados como erros;
- baseline de analyzers do SDK em `10-recommended`, analyzers de segurança em `10-all` e code style participando do build;
- build determinístico;
- SDK reproduzível por `global.json` com roll-forward sustentável dentro do .NET 10;
- Central Package Management em `Directory.Packages.props`;
- `packages.lock.json` e restore com `--locked-mode`;
- NuGet Audit com falha para vulnerabilidades High/Critical.

### Testes e qualidade

- xUnit v3 sobre Microsoft Testing Platform;
- AwesomeAssertions;
- NSubstitute;
- cobertura com Coverlet MTP;
- `dotnet format` no CI;
- regras de confiabilidade e performance de baixo ruído aplicadas ao código de produção sem bloquear testes por detalhes internos;
- SonarQube Cloud opcional;
- validação do pacote em um consumidor temporário.

### Empacotamento e versionamento

- `.nupkg` e `.snupkg`;
- documentação XML;
- README incluído no pacote NuGet;
- PDB portátil e Source Link;
- Package Validation nativo do SDK durante `dotnet pack`;
- Semantic Versioning;
- versão base centralizada em `Directory.Build.props`;
- validação da versão do pacote e da metadata do assembly;
- release manual pelo GitHub Actions ou por push de tag Git;
- criação da tag manual somente depois de build, testes, pack e validação bem-sucedidos;
- NuGet.org Trusted Publishing via GitHub OIDC com publicação opt-in por `NUGET_USER`;
- GitHub Release independente da habilitação do NuGet.

### Segurança e governança

- CodeQL para C#;
- Dependency Review;
- Dependabot;
- licença MIT;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- `SECURITY.md`;
- `CHANGELOG.md`;
- workflows com permissões mínimas explícitas, actions pinadas por SHA e checkouts somente-leitura sem persistência de credenciais.

O template é deliberadamente genérico. Ele não inclui ASP.NET Core, banco de dados, ORM, logging específico, Testcontainers de infraestrutura, BenchmarkDotNet, tuning de runtime, Server GC, ReadyToRun ou outras dependências sem um caso de uso comum e comprovado. Compatibilidade com trimming ou Native AOT deve ser habilitada por cada biblioteca somente quando fizer parte do contrato real do pacote.

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
git clone https://github.com/rodri-oliveira-dev/dotnet-library-template.git
cd dotnet-library-template

dotnet new install .
dotnet new list rodri-lib
```

Gere uma biblioteca:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary
```

Como `preferNameDirectory` está habilitado, o comando cria `MyCompany.MyLibrary/` e substitui a identidade neutra `Template.Library` nos paths e conteúdos relevantes.

Se você quiser controlar explicitamente o diretório de destino, use `-o`/`--output`:

```bash
dotnet new rodri-lib -n MyCompany.MyLibrary -o ./MyCompany.MyLibrary
```

O parâmetro `-o` é opcional; ele é útil quando você quer gerar a biblioteca em um caminho diferente do diretório preferido pelo nome.

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
cd ..
dotnet new uninstall .
```

Detalhes de evolução e validação do template estão em [docs/template-development.md](docs/template-development.md).

## Alternativa — GitHub Template Repository

Na página do repositório, use **Use this template** e escolha **Create a new repository**. Em seguida, inicialize a cópia pelo GitHub Actions:

```text
Use this template
→ Create a new repository
→ Actions
→ Initialize repository
→ Run workflow
→ project_name = MyCompany.MyLibrary
```

O GitHub **não executa** `.template.config/template.json` ao copiar o repositório. Ele faz somente a cópia inicial. O workflow **Initialize repository** executa depois o template engine real do .NET dentro da cópia, usando `dotnet new rodri-lib -n MyCompany.MyLibrary`, para aplicar `sourceName`, `exclude`, `rename` e `preferNameDirectory` a partir da configuração oficial do template.

Depois de uma inicialização bem-sucedida:

- `Template.Library` é substituído pela identidade informada;
- arquivos exclusivos de manutenção do template são removidos;
- `docs/library-readme.md` vira o `README.md` da biblioteca gerada;
- o próprio workflow `Initialize repository` e seu helper são removidos;
- o desenvolvimento continua usando os workflows normais da biblioteca gerada.

Execute esse workflow antes de iniciar o desenvolvimento normal no novo repositório. Ele deve rodar na branch padrão e falha se for executado no repositório-fonte `rodri-oliveira-dev/dotnet-library-template`.

### Pré-requisitos e falhas esperadas

- GitHub Actions precisa estar habilitado no novo repositório;
- configure o Repository Secret `INITIALIZE_REPOSITORY_TOKEN` antes de executar o workflow;
- esse token deve ser temporário e ter permissão mínima para o repositório de destino: `Contents: write` e `Workflows: write`;
- remova ou revogue `INITIALIZE_REPOSITORY_TOKEN` depois da inicialização bem-sucedida;
- rulesets ou branch protection da organização podem bloquear o push feito com `INITIALIZE_REPOSITORY_TOKEN`;
- se validação, build, testes ou empacotamento falharem, o workflow não deve commitar nem enviar uma inicialização parcial;
- se o push for bloqueado, ajuste as regras do repositório ou aplique um processo equivalente aprovado sem enfraquecer a segurança automaticamente.

### Como criar `INITIALIZE_REPOSITORY_TOKEN`

`INITIALIZE_REPOSITORY_TOKEN` é um **Repository Secret** cujo valor deve ser um **Fine-grained Personal Access Token (PAT)** temporário. Ele não é copiado quando um novo repositório é criado com **Use this template**, portanto precisa ser configurado no repositório de destino antes da primeira execução do workflow.

Crie o token na conta GitHub que possui acesso administrativo ao repositório de destino:

1. abra seu avatar no GitHub e acesse **Settings**;
2. abra **Developer settings** → **Personal access tokens** → **Fine-grained tokens**;
3. clique em **Generate new token**;
4. use um nome temporário, por exemplo `Initialize MyCompany.MyLibrary`;
5. defina uma expiração curta, preferencialmente de poucos dias;
6. em **Resource owner**, selecione o usuário ou organização que possui o novo repositório;
7. em **Repository access**, escolha **Only select repositories** e selecione somente o repositório que será inicializado;
8. em **Repository permissions**, configure:
   - **Contents** → **Read and write**;
   - **Workflows** → **Read and write**;
9. gere o token e copie o valor exibido. O GitHub pode não exibi-lo novamente.

Depois, no **repositório de destino**:

1. acesse **Settings** → **Secrets and variables** → **Actions**;
2. na aba **Secrets**, clique em **New repository secret**;
3. use exatamente o nome:

```text
INITIALIZE_REPOSITORY_TOKEN
```

4. em **Secret**, cole o Fine-grained PAT criado anteriormente;
5. salve o secret;
6. execute **Actions** → **Initialize repository** → **Run workflow**.

O token precisa de `Contents: write` porque o initializer cria e substitui os arquivos do repositório, e de `Workflows: write` porque a inicialização também remove/substitui arquivos em `.github/workflows`.

Após uma inicialização bem-sucedida, remova o Repository Secret `INITIALIZE_REPOSITORY_TOKEN` e revogue ou exclua o PAT em **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**. Não reutilize esse token como credencial permanente de CI e não o armazene em arquivos versionados.

### Possíveis erros durante a inicialização

#### `Configure repository secret INITIALIZE_REPOSITORY_TOKEN...`

```text
Configure repository secret INITIALIZE_REPOSITORY_TOKEN with Contents: write and Workflows: write before running this one-time initializer.
```

O workflow não recebeu o secret. Confirme que ele foi criado em **Settings** → **Secrets and variables** → **Actions** do **repositório gerado**, com o nome exato `INITIALIZE_REPOSITORY_TOKEN`. Secrets do repositório-template não são copiados para novos repositórios.

#### `error IMPORTS: Fix imports ordering`

```text
error IMPORTS: Fix imports ordering.
```

Esse erro pode ocorrer em cópias antigas do template porque a substituição de `Template.Library` pelo novo nome da biblioteca pode alterar a ordem lexicográfica dos `using`. A versão atual do initializer executa `dotnet format --no-restore` depois da geração e, em seguida, `dotnet format --verify-no-changes --no-restore`, normalizando a saída antes do gate de formatação.

Se o erro ocorrer em um repositório criado a partir de uma versão anterior, atualize `.github/workflows/initialize-repository.yml` com a implementação mais recente ou recrie a cópia a partir da versão atual do template. Quando o workflow em si foi alterado, prefira iniciar uma **nova execução** em vez de reutilizar o *re-run* de uma execução vinculada ao workflow antigo.

#### `fatal: could not read Username for 'https://github.com'`

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

Esse erro indica que o `git push` não conseguiu autenticar. A versão atual do initializer usa autenticação HTTP Basic com `x-access-token` e o valor de `INITIALIZE_REPOSITORY_TOKEN`.

Se ainda ocorrer:

- confirme que o PAT não expirou nem foi revogado;
- confirme que **Repository access** inclui exatamente o repositório de destino;
- confirme `Contents: Read and write` e `Workflows: Read and write`;
- confirme que o secret contém o PAT completo, sem espaços extras;
- se a cópia usa uma versão antiga do initializer, atualize o workflow antes de executar novamente.

#### Push rejeitado por ruleset ou branch protection

O PAT pode estar correto e ainda assim o GitHub rejeitar o push para a branch padrão. Nesse caso, revise os rulesets e as regras de branch protection do repositório/organização. Autorize temporariamente o ator/token para a inicialização ou utilize um processo equivalente aprovado. Não desabilite proteções permanentemente apenas para contornar o initializer.

#### Falha em format, build, testes, pack ou validação do pacote

O initializer valida a saída antes de fazer o push. Uma falha nesses passos interrompe a execução e evita enviar uma inicialização parcial. Corrija a causa indicada no primeiro passo que falhou e execute novamente o workflow. O commit de inicialização só deve ser enviado depois que todas as validações anteriores forem concluídas com sucesso.

### Checklist pós-inicialização

Antes do primeiro release de uma biblioteca criada pelo GitHub Template:

- personalize a descrição e os metadados do pacote;
- revise a versão base em `Directory.Build.props`;
- revise README, licença e metadados públicos;
- se quiser publicar no NuGet.org, configure Trusted Publishing para `.github/workflows/release.yml` e a Repository Variable `NUGET_USER`;
- [configure o SonarQube Cloud](#sonarqube-cloud-opcional) se quiser habilitar a análise;
- configure ruleset ou branch protection para `main`;
- revise as permissões padrão do GitHub Actions;
- habilite e valide os recursos de segurança apropriados do GitHub;
- configure environments ou proteções adicionais quando houver publicação/deploy protegido.

> Configurações administrativas não são copiadas por um GitHub Template Repository. Isso inclui secrets, variables, environments, rulesets, branch protection, Trusted Publishing policies e outras configurações do repositório.

A baseline administrativa recomendada está documentada em [docs/repository-administration.md](docs/repository-administration.md).

## Validar o repositório-template

A partir da raiz deste repositório:

```bash
dotnet --version
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

Os workflows de manutenção também validam geração end-to-end, contrato de versionamento, integração opcional com SonarQube Cloud e o fluxo de release/publicação.

## Versionamento e release

A versão base de desenvolvimento é declarada uma única vez em `Directory.Build.props`:

```xml
<VersionPrefix>1.0.0</VersionPrefix>
```

Os projetos não devem duplicar `Version`, `VersionPrefix` ou `PackageVersion`.

Em releases, a **tag Git é a fonte de verdade**:

```text
v1.0.0          -> Version 1.0.0
v1.2.3          -> Version 1.2.3
v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` usa `Version` como único override de release, executa restore/build/test/pack, valida o pacote, garante a tag e só então segue para publicação externa e GitHub Release.

### Release manual pelo GitHub Actions

O fluxo recomendado para uma release manual é:

1. abra a aba **Actions** do repositório;
2. selecione o workflow **Release**;
3. clique em **Run workflow**;
4. selecione a branch **main**;
5. informe **Release version**, por exemplo `v1.2.0` ou `v1.3.0-beta.1`;
6. execute o workflow.

O workflow rejeita releases manuais fora de `main` e falha antecipadamente se a tag informada já existir. Depois disso ele executa build, testes, pack e `verify-package`. **A tag só é criada depois que todas essas validações passam** e aponta exatamente para o `github.sha` validado naquela execução.

Depois da criação da tag, o mesmo workflow continua para NuGet quando habilitado e para o GitHub Release. A tag criada com o `GITHUB_TOKEN` não depende de uma segunda execução do workflow.

O fluxo legado por push de uma tag válida continua suportado:

```bash
git tag v1.2.0
git push origin v1.2.0
```

Nesse caso, o workflow verifica que a tag recebida resolve para o mesmo SHA que está sendo validado antes de publicar qualquer coisa.

### NuGet.org Trusted Publishing

A publicação no NuGet.org é explicitamente **opt-in**. `NUGET_USER` é uma **Repository Variable**, não um secret, e funciona como flag de habilitação da publicação.

Para configurá-la quando ainda não existir:

1. abra o repositório no GitHub;
2. acesse **Settings**;
3. abra **Secrets and variables** → **Actions**;
4. selecione a aba **Variables**;
5. clique em **New repository variable**;
6. em **Name**, informe `NUGET_USER`;
7. em **Value**, informe o profile name/username do nuget.org usado pela policy de Trusted Publishing;
8. salve a variável.

Além disso, no nuget.org crie uma **Trusted Publishing policy** para o repositório apontando para:

```text
.github/workflows/release.yml
```

O workflow centraliza a decisão em `nuget-publishing-enabled`. A publicação NuGet só é habilitada quando:

```text
release válida
AND PackageId não é o placeholder
AND NUGET_USER está configurado e não vazio
```

Se `NUGET_USER` estiver ausente, vazio ou contiver apenas espaços, o release **não falha**: `NuGet/login` não é iniciado, nenhuma credencial OIDC de publicação é solicitada e `dotnet nuget push` não é executado. A tag e o GitHub Release continuam sendo criados normalmente; para um pacote real, `.nupkg` e `.snupkg` são anexados ao GitHub Release mesmo sem publicação no NuGet.

Se `NUGET_USER` estiver configurado e a publicação NuGet for habilitada, o GitHub Release só é criado depois que a publicação no NuGet concluir com sucesso, evitando sinalizar uma distribuição NuGet que falhou.

O template não usa `NUGET_API_KEY` de longa duração.

### Proteção do placeholder

O repositório-template usa `Template.Library` como identidade neutra. O workflow de release detecta essa identidade e impede sua publicação acidental no NuGet.org.

O próprio template pode criar tag e GitHub Release versionados, mesmo sem `NUGET_USER`, mas não publica nem anexa o pacote placeholder. Em projetos gerados por `dotnet new`, o `PackageId` é substituído pelo nome real da biblioteca; o GitHub Release pode ser usado independentemente do NuGet, e a publicação no NuGet passa a ser permitida quando Trusted Publishing e `NUGET_USER` estiverem configurados.

## Segurança e qualidade

Os principais workflows têm responsabilidades separadas:

| Workflow | Responsabilidade |
| --- | --- |
| `ci.yml` | restore, políticas de build, formatação, testes, cobertura, pack e validação de consumo |
| `codeql.yml` | análise CodeQL para C# |
| `dependency-review.yml` | bloqueio de novas vulnerabilidades High/Critical em PRs |
| `sonar.yml` | análise opcional no SonarQube Cloud |
| `release.yml` | validação, criação/verificação de tag, publicação NuGet opcional e GitHub Release |
| `template-validation.yml` | validação end-to-end do `dotnet new` |
| `sonar-template-validation.yml` | validação do contrato Sonar na saída gerada |
| `versioning-validation.yml` | validação do contrato SemVer e metadata do pacote/assembly |
| `release-publishing-validation.yml` | validação maintenance-only do pedido de release, tag e opt-in NuGet |
| `github-template-initialization-validation.yml` | validação maintenance-only da inicialização via GitHub Template Repository |

Separar esses fluxos torna falhas de build, segurança, análise externa, geração e release independentes e diagnosticáveis.

## SonarQube Cloud opcional

A análise do Sonar é opt-in e o workflow está em `.github/workflows/sonar.yml`. Para habilitar corretamente:

1. crie ou importe o projeto no SonarQube Cloud e associe-o ao repositório GitHub;
2. no projeto Sonar, mantenha **Automatic Analysis desabilitado**, porque esta baseline usa análise CI-based para executar o build .NET e importar cobertura;
3. configure o Repository Secret `SONAR_TOKEN` com um token autorizado a analisar o projeto;
4. configure `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION` e `SONAR_HOST_URL` como Repository Variables somente quando os valores derivados automaticamente não corresponderem às coordenadas do projeto Sonar;
5. para uma baseline por release, configure **New Code → Previous Version**; o workflow envia `sonar.projectVersion` com o maior release tag alcançável segundo precedência SemVer e usa `PackageVersion` antes do primeiro release;
6. use **Sonar way** ou um Quality Gate customizado intencional. O workflow usa `sonar.qualitygate.wait=true` e timeout de 300 segundos, portanto um gate avaliado como reprovado falha o job em PRs e pushes para `main`;
7. valide pelo menos um PR antes de tornar o check Sonar obrigatório no ruleset de `main`.

O secret obrigatório é:

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

A cobertura enviada ao Sonar é gerada em OpenCover e importada por `sonar.cs.opencover.reportsPaths`. Os scripts de governança e release em `scripts/**` permanecem deliberadamente dentro da análise Sonar; não use `sonar.exclusions=scripts/**` apenas para alterar métricas.

**PRs vindos de forks:** o GitHub não disponibiliza Repository Secrets como `SONAR_TOKEN` para o evento `pull_request` de forks. Nesse caso o workflow emite um warning e termina pelo caminho desabilitado, sem executar scanner nem Quality Gate. Portanto, um check Sonar verde em um fork PR não comprova que a contribuição foi analisada e não deve ser o único gate obrigatório para contribuições não confiáveis.

A configuração completa, incluindo cobertura, versionamento SemVer, branch protection, forks e troubleshooting, está em [docs/sonarqube-cloud.pt-BR.md](docs/sonarqube-cloud.pt-BR.md). A versão em inglês está em [docs/sonarqube-cloud.md](docs/sonarqube-cloud.md).

## Conteúdo gerado versus manutenção do template

A maior parte da baseline é copiada para projetos gerados: código, testes, build policies, lock files, dependências centralizadas, governança, CI, segurança, qualidade, release e tooling de pacote.

Conteúdo específico de manutenção do template é excluído, incluindo:

- `.template.config/**`;
- workflow e helper de inicialização via GitHub Template Repository;
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
│   ├── ensure-release-tag.sh
│   ├── resolve-nuget-publishing.sh
│   ├── resolve-release-request.sh
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
├── SECURITY.md
├── Template.Library.slnx
└── global.json
```

## Documentação

- [README in English](README.en.md): versão em inglês desta visão geral;
- [Configuração do SonarQube Cloud](docs/sonarqube-cloud.pt-BR.md): setup, Quality Gate, New Code, cobertura, forks e troubleshooting;
- [SonarQube Cloud setup](docs/sonarqube-cloud.md): versão em inglês do guia Sonar;
- [Template development](docs/template-development.md): regras para manter e evoluir o custom template;
- [Repository administration](docs/repository-administration.md): baseline de settings administrativos no GitHub;
- [Generated library README](docs/library-readme.md): README usado em projetos criados por `dotnet new`;
- [CONTRIBUTING.md](CONTRIBUTING.md): processo de contribuição e breaking changes;
- [SECURITY.md](SECURITY.md): política de reporte e triagem de vulnerabilidades;
- [CHANGELOG.md](CHANGELOG.md): histórico de mudanças relevantes;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): padrões de participação.

## Convenção `Template.Library`

`Template.Library` é uma identidade neutra e intencional. Em `.template.config/template.json`, ela é o `sourceName` substituído pelo valor informado em `-n`/`--name`.

Não substitua essa identidade no repositório-base por um produto ou domínio real. Mudanças nas regras de geração devem preservar a neutralidade do template e ser cobertas pelas validações end-to-end.

## Contribuição

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um pull request.

## Licença

Distribuído sob a licença [MIT](LICENSE).
