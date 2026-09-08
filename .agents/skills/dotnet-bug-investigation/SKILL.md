---
name: dotnet-bug-investigation
description: Use esta skill para investigar bugs, regressões, falhas de teste ou comportamento inesperado em uma biblioteca .NET quando a causa ainda não é conhecida. Priorize evidência, reprodução e teste de regressão antes da correção. Não use para feature nova com requisitos já definidos.
license: MIT
---

# Objetivo

Encontrar a causa raiz com o menor contexto necessário, corrigir o comportamento sem mascarar sintomas e deixar evidência de regressão quando tecnicamente viável.

# Princípios

1. Evidência antes de hipótese.
2. Reprodução antes de correção, quando possível.
3. Causa raiz antes de workaround.
4. Teste de regressão antes ou junto da correção.
5. Mudança mínima e observável.

# Processo

1. Leia `AGENTS.md` e registre sintoma, ambiente, entrada, saída esperada e saída real.
2. Localize símbolos, testes e configurações associados ao sintoma antes de expandir arquivos grandes.
3. Reproduza com o menor comando ou teste possível.
4. Separe fatos de hipóteses e descarte hipóteses com evidência.
5. Delegue somente coleta mecânica de evidências quando houver workers/subagentes; mantenha o raciocínio de causa raiz no agente principal.
6. Verifique se a falha é regressão, comportamento já existente, configuração incorreta ou lacuna de teste.
7. Adicione teste que falhe pelo motivo correto antes da correção quando o cenário for automatizável.
8. Implemente a menor correção que ataque a causa raiz.
9. Execute primeiro a validação direcionada e depois a baseline definida em `AGENTS.md`.
10. Revise o diff procurando mecanismos que apenas escondam o sintoma.

# Áreas de atenção

- Em concorrência/estado, procure race conditions, falta de atomicidade e suposições de ordem; não adicione lock, retry ou delay sem demonstrar a causa.
- Em compatibilidade/API, preserve contratos não envolvidos e trate mudança pública como breaking change deliberado.
- Em dependências/configuração, confirme versões em `Directory.Packages.props` e diferencie falha do código de falha do ambiente/toolchain.

# Restrições específicas

- Não ajuste asserts para aceitar comportamento incorreto.
- Não engula exceções para fazer testes passarem.
- Não adicione retry, timeout maior ou sleep sem evidência.
- Não confunda correlação com causa raiz.

As demais restrições e validações globais são definidas em `AGENTS.md`.

# Saída esperada

Relate sintoma/evidência, causa raiz, correção, teste de regressão, validações executadas e riscos restantes.

# Critério de qualidade

Uma boa correção explica por que o bug acontecia, altera o mínimo necessário e impede a regressão sem enfraquecer a baseline.
