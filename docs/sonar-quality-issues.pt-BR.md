# Sincronização de issues de qualidade do Sonar

**Português** | [English](sonar-quality-issues.md)

Este template inclui um workflow opcional em `.github/workflows/sonar-quality-issues.yml` que reconcilia findings de alto impacto do Sonar com GitHub Issues.

Ele complementa `.github/workflows/sonar.yml`: o workflow normal do Sonar executa análise, importação de cobertura e Quality Gate, enquanto este workflow transforma findings `HIGH`/`BLOCKER` abertos em trabalho rastreável no repositório.

## Gatilhos

A sincronização executa:

- toda segunda-feira às `12:17 UTC` (`09:17 America/Sao_Paulo` enquanto UTC-3 estiver vigente);
- manualmente por `workflow_dispatch`.

O minuto não arredondado evita deliberadamente a janela mais congestionada de agendamentos do GitHub Actions.

## Configuração

O workflow reutiliza as mesmas coordenadas do Sonar usadas por `sonar.yml`:

```text
SONAR_TOKEN       secret   obrigatório para habilitar a sincronização
SONAR_PROJECT_KEY variable opcional; fallback para <github-owner>_<repository-name>
SONAR_HOST_URL    variable opcional; fallback para https://sonarcloud.io
SONAR_ISSUE_LABEL variable opcional; fallback para Sonar Quality Issues
```

`SONAR_TOKEN` é a única credencial. Não versione esse valor. Se o secret estiver ausente ou vazio, execuções agendadas e manuais encerram com sucesso sem consultar o Sonar nem escrever GitHub Issues.

Repositórios gerados não herdam GitHub Secrets nem Repository Variables. Cada repositório deve configurar seu próprio projeto Sonar e `SONAR_TOKEN`; sobrescreva as variáveis apenas quando os fallbacks não corresponderem às coordenadas reais.

## Comportamento de reconciliação

Cada Sonar issue key qualificada corresponde a uma única GitHub Issue gerenciada pelo workflow.

A cada sincronização completa e bem-sucedida o workflow:

1. consulta todos os findings do Sonar que estejam `OPEN` com impacto `HIGH` ou `BLOCKER`;
2. cria uma GitHub Issue quando ainda não existir issue gerenciada para aquela Sonar key;
3. atualiza título e corpo quando os metadados do Sonar mudarem;
4. reabre uma GitHub Issue gerenciada se o mesmo finding voltar a se qualificar;
5. restaura a label gerenciada se ela tiver sido removida manualmente;
6. fecha uma GitHub Issue gerenciada quando o finding correspondente deixar de ser retornado como aberto com impacto `HIGH`/`BLOCKER`.

Portanto, o fechamento indica que o finding foi resolvido, fechado ou deixou de possuir uma severidade monitorada no momento de uma reconciliação completa. Se ele voltar a se qualificar, a mesma GitHub Issue é reaberta em vez de gerar duplicata.

## Conteúdo gerenciado e anotações manuais

O workflow controla apenas a seção delimitada por:

```text
<!-- sonar-sync:start -->
...
<!-- sonar-sync:end -->
```

Anotações manuais adicionadas abaixo dessa seção são preservadas quando o workflow atualiza os metadados do Sonar.

Um marcador oculto `sonar-issue-key` fornece deduplicação estável. O workflow aceita uma key gerenciada apenas em Issues criadas por `github-actions[bot]`, reduzindo o risco de uma issue criada manualmente falsificar uma Sonar key pública. Remover apenas a label não gera duplicata; o workflow a restaura.

Não remova manualmente os marcadores gerenciados de uma issue sincronizada. Isso quebra deliberadamente o contrato de ownership/deduplicação do workflow.

## Permissões e segurança

O workflow usa somente:

```yaml
permissions:
  contents: read
  issues: write
```

`contents: read` é necessário para fazer checkout do script de reconciliação e obter metadados do repositório. `issues: write` é necessário para criar, atualizar, reabrir, fechar e rotular as Issues gerenciadas.

Actions de terceiros ficam pinadas por SHA imutável. O checkout não persiste credenciais. O workflow não compila nem executa código da aplicação e não possui trigger `pull_request` nem `pull_request_target`.

## Implementação

O YAML concentra gatilhos, permissões e configuração. A lógica de reconciliação fica em:

```text
.github/scripts/sync-sonar-quality-issues.js
```

Manter a lógica de API e gestão de Issues fora do YAML facilita revisão e evolução sem transformar o workflow em um grande programa inline.

## Execução manual

Acesse:

```text
Actions
→ Sync Sonar Quality Issues
→ Run workflow
```

Uma execução bem-sucedida gera um summary com as quantidades de findings qualificados, Issues criadas, atualizadas, reabertas, fechadas e inalteradas, além das labels restauradas.

## Notas operacionais

- Falha na API do Sonar interrompe a reconciliação; o workflow não fecha Issues com base em uma consulta incompleta ou com erro.
- A paginação possui limite de segurança de 100 páginas com até 500 findings cada.
- A baseline sincroniza apenas impactos `HIGH` e `BLOCKER`.
- Pull requests retornados pela API de Issues do GitHub são ignorados.
- Se existirem múltiplas Issues gerenciadas para a mesma Sonar key, o workflow emite warning e mantém a primeira encontrada como canônica.

## Documentação relacionada

Para configuração do projeto Sonar, Quality Gate, versionamento e importação de cobertura, consulte [sonarqube-cloud.pt-BR.md](sonarqube-cloud.pt-BR.md).
