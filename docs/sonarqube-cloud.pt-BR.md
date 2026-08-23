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
- exclui `scripts/**` da análise Sonar;
- aguarda o Quality Gate e falha quando o gate reprova;
- envia um `sonar.projectVersion` baseado no último release tag alcançável;
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

1. procura o release tag mais recente alcançável pelo `HEAD` no padrão `v*.*.*`, usando ordenação semântica;
2. remove o prefixo `v` e usa essa versão como `sonar.projectVersion`;
3. enquanto não houver release tag, usa o `PackageVersion` resolvido pelo MSBuild como fallback.

Exemplo:

```text
último tag alcançável: v1.4.0
sonar.projectVersion: 1.4.0
```

Esse comportamento permite utilizar a estratégia **Previous Version** do SonarQube Cloud de forma coerente com o modelo de releases do repositório. Depois que um novo release tag é criado, a próxima análise de `main` passa a enxergar a nova versão e avança a baseline.

Se o projeto deliberadamente utilizar outra estratégia de New Code, mantenha o versionamento do workflow salvo se existir uma razão documentada para removê-lo.

## 6. Configurar o Quality Gate

O workflow usa:

```text
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

Portanto, se o Quality Gate reprovar, o job do Sonar no GitHub Actions também reprova, tanto em pull requests quanto em pushes para `main`.

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

## 8. Exclusões da análise

A baseline exclui deliberadamente:

```text
scripts/**
```

através de:

```text
sonar.exclusions=scripts/**
```

Os helpers e scripts de release continuam sendo validados pelos próprios fluxos de CI/release, mas ficam fora da análise principal do projeto no Sonar.

Adicione novas exclusões somente quando os arquivos estiverem claramente fora do escopo de análise do produto. Evite exclusões amplas como `src/**`, validators ou código de domínio.

## 9. Histórico Git completo

O checkout do Sonar utiliza:

```yaml
fetch-depth: 0
```

Não transforme esse checkout em shallow sem também redesenhar a estratégia de resolução de versão. O histórico completo é necessário para localizar release tags alcançáveis e também melhora as informações SCM disponíveis ao Sonar.

## 10. Branch protection / ruleset

Depois que a integração estiver estável, inclua o job do Sonar entre os checks obrigatórios de `main` se essa for a política de governança do repositório.

O nome atual do job é:

```text
Analisar com SonarQube Cloud
```

Confirme o nome exato emitido pelo GitHub em um pull request recente antes de adicioná-lo ao ruleset.

## Repositórios gerados

Secrets, Repository Variables, projetos do SonarQube Cloud, Quality Gates e configurações de branch protection não são copiados por `dotnet new` nem por GitHub Template Repository.

Cada novo repositório precisa configurar seu próprio projeto no Sonar e seu próprio `SONAR_TOKEN`. As variáveis adicionais só são necessárias quando os fallbacks não correspondem às coordenadas do projeto Sonar.

## Troubleshooting

### O workflow informa que SonarQube Cloud está desabilitado

Confirme que `SONAR_TOKEN` existe em **Settings → Secrets and variables → Actions → Secrets** e está disponível para o evento do workflow.

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

Confirme que os releases geram Git tags no padrão:

```text
v*.*.*
```

e que esses tags são alcançáveis a partir de `main`. Preserve `fetch-depth: 0` no checkout.

## Segurança

- mantenha `SONAR_TOKEN` somente em GitHub Secrets;
- não imprima tokens em diagnósticos do workflow;
- use Repository Variables para coordenadas não secretas;
- não adicione credenciais persistentes ao código-fonte;
- mantenha as permissões do workflow somente leitura enquanto nenhuma funcionalidade do Sonar exigir permissões adicionais de forma documentada.
