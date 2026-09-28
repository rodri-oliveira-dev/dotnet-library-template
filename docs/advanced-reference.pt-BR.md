# Referência avançada do .NET Library Template

[English](advanced-reference.md) | **Português**

Esta referência mantém os detalhes operacionais que não precisam ficar no caminho principal de onboarding: inicialização via GitHub Template Repository, release/publicação, Trusted Publishing/OIDC, supply chain, Package Validation, versionamento, validações E2E e separação entre conteúdo gerado e manutenção do template.

Para criar uma biblioteca pela CLI, comece pelo [README principal](../README.md). Para manutenção interna e regras de evolução, consulte também [template-development.md](template-development.md).

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
- as alterações são enviadas para `initialize-repository/<project>`;
- o workflow abre um pull request para a branch padrão, preservando rulesets e branch protection;
- o desenvolvimento normal continua após o merge desse pull request.

Execute esse workflow antes de iniciar o desenvolvimento normal no novo repositório. Ele deve ser disparado a partir da branch padrão e falha se for executado no repositório-fonte `rodri-oliveira-dev/dotnet-library-template`.

### Pré-requisitos e falhas esperadas

- GitHub Actions precisa estar habilitado no novo repositório;
- configure o Repository Secret `INITIALIZE_REPOSITORY_TOKEN` antes de executar o workflow;
- esse token deve ser temporário e ter, no repositório de destino, **Contents: Read and write**, **Pull requests: Read and write** e **Workflows: Read and write**;
- remova ou revogue `INITIALIZE_REPOSITORY_TOKEN` depois da inicialização bem-sucedida;
- rulesets podem bloquear a criação/atualização da branch de inicialização ou a abertura/merge do pull request;
- se validação, build, testes ou empacotamento falharem, o workflow não deve commitar nem enviar uma inicialização parcial;
- se uma operação for bloqueada, ajuste as regras do repositório ou aplique um processo equivalente aprovado sem enfraquecer a segurança automaticamente.

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
   - **Pull requests** → **Read and write**;
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

O token precisa de `Contents: Read and write` porque o initializer cria e envia a branch com os arquivos gerados, de `Pull requests: Read and write` porque abre automaticamente o pull request de inicialização, e de `Workflows: Read and write` porque a inicialização também remove/substitui arquivos em `.github/workflows`.

Após uma inicialização bem-sucedida, remova o Repository Secret `INITIALIZE_REPOSITORY_TOKEN` e revogue ou exclua o PAT em **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**. Não reutilize esse token como credencial permanente de CI e não o armazene em arquivos versionados.

### Possíveis erros durante a inicialização

#### `Configure repository secret INITIALIZE_REPOSITORY_TOKEN...`

```text
Configure repository secret INITIALIZE_REPOSITORY_TOKEN before running this one-time initializer.
For a fine-grained token, grant this repository Contents: write, Pull requests: write, and Workflows: write.
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

#### `Resource not accessible by personal access token (createPullRequest)`

```text
pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)
```

Esse erro indica que a geração e o push da branch podem ter sido concluídos, mas o PAT não possui permissão para criar o pull request. Edite ou recrie o Fine-grained PAT e conceda **Pull requests → Read and write** para o repositório de destino. Depois atualize o valor do Repository Secret `INITIALIZE_REPOSITORY_TOKEN` e execute o initializer novamente, ou abra manualmente o pull request a partir da branch `initialize-repository/<project>` já criada.

#### Operação rejeitada por ruleset ou branch protection

O initializer não escreve diretamente na branch padrão: ele envia uma branch `initialize-repository/<project>` e abre um pull request. Ainda assim, rulesets podem restringir a criação/atualização dessa branch ou impedir o merge até que os checks obrigatórios sejam concluídos. Ajuste apenas as regras necessárias ou siga o processo normal de revisão; não desabilite proteções permanentemente para contornar o initializer.

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

A baseline administrativa recomendada está documentada em [docs/repository-administration.md](repository-administration.md).

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

Em releases, o input manual `version` é a fonte de verdade e a tag é derivada dele:

```text
1.0.0           -> tag v1.0.0          -> Version 1.0.0
1.2.3           -> tag v1.2.3          -> Version 1.2.3
1.3.0-beta.1    -> tag v1.3.0-beta.1   -> Version 1.3.0-beta.1
```

`.github/workflows/release.yml` usa `Version` como único override de release, executa restore, format, build, test, pack, valida o pacote placeholder, empacota e valida o template package real, executa E2E/parity, gera `release-manifest.json` e `SHA256SUMS`, e publica um artifact único `release-candidate-<version>`.

### Release manual pelo GitHub Actions

O fluxo recomendado para uma release manual é:

1. abra a aba **Actions** do repositório;
2. selecione o workflow **Release**;
3. clique em **Run workflow**;
4. selecione a branch **main**;
5. informe **version** sem prefixo `v`, por exemplo `1.2.0` ou `1.3.0-beta.1`;
6. mantenha **publish=false** para validar sem mutações externas, ou selecione **publish=true** para publicar oficialmente;
7. execute o workflow.

Pull requests e execuções manuais com `publish=false` apenas constroem e validam o release candidate. Elas não criam tag, não criam GitHub Release, não pedem credencial OIDC do NuGet e não executam `dotnet nuget push`.

Com `publish=true`, o workflow exige `refs/heads/main`, rejeita uma tag existente conflitante antes do build pesado, baixa o mesmo candidate validado pelo job de build, verifica versão, tag, commit, manifesto e SHA-256, atesta os artifacts, cria ou retoma um GitHub Release em draft, publica o pacote via NuGet Trusted Publishing/OIDC, publica o mesmo `.nupkg` no GitHub Packages e somente então finaliza o GitHub Release. Se qualquer publicação falhar, a release permanece draft e o workflow falha.

### NuGet.org Trusted Publishing

A publicação no NuGet.org é explicitamente **opt-in** pelo input `publish=true` e pela Repository Variable `NUGET_USER`. `NUGET_USER` não é um secret e identifica o usuário/profile usado pela policy de Trusted Publishing.

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
publish=true
AND refs/heads/main
AND artifact validado corresponde a version/tag/commit
AND NUGET_USER está configurado e não vazio
```

Se `NUGET_USER` estiver ausente, vazio ou contiver apenas espaços, `publish=false` continua funcionando como validação. Com `publish=true`, a execução falha antes de autenticação externa, porque uma publicação oficial deve conseguir publicar o pacote validado.

O workflow cria ou retoma uma GitHub Release em draft antes das publicações externas para anexar os artifacts validados. Ela só é finalizada depois que as publicações no NuGet.org e no GitHub Packages concluírem com sucesso, evitando sinalizar uma distribuição incompleta.

O template não usa `NUGET_API_KEY` de longa duração.

### GitHub Packages

Releases oficiais também publicam `RodriOliveira.DotNet.Library.Template.<version>.nupkg` no GitHub Packages:

```text
https://nuget.pkg.github.com/rodri-oliveira-dev/index.json
```

Essa publicação é um mirror autenticado para consumidores que já usam GitHub Packages. NuGet.org permanece o registry público principal e é o caminho recomendado para `dotnet new install`.

Para consumir o mirror do GitHub Packages, configure uma fonte NuGet autenticada com seu usuário do GitHub e um token que tenha `read:packages`:

```bash
dotnet nuget add source "https://nuget.pkg.github.com/rodri-oliveira-dev/index.json" \
  --name github-rodri-oliveira-dev \
  --username GITHUB_USERNAME \
  --password GITHUB_PACKAGES_TOKEN \
  --store-password-in-clear-text

dotnet new install RodriOliveira.DotNet.Library.Template \
  --add-source "https://nuget.pkg.github.com/rodri-oliveira-dev/index.json"
```

`GITHUB_USERNAME` e `GITHUB_PACKAGES_TOKEN` são placeholders. Use um token limitado ao acesso mínimo necessário e nunca o versione no repositório. O argumento `--add-source` permite que `dotnet new install` resolva o template pelo mirror autenticado depois que a fonte estiver registrada.

### Proteção do placeholder

O repositório-template usa `Template.Library` como identidade neutra. O workflow de release detecta essa identidade e impede sua publicação acidental no NuGet.org.

Neste repositório fonte, o pacote publicável é somente `RodriOliveira.DotNet.Library.Template.<version>.nupkg`. O pacote `Template.Library` pode ser compilado, empacotado e validado localmente, mas fica separado em artifacts de validação e nunca entra no release candidate publicável. Em projetos gerados por `dotnet new`, o workflow entregue publica apenas o PackageId real da biblioteca gerada quando Trusted Publishing, `NUGET_USER`, ambiente `release` e `publish=true` estiverem configurados.

## Segurança e qualidade

Os principais workflows têm responsabilidades separadas:

| Workflow | Responsabilidade |
| --- | --- |
| `ci.yml` | restore, políticas de build, formatação, testes, cobertura, pack e validação de consumo |
| `codeql.yml` | análise CodeQL para C# |
| `dependency-review.yml` | bloqueio de novas vulnerabilidades High/Critical em PRs |
| `sonar.yml` | análise opcional no SonarQube Cloud |
| `release.yml` | validação de release candidate, attestation, draft GitHub Release, NuGet Trusted Publishing, GitHub Packages e finalização da release |
| `template-validation.yml` | validação end-to-end do `dotnet new` |
| `template-package-validation.yml` | validação maintenance-only do NuGet Template Package real |
| `sonar-template-validation.yml` | validação do contrato Sonar na saída gerada |
| `versioning-validation.yml` | validação do contrato SemVer e metadata do pacote/assembly |
| `release-publishing-validation.yml` | validação maintenance-only do release candidate, publicação explícita, OIDC, draft release e opt-in NuGet |
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

A configuração completa, incluindo cobertura, versionamento SemVer, branch protection, forks e troubleshooting, está em [docs/sonarqube-cloud.pt-BR.md](sonarqube-cloud.pt-BR.md). A versão em inglês está em [docs/sonarqube-cloud.md](sonarqube-cloud.md).

## Conteúdo gerado versus manutenção do template

A maior parte da baseline é copiada para projetos gerados: código, testes, build policies, lock files, dependências centralizadas, governança, CI, segurança, qualidade, release e tooling de pacote.

Conteúdo específico de manutenção do template é excluído, incluindo:

- `.template.config/**`;
- `packaging/**`;
- workflow e helper de inicialização via GitHub Template Repository;
- workflows de validação exclusivos do template;
- workflow e scripts de validação do NuGet Template Package;
- `docs/template-development.md`;
- `docs/advanced-reference.md`;
- `docs/advanced-reference.pt-BR.md`;
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
│   ├── advanced-reference.md
│   ├── advanced-reference.pt-BR.md
│   ├── library-readme.md
│   ├── repository-administration.md
│   └── template-development.md
├── scripts/
│   ├── release-candidate.cs
│   ├── resolve-nuget-publishing.sh
│   ├── resolve-release-request.sh
│   └── verify-package.cs
├── packaging/
│   └── RodriOliveira.DotNet.Library.Template.csproj
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
