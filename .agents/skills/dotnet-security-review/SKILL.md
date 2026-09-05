---
name: dotnet-security-review
description: Use esta skill para revisar código, dependências, configuração e automação de uma biblioteca .NET sob a ótica de segurança. Combine revisão semântica com analyzers e scanners existentes; não trate esta skill como substituta de CodeQL, Dependency Review, NuGet Audit ou outros gates determinísticos.
license: MIT
---

# Objetivo

Identificar riscos de segurança relevantes sem gerar ruído excessivo, preservando menor privilégio, validação de entrada, integridade do supply chain e comportamento seguro por padrão.

# Princípios

1. Segurança é baseada em ameaça e contexto, não em checklist isolado.
2. Revisão semântica complementa scanners; não os substitui.
3. Findings precisam de vetor, impacto e cenário plausível.
4. Controles existentes não devem ser enfraquecidos por conveniência.

# Processo

1. Leia `AGENTS.md`, o objetivo da mudança e o diff/arquivos relacionados.
2. Identifique superfícies expostas: API pública, entradas externas, arquivos/paths, serialização, comandos/processos, rede, secrets, workflows e dependências.
3. Pesquise referências antes de expandir arquivos grandes.
4. Delegue somente inventário e busca mecânica quando houver workers/subagentes; mantenha a avaliação final de risco no agente principal.
5. Avalie somente categorias aplicáveis ao código real.
6. Confirme que analyzers, CodeQL, Dependency Review, NuGet Audit e demais gates relevantes permanecem habilitados.
7. Para cada risco, descreva pré-condição, vetor, impacto, evidência e mitigação.
8. Se houver correção, prefira eliminar a causa em vez de adicionar bypass ou suppression ampla.
9. Execute a baseline definida em `AGENTS.md` e scanners disponíveis quando o ambiente permitir.
10. Revise o diff final procurando secrets, permissões excessivas, dependências desnecessárias e controles removidos.

# Superfícies frequentes

Considere quando aplicável: validação/normalização de entrada, path traversal, command injection, serialização insegura, reflexão/carregamento dinâmico, exposição de dados sensíveis, criptografia/aleatoriedade, SSRF/rede, XML/XXE, ReDoS, limites exploráveis, dependências vulneráveis e supply chain de GitHub Actions.

Para workflows/release, combine com `ci-release-governance` e confirme permissões mínimas, actions pinadas por SHA, checkout read-only quando possível, ausência de credenciais persistentes, uso adequado de OIDC e falha fechada antes de publicação.

# Findings

- **Critical:** exploração plausível com impacto severo e ampla exposição.
- **High:** vulnerabilidade relevante ou controle essencial removido.
- **Medium:** risco concreto dependente de condições específicas.
- **Low:** hardening útil com impacto limitado.

# Restrições específicas

- Não exponha valores de secrets; reporte apenas localização e tipo.
- Não substitua correção por suppression ampla.
- Não trate ausência de mecanismo opcional como vulnerabilidade sem ameaça correspondente.

As demais restrições e validações globais são definidas em `AGENTS.md`.

# Critério de qualidade

Uma boa revisão produz poucos findings de alta confiança, conecta cada um a vetor e impacto reais e preserva os gates automáticos existentes.
