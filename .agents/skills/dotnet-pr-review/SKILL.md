---
name: dotnet-pr-review
description: Use esta skill para revisar um Pull Request ou diff de biblioteca .NET com foco em corretude, regressões, compatibilidade, testes, performance, segurança e manutenção. Não use para implementar mudanças no PR sem solicitação explícita.
license: MIT
---

# Objetivo

Revisar alterações com foco em risco real e comportamento observável, produzindo apontamentos acionáveis e evitando comentários cosméticos sem impacto técnico.

# Processo

1. Leia `AGENTS.md`, a descrição do PR e a issue relacionada quando disponível.
2. Entenda o objetivo e o comportamento esperado antes de avaliar a implementação.
3. Revise primeiro o diff. Expanda para arquivos completos apenas quando o contexto do trecho for insuficiente.
4. Para arquivos grandes, localize símbolos e dependências relevantes antes de carregar conteúdo adicional.
5. Classifique a revisão por áreas de risco:
   - corretude funcional;
   - API pública/compatibilidade;
   - concorrência e estado;
   - performance/alocações/I/O;
   - segurança;
   - dependências e restore;
   - testes e cobertura;
   - CI, packaging e release;
   - manutenção e clareza.
6. Quando houver workers/subagentes, delegue inventário do diff, localização de referências, resumo de arquivos grandes e busca de testes relacionados.
7. Mantenha no agente principal a decisão de severidade, validade do comportamento, impacto arquitetural, segurança e conclusão final.
8. Para cada problema encontrado, confirme que ele é introduzido ou exposto pelo diff e explique o cenário concreto de falha.
9. Verifique se os testes cobrem o novo comportamento e se não foram alterados apenas para aceitar uma regressão.
10. Se o ambiente permitir, execute validações direcionadas e a baseline pertinente. Não trate leitura do diff como substituta de build/test/scanners.
11. Revise o conjunto final de alterações para detectar escopo acidental, arquivos gerados, mudança de dependência não explicada ou alteração pública sem changelog/documentação.

# Severidade sugerida

- **P0 — Blocker:** risco imediato de perda de dados, falha de segurança crítica, pacote inutilizável ou quebra ampla inevitável.
- **P1 — High:** bug funcional provável, breaking change não intencional, falha de concorrência, vulnerabilidade relevante ou release incorreto.
- **P2 — Medium:** defeito real em cenário limitado, manutenção perigosa, teste insuficiente para comportamento relevante ou risco de performance significativo.
- **P3 — Low:** melhoria válida e objetiva, sem bloquear o merge por si só.

Não use severidade alta para preferências de estilo já cobertas por `.editorconfig`, analyzers ou `dotnet format`.

# Checklist de revisão

- O diff resolve o problema descrito?
- Existe comportamento incorreto em edge cases plausíveis?
- A API pública mudou? A mudança é compatível e deliberada?
- Há estado compartilhado, concorrência ou ordem de execução nova?
- Houve nova alocação, I/O, reflexão ou caminho quente relevante?
- Entradas não confiáveis são validadas adequadamente?
- Dependências novas são necessárias e centralizadas?
- Testes falhariam se a implementação estivesse errada?
- Quality gates foram mantidos ou fortalecidos?
- `CHANGELOG.md`/documentação precisam de atualização?

# Formato de apontamento

Cada finding deve conter:

1. severidade;
2. arquivo/trecho afetado;
3. comportamento problemático;
4. cenário em que falha;
5. correção esperada ou direção objetiva.

Evite apontamentos especulativos sem cenário reproduzível ou relação clara com o diff.

# Restrições

- Não reescreva o PR por preferência pessoal.
- Não exija abstrações ou patterns sem problema concreto.
- Não marque como bug algo que já existia e não foi afetado pelo PR, salvo se a mudança aumentar materialmente o risco.
- Não aprove um PR apenas porque compila; build é evidência necessária, não suficiente.
- Não modifique arquivos, faça push ou merge sem solicitação explícita.

# Critério de qualidade

Uma boa revisão prioriza poucos problemas reais e acionáveis, explica impacto e cenário de falha, diferencia opinião de defeito e usa validação determinística como evidência sempre que possível.
