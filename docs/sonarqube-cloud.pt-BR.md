# Configuração do SonarQube Cloud

**Português** | [English](sonarqube-cloud.md)

Este repositório inclui uma integração opcional com SonarQube Cloud em `.github/workflows/sonar.yml`. Ela foi pensada para bibliotecas .NET geradas a partir deste template e permanece desabilitada até que `SONAR_TOKEN` seja configurado.

## O que o workflow faz

Quando habilitado, o workflow executa em pull requests para `main` e em pushes para `main`.

Ele:

- restaura o SonarScanner for .NET versionado localmente;
- restaura dependências NuGet em `--locked-mode`;
- executa build Release não incremental dentro da análise Sonar;
- executa os testes e gera cobertura OpenCover;
- mantém scripts de governança, release e administração disponíveis para análise do Sonar;
- aguarda o Quality Gate e falha quando o gate reprova;
- envia um `sonar.projectVersion` baseado no maior release tag alcançável segundo precedência SemVer;
- usa o `PackageVersion` como fallback enquanto ainda não existir release tag.

O CI principal continua sendo responsável pelo build normal do repositório, warnings como erros, validação do pacote e artefatos de CI. O SonarQube Cloud complementa essa baseline; ele não a substitui.

## 1. Criar ou importar o projeto no SonarQube Cloud

Crie o projeto no SonarQube Cloud e associe-o ao repositório GitHub que executará a análise.

Para uma importação normal a partir do GitHub, o workflow usa os seguintes valores padrão:

```text
project key  = <github-owner>_<repository-name>
organization = <github-owner>
host         = https://sonarcloud.io
```

Se o projeto Sonar usar esses valores, apenas `SONAR_TOKEN` é obrigatório.

## 2. Desabilitar Automatic Analysis

Ao usar este workflow do GitHub Actions, mantenha **Automatic Analysis desabilitado** no projeto do SonarQube Cloud.

A análise e a importação de cobertura ficam sob responsabilidade do scanner executado pelo CI. Usar os dois modos ao mesmo tempo pode produzir análises duplicadas ou inconsistentes, e Automatic Analysis não substitui a cobertura gerada pelos testes .NET.

## 3. Configurar o secret no GitHub

No repositório de destino, acesse:

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
→ New repository secret
```

Crie:

```text
Name: SONAR_TOKEN
Value: <token autorizado a analisar o projeto SonarQube Cloud>
```

Nunca versione esse token.

Se `SONAR_TOKEN` não existir ou estiver vazio, o workflow encerra com sucesso sem iniciar análise no Sonar.

## 4. Configurar Repository Variables quando necessário

O workflow possui fallbacks compatíveis com a convenção normal GitHub/SonarQube Cloud. Sobrescreva-os somente quando o projeto utilizar coordenadas diferentes.

Em:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

configure os valores necessários:

```text
SONAR_PROJECT_KEY
SONAR_ORGANIZATION
SONAR_HOST_URL
```

Exemplo:

```text
SONAR_PROJECT_KEY=<organization>_<repository>
SONAR_ORGANIZATION=<sonar-organization-key>
SONAR_HOST_URL=https://sonarcloud.io
```

Esses valores são Repository Variables, não secrets. `SONAR_TOKEN` continua sendo a única credencial.

## 5. Configurar New Code

O workflow envia `sonar.projectVersion` explicitamente.

A versão é resolvida nesta ordem:

1. enumera os Git tags alcançáveis pelo `HEAD` no padrão `v*.*.*`;
2. compara os candidatos válidos usando precedência SemVer, inclusive identificadores de prerelease;
3. remove o prefixo `v` da maior versão e usa o resultado como `sonar.projectVersion`;
4. enquanto não houver release tag, usa o `PackageVersion` resolvido pelo MSBuild como fallback.

Exemplo:

```text
tags alcançáveis: v1.3.0-beta.1, v1.3.0
sonar.projectVersion: 1.3.0
```

Um release estável possui precedência SemVer maior que um prerelease com o mesmo major/minor/patch. Identificadores numéricos de prerelease também são comparados numericamente, portanto `beta.10` possui precedência maior que `beta.2`.

Esse comportamento permite utilizar a estratégia **Previous Version** do SonarQube Cloud de forma coerente com o modelo de releases do repositório. Depois que um novo release tag é criado, a próxima análise de `main` passa a enxergar a nova versão e avança a baseline.

Se o projeto deliberadamente utilizar outra estratégia de New Code, mantenha o versionamento do workflow salvo se existir uma razão documentada para removê-lo.

## 6. Configurar o Quality Gate

O workflow usa:

```text
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

Quando o scanner realmente é executado, se o Quality Gate reprovar, o job do Sonar no GitHub Actions também reprova, tanto em pull requests quanto em pushes para `main`.

O gate padrão **Sonar way** é uma boa baseline inicial. Um Quality Gate customizado pode ser usado quando houver uma política explícita de qualidade, mas não reduza thresholds apenas para deixar o CI verde.

Em bibliotecas pequenas e determinísticas, metas de cobertura podem ser mais rigorosas que em aplicações comuns. Ainda assim, exclusões devem representar código realmente fora do escopo do produto, e não manipulação de métrica.

## 7. Cobertura

Os testes são executados com Coverlet MTP gerando OpenCover:

```text
--coverlet
--coverlet-output-format opencover
```

O scanner importa o relatório através de:

```text
sonar.cs.opencover.reportsPaths=**/coverage.opencover*.xml
```

Isso é independente do artefato Cobertura produzido pelo workflow principal de CI.

Não exclua código de produção da cobertura apenas para elevar o percentual exibido.

## 8. Escopo da análise

A baseline **não exclui `scripts/**` da análise Sonar**. Helpers como validação do pacote, guards de release, manipulação de tags e inicialização de repositórios gerados fazem parte da governança técnica do projeto e devem continuar visíveis para análises de confiabilidade, segurança e text/secrets quando suportadas pelo Sonar.

Se algum arquivo futuro não deva contribuir para cobertura, prefira a exclusão de cobertura mais específica possível em vez de removê-lo de toda a análise. Não adicione padrões amplos de `sonar.exclusions` apenas para melhorar métricas.

## 9. Histórico Git completo

O checkout do Sonar utiliza:

```yaml
fetch-depth: 0
```

Não transforme esse checkout em shallow sem também redesenhar a estratégia de resolução de versão. O histórico completo é necessário para localizar release tags alcançáveis e também melhora as informações SCM disponíveis ao Sonar.

## 10. Branch protection / ruleset

Depois que a integração estiver estável, o job do Sonar pode ser incluído entre os checks obrigatórios de `main` **somente quando o modelo de contribuição do repositório garantir que o scanner realmente será executado nos pull requests que estiverem sendo bloqueados**.

O nome atual do job é:

```text
Analisar com SonarQube Cloud
```

Confirme o nome exato emitido pelo GitHub em um pull request recente antes de adicioná-lo ao ruleset.

### Pull requests vindos de forks

O GitHub não disponibiliza Repository Secrets como `SONAR_TOKEN` para workflows disparados por pull requests vindos de forks. Com o modelo opt-in seguro deste template, um PR de fork executa o caminho de Sonar desabilitado e o job termina com sucesso sem executar scanner ou Quality Gate.

Não interprete esse check verde como evidência de que o Sonar analisou a contribuição do fork e não use esse job do Sonar como único gate obrigatório para PRs não confiáveis. CI, CodeQL, Dependency Review e revisão normal continuam sendo gates independentes importantes.

Se um projeto realmente precisar analisar contribuições de forks com Sonar, desenhe um fluxo confiável separado. **Não** troque ingenuamente para `pull_request_target` e depois faça checkout ou execute código não confiável do fork com acesso a Repository Secrets, pois isso pode expor credenciais.

## Repositórios gerados

Secrets, Repository Variables, projetos do SonarQube Cloud, Quality Gates e configurações de branch protection não são copiados por `dotnet new` nem por GitHub Template Repository.

Cada novo repositório precisa configurar seu próprio projeto no Sonar e seu próprio `SONAR_TOKEN`. As variáveis adicionais só são necessárias quando os fallbacks não correspondem às coordenadas do projeto Sonar.

## Troubleshooting

### O workflow informa que SonarQube Cloud está desabilitado

Confirme que `SONAR_TOKEN` existe em **Settings → Secrets and variables → Actions → Secrets** e está disponível para o evento do workflow.

Em pull requests vindos de forks, o token fica indisponível intencionalmente. O workflow emite um warning e ignora a análise Sonar em vez de expor um Repository Secret a código não confiável.

### `SONAR_PROJECT_KEY` ou organization não pode ser resolvido

Confira as coordenadas do projeto no Sonar e, quando forem diferentes dos fallbacks derivados do GitHub, configure `SONAR_PROJECT_KEY` e `SONAR_ORGANIZATION` em Repository Variables.

### A análise termina, mas o workflow falha no último passo

Se o log contém:

```text
QUALITY GATE STATUS: FAILED
```

a integração funcionou corretamente. Abra o projeto no SonarQube Cloud, veja quais condições do Quality Gate reprovaram e corrija o problema de qualidade ou ajuste deliberadamente a política do gate. Não desabilite `sonar.qualitygate.wait` apenas para esconder a falha.

### A cobertura não aparece

Confirme que o passo de testes gerou um arquivo OpenCover e procure no log do Sonar pela leitura de `coverage.opencover*.xml`. Não troque a propriedade do scanner para Cobertura enquanto esse workflow estiver gerando OpenCover para a análise Sonar.

### A versão do projeto nunca avança

Confirme que os releases geram Git tags SemVer válidos no padrão:

```text
v*.*.*
```

e que esses tags são alcançáveis a partir de `main`. Preserve `fetch-depth: 0` no checkout. O resolver compara releases estáveis e prereleases pela precedência SemVer, sem depender da ordenação padrão de versões do Git.

## Segurança

- mantenha `SONAR_TOKEN` somente em GitHub Secrets;
- não imprima tokens em diagnósticos do workflow;
- use Repository Variables para coordenadas não secretas;
- não adicione credenciais persistentes ao código-fonte;
- não execute código não confiável de forks em workflows privilegiados com acesso a Repository Secrets;
- mantenha as permissões do workflow somente leitura enquanto nenhuma funcionalidade do Sonar exigir permissões adicionais de forma documentada.
