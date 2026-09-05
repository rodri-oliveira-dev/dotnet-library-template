---
name: dotnet-issue-implementation
description: Use esta skill para transformar uma issue bem definida em uma alteração pequena de biblioteca .NET, com entendimento explícito de requisitos, implementação, testes, validação e conferência do Definition of Done. Não use quando o objetivo principal for apenas investigar um bug sem causa conhecida ou revisar um PR existente.
license: MIT
---

# Objetivo

Executar uma issue de ponta a ponta sem ampliar escopo, preservando contrato público, baseline técnica e rastreabilidade entre requisito, código, testes e validação.

# Princípio

A issue define o problema e o resultado esperado; o repositório define como a solução deve se encaixar. Não implemente a issue isoladamente do código e dos padrões existentes.

# Processo

1. Leia `AGENTS.md` e a issue completa.
2. Extraia em poucas linhas:
   - problema;
   - comportamento esperado;
   - restrições;
   - Definition of Done (DoD);
   - itens ambíguos ou não verificáveis.
3. Pesquise antes de abrir arquivos grandes. Localize implementação, contratos, testes, configuração e documentação diretamente relacionados.
4. Identifique impacto em API pública, dependências, packaging, segurança, compatibilidade e changelog.
5. Defina a menor estratégia capaz de satisfazer o DoD.
6. Quando houver workers/subagentes, delegue apenas tarefas mecânicas como inventário, localização de referências, resumo de arquivos grandes ou boilerplate baseado em padrão confirmado.
7. Mantenha no agente principal decisões de design, comportamento, contrato público, concorrência, segurança e revisão final.
8. Implemente a mudança com diff focado.
9. Adicione ou atualize testes que comprovem o comportamento pedido e protejam a regressão relevante.
10. Atualize `CHANGELOG.md` em `Unreleased` quando houver impacto relevante para consumidores.
11. Execute a baseline de validação definida em `AGENTS.md` e qualquer validação adicional exigida pelo tipo de mudança.
12. Revise o diff completo procurando escopo acidental, arquivos gerados, alterações de API não intencionais e validações enfraquecidas.
13. Faça uma conferência final do DoD item a item e marque cada requisito como comprovado, bloqueado ou não aplicável.

# Combinação com outras skills

Use como skill de orquestração e combine quando necessário:

- `dotnet-library-change` para mudança funcional/técnica;
- `dotnet-refactoring-engineer` quando uma refatoração for necessária e comportamento precisar ser preservado;
- `coverage-analysis` quando cobertura for requisito ou houver risco sem proteção adequada;
- `test-anti-patterns` quando a issue tocar qualidade de testes;
- `ci-release-governance` quando houver mudança em CI, packaging ou release;
- `dotnet-security-review` quando houver superfície de segurança relevante.

# Validação mínima

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Adicione `dotnet pack` e `scripts/verify-package.cs` quando a alteração afetar API pública, metadados, símbolos ou empacotamento.

# Restrições

- Não invente requisito ausente na issue apenas para tornar a solução mais abrangente.
- Não faça refatoração oportunista fora da área necessária.
- Não altere testes para esconder falha de comportamento.
- Não reduza warnings, segurança, auditoria, cobertura ou quality gates para concluir o DoD.
- Não faça breaking change incidental.
- Não faça push, abra PR, publique pacote ou release sem solicitação explícita.

# Saída esperada

Ao concluir, informe de forma objetiva:

1. o que foi alterado;
2. quais arquivos principais foram tocados;
3. quais testes/validações foram executados;
4. o estado de cada item do DoD;
5. riscos, limitações ou bloqueios restantes.

# Critério de qualidade

Uma boa implementação satisfaz o DoD com o menor diff coerente, possui evidência de teste proporcional ao risco, preserva contratos não envolvidos e passa pelos gates determinísticos aplicáveis.
