---
name: coverage-analysis
description: Use esta skill para analisar cobertura de testes desta biblioteca .NET, identificar gaps relevantes e priorizar testes por risco. Não use para inflar percentual, reduzir qualidade de asserts ou instalar ferramentas sem necessidade concreta.
license: MIT
---

# Objetivo

Usar cobertura como sinal de risco, não como objetivo isolado. A análise deve priorizar comportamento público, complexidade, frequência de mudança e impacto de regressão.

# Quando usar

- O pedido mencionar coverage, cobertura, gaps, hotspots ou risco de refatoração.
- Uma mudança atingir código pouco exercitado por testes.
- For necessário decidir quais cenários testar primeiro.
- A cobertura existir, mas não estiver claro se os testes oferecem confiança suficiente.

# Quando não usar

- Escrever testes novos sem análise de cobertura.
- Corrigir falha funcional de teste sem relação com cobertura.
- Rodar testes apenas para validar build.
- Instalar ferramenta nova quando a baseline existente já coleta cobertura.

# Regras obrigatórias

- Não altere testes apenas para aumentar percentual.
- Não aceite teste sem assert significativo como melhoria real de cobertura.
- Não reduza threshold ou validação para contornar falha sem instrução explícita.
- Não adicione pacote ou ferramenta sem consumidor real.
- Não substitua análise de risco por ranking puramente numérico.
- Considere API pública, branches, tratamento de erro, invariantes e caminhos de compatibilidade.

# Fonte de cobertura

A baseline coleta cobertura com Coverlet sobre Microsoft Testing Platform:

```bash
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

Use o relatório Cobertura produzido por esse comando quando precisar de linhas/branches não exercitadas.

# Processo

1. Leia `AGENTS.md` e identifique o comportamento que deveria estar protegido.
2. Execute ou utilize o relatório de cobertura existente.
3. Relacione gaps de cobertura ao código de produção correspondente.
4. Classifique por risco:
   - alto: API pública, regras, branches complexos, validações, erros e compatibilidade;
   - médio: transformação ou coordenação com comportamento observável;
   - baixo: boilerplate, glue code trivial, configuração declarativa ou código gerado.
5. Diferencie ausência de cobertura de cobertura superficial.
6. Sugira testes por comportamento e cenário, não por linha isolada.
7. Se houver mudança de teste, valide a suite completa.

# Saída esperada

- Hotspots priorizados por risco.
- Explicação do comportamento não protegido.
- Separação entre gap aceitável e gap perigoso.
- Cenários de teste recomendados com motivo.
- Validações executadas ou bloqueios encontrados.

# Validação

Após ajustes em testes:

```bash
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet test --configuration Release --no-build --coverlet --coverlet-output-format cobertura
```

# Critério de qualidade

O resultado é bom quando reduz risco real de regressão e melhora a confiança nos comportamentos relevantes, mesmo que o percentual global mude pouco.
