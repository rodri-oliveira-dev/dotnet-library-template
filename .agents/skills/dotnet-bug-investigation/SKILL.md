---
name: dotnet-bug-investigation
description: Use esta skill para investigar bugs, regressões, falhas de teste ou comportamento inesperado em uma biblioteca .NET quando a causa ainda não é conhecida. Priorize evidência, reprodução e teste de regressão antes da correção. Não use para feature nova com requisitos já definidos.
license: MIT
---

# Objetivo

Encontrar a causa raiz com o menor contexto necessário, corrigir o comportamento sem mascarar sintomas e deixar um teste que comprove a regressão quando tecnicamente viável.

# Princípios

1. Evidência antes de hipótese.
2. Reprodução antes de correção, quando possível.
3. Causa raiz antes de workaround.
4. Teste de regressão antes ou junto da correção.
5. Mudança mínima e observável.

# Processo

1. Leia `AGENTS.md` e registre o sintoma exato: mensagem, stack trace, entrada, saída esperada, saída real e ambiente relevante.
2. Localize primeiro os símbolos, testes e configurações associados ao sintoma. Evite abrir arquivos grandes sem localizar a área provável.
3. Tente reproduzir usando o menor comando ou teste possível.
4. Separe fatos confirmados de hipóteses. Mantenha poucas hipóteses concorrentes e descarte-as com evidência.
5. Quando houver workers/subagentes, delegue inventário de referências, busca de mudanças relacionadas, resumo de arquivos grandes e coleta de evidências mecânicas.
6. Mantenha no agente principal o raciocínio de causa raiz, especialmente para concorrência, estado compartilhado, API pública, segurança, serialização ou compatibilidade.
7. Verifique se a falha é regressão recente, comportamento já existente, configuração incorreta ou lacuna de teste.
8. Adicione um teste que falhe pelo motivo correto antes da correção, quando o cenário for reproduzível e automatizável.
9. Implemente a menor correção que ataque a causa raiz.
10. Execute primeiro o teste direcionado e depois a baseline completa definida em `AGENTS.md`.
11. Revise o diff procurando tratamento silencioso de erro, catches amplos, sleeps, retries arbitrários, desativação de analyzer ou qualquer mecanismo que apenas esconda o sintoma.
12. Documente a causa raiz e a evidência que confirma a correção.

# Áreas de atenção

Em bugs relacionados a concorrência ou estado:

- procure race conditions, uso incorreto de estado mutável, falta de atomicidade e suposições de ordem;
- não use `lock`, retry ou delay como correção automática sem demonstrar a condição de corrida;
- valide comportamento sob repetição quando fizer sentido.

Em bugs de compatibilidade/API:

- compare comportamento público antes/depois;
- preserve contratos não envolvidos;
- trate mudança de assinatura ou semântica como breaking change deliberado.

Em bugs de dependência/configuração:

- confirme versão e origem em `Directory.Packages.props` e lock files;
- não edite `packages.lock.json` manualmente;
- diferencie falha do código da biblioteca de falha do ambiente/toolchain.

# Validação mínima

Execute o teste direcionado da regressão e, em seguida:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

# Restrições

- Não ajuste asserts para aceitar o comportamento incorreto.
- Não engula exceções apenas para o teste passar.
- Não adicione retry, timeout maior ou sleep sem evidência de que isso representa o contrato correto.
- Não altere configuração global para compensar um bug local sem justificativa.
- Não confunda correlação com causa raiz.
- Não faça refatoração ampla durante uma correção pequena sem necessidade comprovada.

# Saída esperada

Relate:

1. sintoma reproduzido ou evidência disponível;
2. causa raiz;
3. correção aplicada;
4. teste de regressão adicionado/alterado;
5. validações executadas;
6. riscos ou cenários ainda não cobertos.

# Critério de qualidade

Uma boa correção explica por que o bug acontecia, contém evidência reproduzível, altera o mínimo necessário e impede a mesma regressão de reaparecer sem enfraquecer a baseline.
