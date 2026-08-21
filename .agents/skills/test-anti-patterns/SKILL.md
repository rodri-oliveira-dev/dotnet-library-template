---
name: test-anti-patterns
description: Use esta skill para auditar qualidade dos testes desta biblioteca .NET, encontrando asserts fracos, ausência de asserts, flakiness, over-mocking, acoplamento à implementação, dependência de ordem e cobertura artificial. Não use para migrar framework de testes ou escrever uma suite inteira do zero.
license: MIT
---

# Objetivo

Aumentar a confiança, o diagnóstico e a manutenibilidade dos testes automatizados sem confundir quantidade de testes com qualidade.

A baseline utiliza xUnit v3 sobre Microsoft Testing Platform, AwesomeAssertions e NSubstitute. Preserve essa stack salvo pedido explícito de mudança.

# Quando usar

- O pedido for auditoria ou revisão da qualidade dos testes.
- Testes passarem, mas oferecerem pouca confiança.
- Houver flakiness, sleeps, estado global ou dependência de ordem.
- Houver suspeita de over-mocking ou asserts frágeis.
- Um PR alterar testes de forma ampla.
- Cobertura parecer artificialmente alta.

# Quando não usar

- Escrever testes novos do zero sem foco em auditoria.
- Medir cobertura sem avaliar a qualidade dos cenários: use `coverage-analysis`.
- Migrar xUnit, Microsoft Testing Platform ou bibliotecas de assertion/mock.
- Corrigir código de produção sem relação com qualidade dos testes.

# Anti-patterns críticos

## Sem assert significativo

O teste executa código, mas não verifica resultado, estado, exceção ou outro efeito observável relevante.

## Assert tautológico

O teste replica a implementação, compara um valor com ele mesmo ou valida somente o comportamento configurado no próprio mock sem exercitar regra de produção.

Testes de fumaça de infraestrutura podem ser intencionalmente estreitos, mas não devem ser usados como substitutos de testes comportamentais.

## Coverage touching

O teste chama métodos apenas para executar linhas e elevar cobertura, sem verificar comportamento relevante.

## Assert fraco demais

Exemplo: verificar apenas `NotNull` quando o contrato real exige conteúdo, estado ou transformação específica.

## Over-mocking

O teste substitui dependências demais e passa a validar configuração de mocks em vez do comportamento da unidade.

## Acoplamento à implementação

O teste quebra por rename interno, ordem irrelevante de chamadas, detalhes privados ou estrutura que não faz parte do contrato observável.

## Flakiness

O teste depende de sleeps arbitrários, horário real, ordem de execução, estado global, rede externa ou outro recurso não controlado.

## Dados mágicos

Valores importantes aparecem sem intenção clara ou sem relação explícita com o cenário testado.

# Processo

1. Identifique o comportamento que o teste deveria proteger.
2. Leia o código de produção relacionado quando necessário.
3. Classifique achados por severidade e risco de falso positivo/falso negativo.
4. Separe problema de teste de problema de design no código de produção.
5. Sugira o menor ajuste seguro para cada achado.
6. Combine com `coverage-analysis` quando o problema também envolver gaps de cobertura.
7. Execute a suite afetada e, ao final, a validação baseline quando houver alteração.

# Regras

- Não altere testes apenas para fazê-los passar.
- Não remova asserts ou cenários para reduzir flakiness sem corrigir a causa.
- Não torne código de produção público apenas para testar.
- Não introduza sleeps arbitrários.
- Não crie dependência de ordem entre testes.
- Não adicione infraestrutura externa quando um teste determinístico mais simples cobrir o risco.

# Validação

```bash
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

# Critério de qualidade

Um teste bom deixa claro qual comportamento protege, prepara dados intencionais, executa uma ação observável e verifica o resultado ou efeito com asserts relevantes.
