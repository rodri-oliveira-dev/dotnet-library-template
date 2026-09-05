---
name: dotnet-security-review
description: Use esta skill para revisar código, dependências, configuração e automação de uma biblioteca .NET sob a ótica de segurança. Combine revisão semântica com analyzers e scanners existentes; não trate esta skill como substituta de CodeQL, Dependency Review, NuGet Audit ou outros gates determinísticos.
license: MIT
---

# Objetivo

Identificar riscos de segurança relevantes em mudanças de biblioteca .NET sem gerar ruído excessivo, preservando princípio do menor privilégio, validação de entrada, integridade do supply chain e comportamento seguro por padrão.

# Princípios

1. Segurança é baseada em ameaça e contexto, não em checklist isolado.
2. Revisão humana/agente complementa scanners; não os substitui.
3. Findings devem ter vetor, impacto e cenário plausível.
4. Não enfraqueça controles existentes para reduzir falsos positivos sem evidência e justificativa.

# Processo

1. Leia `AGENTS.md`, o objetivo da mudança e o diff/arquivos diretamente relacionados.
2. Identifique superfícies expostas: API pública, entrada externa, arquivos/paths, serialização, processos/comandos, rede, autenticação/autorização, secrets, workflows e dependências.
3. Pesquise referências antes de expandir arquivos grandes.
4. Quando houver workers/subagentes, delegue inventário de superfícies, localização de sinks/sources, dependências alteradas e resumo de workflows. Mantenha a avaliação final de risco no agente principal.
5. Avalie somente categorias aplicáveis ao código real.
6. Confirme se analyzers, CodeQL, Dependency Review, NuGet Audit e demais quality gates relevantes permanecem habilitados.
7. Para cada risco encontrado, descreva pré-condição, vetor, impacto, evidência no código e mitigação proposta.
8. Se houver correção, prefira eliminar a causa em vez de adicionar bypass, suppressions amplas ou validação superficial.
9. Execute a baseline de build/test e os scanners disponíveis quando o ambiente permitir.
10. Revise o diff final procurando secrets, permissões excessivas, dependências desnecessárias e controles removidos.

# Superfícies de revisão

Considere quando aplicável:

- validação e normalização de entrada;
- path traversal e manipulação de arquivos;
- command/process injection;
- serialização/deserialização insegura;
- uso inseguro de reflexão ou carregamento dinâmico;
- exposição acidental de dados sensíveis em logs/exceções;
- criptografia, hashing ou geração aleatória inadequados;
- SSRF, chamadas de rede e validação de destinos quando a biblioteca fizer I/O remoto;
- XML/XXE e parsers configuráveis;
- regex com risco de ReDoS em entrada não confiável;
- integer overflow, limites e validação de tamanho quando exploráveis;
- dependências vulneráveis ou desnecessárias;
- permissões de GitHub Actions e `GITHUB_TOKEN`;
- uso de secrets, OIDC e credenciais persistentes;
- actions não pinadas por SHA;
- execução de conteúdo de PR/fork em contexto privilegiado;
- integridade de packaging, Source Link e release.

# Supply chain e automação

Para mudanças em workflows ou release, combine com `ci-release-governance` e confirme:

- `permissions` mínimas por workflow/job;
- actions pinadas por SHA completo;
- checkout read-only quando escrita Git não for necessária;
- ausência de `write-all` e secrets hard-coded;
- Trusted Publishing/OIDC preservado quando aplicável;
- dependências restauradas em `--locked-mode`;
- falhas de build/test/pack/scanners impedindo publicação.

# Validação mínima

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Quando aplicável, confirme também os resultados dos workflows/scanners existentes, como CodeQL, Dependency Review, NuGet Audit e SonarQube Cloud configurado pelo repositório.

# Findings

Classifique apenas problemas acionáveis:

- **Critical:** exploração plausível com impacto severo e ampla exposição.
- **High:** vulnerabilidade relevante ou controle essencial removido.
- **Medium:** risco concreto dependente de condições específicas.
- **Low:** hardening útil com impacto limitado.

Não trate simples ausência de um mecanismo opcional como vulnerabilidade se não houver ameaça correspondente.

# Restrições

- Não exponha secrets encontrados em texto de saída; redija o valor e reporte apenas localização/tipo.
- Não substitua correção por suppression ampla de analyzer.
- Não reduza `NuGetAudit`, CodeQL, Dependency Review, warnings ou permissões de segurança para fazer a pipeline passar.
- Não introduza biblioteca de segurança/criptografia sem necessidade real e avaliação de manutenção.
- Não execute publicação, release ou ação destrutiva durante uma revisão.

# Critério de qualidade

Uma boa revisão de segurança produz poucos findings de alta confiança, conecta cada um a um vetor e impacto reais, preserva os gates automáticos e evita tanto falsos positivos genéricos quanto bypasses convenientes.
