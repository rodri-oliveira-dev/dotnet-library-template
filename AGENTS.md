# AGENTS.md

## Objetivo

Este repositório contém uma biblioteca .NET reutilizável. O trabalho deve ser pequeno, correto, reproduzível e alinhado ao estado real do repositório.

Não trate roadmap, workflow, ferramenta ou convenção como existente sem confirmar o arquivo correspondente na árvore atual.

## Fontes de verdade

Leia somente o necessário para a tarefa, priorizando:

1. `README.md`, `CONTRIBUTING.md` e `CHANGELOG.md`;
2. a solution e os projetos em `/src` e `/tests`;
3. `Directory.Build.props`, `Directory.Packages.props` e `.editorconfig`;
4. `.github/workflows/`;
5. `.template.config/template.json`, quando aplicável;
6. `.agents/skills/` para procedimentos especializados.

## Gerenciamento de contexto

- Pesquise símbolos, tipos, métodos, testes, mensagens de erro e configuração antes de abrir arquivos inteiros.
- Prefira leituras direcionadas; para arquivos grandes, especialmente acima de aproximadamente **350 linhas**, localize primeiro a seção relevante.
- Comece pelo menor conjunto necessário: implementação, contrato/interface, testes, configuração e documentação diretamente relacionados.
- Não carregue por padrão arquivos gerados, artefatos de build, relatórios de cobertura, binários, snapshots extensos ou lock files sem relação direta com a tarefa.
- Evite reler conteúdo já confirmado e expanda o contexto de forma incremental somente quando a evidência atual for insuficiente.
- Leituras completas são apropriadas quando necessárias para entender contrato público, concorrência, estado, segurança ou configuração global.

## Roteamento de tarefas e delegação

Quando workers, subagentes ou modelos auxiliares estiverem disponíveis, delegue tarefas mecânicas como busca, inventário, resumo e boilerplate baseado em padrão confirmado.

Mantenha no agente principal decisões de comportamento, arquitetura, API pública, concorrência, segurança, dependências, breaking changes e revisão final.

Código produzido por outro agente deve passar pela mesma revisão e validação determinística da baseline. Se workers não estiverem disponíveis, preserve o princípio usando busca e leituras direcionadas.

## Estrutura e configuração

- Código de produção fica em `/src` e testes em `/tests`.
- Versões de pacotes são centralizadas em `Directory.Packages.props`.
- Propriedades MSBuild compartilhadas ficam em `Directory.Build.props`.
- Ferramentas .NET locais, quando necessárias, ficam em `.config/dotnet-tools.json`.
- `packages.lock.json` é versionado e participa do restore reproduzível.
- A automação disponível é definida pelos arquivos que realmente existem em `.github/workflows/`.

## Regras de mudança

- Prefira a menor alteração capaz de resolver o problema.
- Não misture refatoração, mudança funcional, atualização de dependências e formatação ampla sem necessidade técnica.
- Preserve comportamento observável e API pública salvo quando a tarefa pedir explicitamente mudança de contrato.
- Trate breaking changes como decisão deliberada, com impacto, migração e versionamento esperados.
- Mudanças comportamentais devem atualizar ou adicionar testes relevantes.
- Mudanças relevantes para consumidores devem atualizar `CHANGELOG.md` em `Unreleased`.
- Não adicione `Version=` em `PackageReference`; altere versões em `Directory.Packages.props`.
- Não edite `packages.lock.json` manualmente.
- Não adicione dependências de domínio, infraestrutura, framework web ou tooling sem necessidade concreta e reutilizável.
- Não reduza warnings, auditoria, testes, cobertura ou controles de segurança para fazer a mudança passar.
- Não introduza secrets, tokens, URLs privadas ou credenciais em código, workflows ou documentação.

## Dependências

Ao alterar referências de pacote:

```bash
dotnet restore --force-evaluate
dotnet restore --locked-mode
```

Mantenha `PackageReference` sem versão e revise os lock files regenerados pelo SDK.

## Validação obrigatória

Validação determinística prevalece sobre a avaliação textual de qualquer agente.

Antes de concluir uma alteração versionável, execute a partir da raiz, quando o ambiente permitir:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Quando a mudança afetar cobertura ou testes de forma relevante:

```bash
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

Quando afetar API pública, metadados, símbolos ou empacotamento:

```bash
dotnet pack --configuration Release --no-build --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

Quando Source Link precisar ser comprovado em checkout Git com remote configurado:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

CI, CodeQL, Dependency Review, NuGet Audit, SonarQube Cloud e demais gates existentes são enforcement da baseline. Não os contorne nem trate instruções de agente como substitutas desses controles.

Se uma validação não puder ser executada por limitação real do ambiente, relate o bloqueio; não altere a baseline para contorná-lo.

## Testes

- Teste comportamento observável, não detalhes privados de implementação.
- Não altere testes apenas para fazê-los passar.
- Não aceite asserts tautológicos ou testes que apenas executam linhas para aumentar cobertura.
- Prefira testes determinísticos, independentes de ordem e sem sleeps arbitrários.
- Use mocks/substitutes apenas quando isolarem dependência real e melhorarem a clareza do cenário.

## API pública e changelog

Antes de alterar tipo, membro, namespace, assinatura, comportamento documentado ou `PackageId` exposto a consumidores:

1. identifique o impacto de compatibilidade;
2. preserve o contrato quando a mudança não for explicitamente breaking;
3. atualize testes e documentação relevantes;
4. registre impacto em `CHANGELOG.md` quando relevante para consumidores.

## Skills

Use somente skills relacionadas à tarefa. Skills de orquestração podem combinar skills técnicas específicas.

| Skill | Uso |
| --- | --- |
| `dotnet-issue-implementation` | Implementação de issue e validação do DoD |
| `dotnet-bug-investigation` | Bug, regressão e causa raiz |
| `dotnet-pr-review` | Revisão técnica de PR/diff |
| `dotnet-security-review` | Revisão de segurança |
| `dotnet-library-change` | Mudança funcional/técnica |
| `dotnet-refactoring-engineer` | Refatoração sem mudança de comportamento |
| `coverage-analysis` | Análise de cobertura |
| `test-anti-patterns` | Qualidade de testes |
| `ci-release-governance` | CI, packaging e release |

Em caso de conflito, `AGENTS.md` e o estado real do repositório prevalecem.

## Git e entrega

- Revise o diff antes de concluir.
- Evite arquivos temporários, artefatos de build e alterações fora do escopo.
- Não faça push, publique pacote, crie release ou abra Pull Request sem solicitação explícita.
- Ao finalizar, informe validações executadas e qualquer risco ou bloqueio restante.
