---
name: dotnet-refactoring-engineer
description: Use esta skill para revisar ou refatorar código C#/.NET com foco em legibilidade, coesão, testabilidade, segurança e manutenção, preservando comportamento observável e API pública. Não use para reescrever código apenas por preferência estética.
license: MIT
---

# Objetivo

Apoiar refatorações seguras e incrementais em uma biblioteca .NET sem introduzir mudanças funcionais ou breaking changes acidentais.

# Princípios

1. Entenda o comportamento atual antes de alterar.
2. Identifique o problema técnico concreto.
3. Prefira mudanças pequenas e verificáveis.
4. Preserve comportamento observável e contratos públicos.
5. Não introduza abstrações, patterns ou camadas sem benefício comprovado.
6. Não misture refatoração estrutural com mudança funcional sem necessidade explícita.

# Quando usar

- Redução de duplicação real.
- Melhoria de nomes, responsabilidades, coesão ou acoplamento.
- Simplificação de fluxo ou estrutura de código.
- Preparação segura para uma mudança posterior.
- Melhoria de testabilidade sem ampliar desnecessariamente a API pública.

# Quando não usar

- Mudança funcional explícita: use `dotnet-library-change` como skill principal.
- Atualização de pacote sem refatoração de código.
- Mudança apenas documental.
- Aplicação cerimonial de padrões sem problema concreto.

# Processo

1. Leia `AGENTS.md`, o código alvo e os testes relacionados.
2. Defina qual problema a refatoração resolve.
3. Identifique o contrato observável que deve permanecer estável.
4. Verifique cobertura e testes existentes antes de alterar código de maior risco.
5. Aplique o menor refactor que produza ganho claro.
6. Evite alterar nomes ou assinaturas públicas salvo necessidade explícita.
7. Atualize testes somente quando necessário para preservar ou esclarecer comportamento.
8. Revise o diff procurando mudança funcional não intencional.
9. Execute a validação baseline.

# Checklist

- O comportamento atual foi entendido?
- O ganho da refatoração é concreto?
- A API pública permaneceu compatível?
- O diff está restrito ao problema identificado?
- Foram evitadas novas abstrações desnecessárias?
- Os testes continuam protegendo o comportamento relevante?
- Nenhuma dependência nova foi adicionada sem necessidade?

# Validação

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Se a área refatorada tiver risco relevante e a tarefa envolver cobertura, combine com `coverage-analysis`.

# Restrições

- Não torne método, propriedade ou tipo público apenas para testar.
- Não altere comportamento para simplificar a implementação sem pedido explícito.
- Não introduza dependências ou framework adicional para resolver um problema local de design.
- Não faça formatação ampla ou rename fora do escopo.
- Não remova testes para facilitar a refatoração.

# Critério de qualidade

Uma boa refatoração reduz complexidade ou melhora clareza sem alterar o contrato observável, mantém o diff focado e continua validada por build e testes.
