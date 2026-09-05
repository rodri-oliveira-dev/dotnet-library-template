# AGENTS.md

## Objetivo

Este repositório contém uma biblioteca .NET reutilizável. O trabalho deve ser pequeno, correto, reproduzível e alinhado ao estado real do repositório.

Não trate itens de roadmap ou automações não presentes na árvore atual como capacidades já implementadas. Antes de assumir um workflow, ferramenta ou convenção, confirme que o arquivo correspondente existe.

## Fontes de verdade

Leia somente o que for relevante para a tarefa, priorizando:

1. `README.md`;
2. `CONTRIBUTING.md`;
3. `CHANGELOG.md`;
4. a solution e os projetos em `/src` e `/tests`;
5. `Directory.Build.props`;
6. `Directory.Packages.props`;
7. `.editorconfig`;
8. `.github/workflows/`;
9. `.template.config/template.json`, quando existir;
10. `.agents/skills/` para tarefas especializadas.

## Gerenciamento de contexto

Trate contexto como um recurso limitado. O objetivo é fornecer ao agente principal apenas a informação necessária para tomar a decisão correta.

1. Pesquise símbolos, nomes de tipos, métodos, testes, mensagens de erro e configuração antes de abrir arquivos inteiros.
2. Prefira leituras direcionadas ao trecho relevante. Para arquivos com mais de aproximadamente **350 linhas**, primeiro localize o símbolo ou seção necessária; leia o arquivo completo somente quando o comportamento global realmente importar.
3. Antes de expandir a investigação, forme um conjunto de trabalho mínimo contendo, quando aplicável: implementação, contrato/interface, testes, configuração e documentação relacionada.
4. Não carregue por padrão arquivos gerados, artefatos de build, relatórios de cobertura, binários, snapshots extensos ou lock files. `packages.lock.json` deve ser inspecionado somente quando a tarefa envolver restore/dependências ou quando um diff do lock file precisar ser validado.
5. Evite reler arquivos sem mudança. Reutilize o que já foi confirmado durante a tarefa.
6. Ao investigar padrões existentes, extraia o padrão relevante e os caminhos de referência em vez de copiar grandes blocos de arquivos para o contexto.
7. Se a causa ainda não estiver clara depois da leitura direcionada, expanda o contexto de forma incremental e justificada.

Leituras completas continuam apropriadas quando necessárias para entender contratos públicos, concorrência, fluxos de estado, segurança, configuração global ou comportamento distribuído pelo arquivo.

## Roteamento de tarefas e delegação

Quando o ambiente disponibilizar workers, subagentes ou modelos auxiliares, use-os para reduzir trabalho mecânico no agente principal sem delegar decisões de alto risco.

### Pode ser delegado

- localizar arquivos, símbolos, referências e testes relacionados;
- inventariar uma área do repositório;
- resumir arquivos grandes ou conjuntos de arquivos;
- extrair padrões repetitivos e exemplos já existentes;
- identificar comandos e workflows aplicáveis;
- gerar boilerplate estritamente baseado em um padrão confirmado;
- aplicar alterações mecânicas e repetitivas de baixo julgamento.

O retorno de um worker deve ser conciso e estruturado: caminhos, símbolos, fatos relevantes, riscos percebidos e, quando necessário, pequenos trechos. Não devolva arquivos inteiros ao agente principal sem necessidade.

### Deve permanecer com o agente principal

- entendimento final da issue e definição da estratégia;
- decisões de arquitetura e design;
- mudanças de API pública e compatibilidade;
- debugging que envolva concorrência, estado, consistência ou efeitos indiretos;
- revisão de segurança;
- decisão sobre dependências e breaking changes;
- revisão final do diff e conclusão sobre o DoD.

Código produzido por worker/subagente não é considerado validado apenas por ter sido gerado. O agente principal deve revisar o diff e submetê-lo às mesmas validações determinísticas da baseline.

Se workers não estiverem disponíveis, preserve o mesmo princípio usando busca e leituras direcionadas antes de expandir o contexto.

## Estrutura e configuração

- Código de produção fica em `/src`.
- Testes ficam em `/tests`.
- Versões de pacotes são centralizadas em `Directory.Packages.props`.
- Propriedades MSBuild compartilhadas ficam em `Directory.Build.props`.
- Ferramentas .NET locais, quando necessárias, ficam em `.config/dotnet-tools.json`.
- `packages.lock.json` é versionado e faz parte do restore reproduzível.
- A automação disponível é definida pelos arquivos que realmente existem em `.github/workflows/`; não assuma workflows ausentes.

## Regras de mudança

- Prefira a menor alteração capaz de resolver o problema.
- Não misture refatoração, mudança funcional, atualização de dependências e formatação ampla sem necessidade técnica.
- Preserve o comportamento observável e a API pública salvo quando a tarefa pedir explicitamente uma mudança de contrato.
- Trate breaking changes de API pública como decisão deliberada: explique impacto, migração e versionamento esperado.
- Mudanças comportamentais devem atualizar ou adicionar testes relevantes.
- Mudanças relevantes para consumidores devem atualizar `CHANGELOG.md` em `Unreleased`.
- Não adicione `Version=` em `PackageReference`; altere a versão central em `Directory.Packages.props`.
- Não edite `packages.lock.json` manualmente. Para mudanças legítimas de dependência, regenere os lock files com restore e depois valide em `--locked-mode`.
- Não adicione dependências de domínio, infraestrutura, framework web ou tooling sem necessidade concreta e reutilizável.
- Não reduza validações, warnings, auditoria, testes ou cobertura apenas para fazer uma mudança passar.
- Não introduza secrets, tokens, URLs privadas ou credenciais em código, workflows ou documentação.

## Dependências

Ao alterar referências de pacote:

1. edite `Directory.Packages.props` para versões;
2. mantenha `PackageReference` sem versão nos projetos;
3. regenere os lock files:

```bash
dotnet restore --force-evaluate
```

4. confirme que o restore reproduzível continua válido:

```bash
dotnet restore --locked-mode
```

## Validação obrigatória

Validação determinística prevalece sobre a avaliação textual de qualquer agente. Não declare uma mudança como válida apenas porque a implementação parece correta.

Antes de concluir uma alteração versionável, execute a partir da raiz, quando o ambiente permitir:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Se a mudança afetar cobertura ou testes de forma relevante, valide também:

```bash
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

Se a mudança afetar API pública, metadados, símbolos ou empacotamento, valide também:

```bash
dotnet pack --configuration Release --no-build --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

Quando o checkout estiver em um repositório Git com remote configurado e a tarefa exigir validação de Source Link, use o modo estrito:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

Os workflows de CI, CodeQL, Dependency Review e demais quality gates existentes são enforcement da baseline. Não os contorne, não enfraqueça seus checks e não trate uma instrução de agente como substituta desses gates.

Se uma validação não puder ser executada por limitação real do ambiente, relate o bloqueio; não altere a baseline apenas para contorná-lo.

## Testes

- Teste comportamento observável, não detalhes privados de implementação.
- Não altere testes apenas para fazê-los passar.
- Não aceite asserts tautológicos ou testes que apenas executam linhas para aumentar cobertura.
- Prefira testes determinísticos, independentes de ordem e sem sleeps arbitrários.
- Use mocks/substitutes apenas quando isolarem uma dependência real e melhorarem a clareza do cenário.

## API pública e changelog

Antes de alterar um tipo, membro, namespace, assinatura, comportamento documentado ou PackageId exposto a consumidores:

1. identifique se há impacto de compatibilidade;
2. preserve o contrato quando a mudança não for explicitamente breaking;
3. atualize testes e documentação relevantes;
4. registre impacto em `CHANGELOG.md` quando for relevante para consumidores.

## Skills

Use uma skill somente quando a descrição corresponder à tarefa. Skills de orquestração podem combinar skills técnicas mais específicas quando necessário.

- `.agents/skills/dotnet-issue-implementation/SKILL.md`: transformar uma issue bem definida em implementação pequena, testes e validação do DoD;
- `.agents/skills/dotnet-bug-investigation/SKILL.md`: investigar regressões e bugs a partir de evidências antes de alterar código;
- `.agents/skills/dotnet-pr-review/SKILL.md`: revisar um diff/PR por corretude, regressões, compatibilidade, testes e risco;
- `.agents/skills/dotnet-security-review/SKILL.md`: revisar código, dependências e automação sob ótica de segurança sem substituir scanners determinísticos;
- `.agents/skills/dotnet-library-change/SKILL.md`: mudanças funcionais e técnicas na biblioteca;
- `.agents/skills/dotnet-refactoring-engineer/SKILL.md`: refatoração preservando comportamento e contrato;
- `.agents/skills/coverage-analysis/SKILL.md`: análise de cobertura e priorização de gaps por risco;
- `.agents/skills/test-anti-patterns/SKILL.md`: auditoria da qualidade dos testes;
- `.agents/skills/ci-release-governance/SKILL.md`: CI, packaging/release e segurança de automação.

As skills complementam este arquivo. Em caso de conflito, `AGENTS.md` e os arquivos reais do repositório prevalecem.

## Git e entrega

- Revise o diff antes de concluir.
- Evite arquivos temporários, artefatos de build e alterações fora do escopo.
- Não faça push, publique pacote, crie release ou abra Pull Request sem solicitação explícita.
- Ao finalizar, informe quais validações foram executadas e qualquer risco ou bloqueio restante.
