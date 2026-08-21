---
name: ci-release-governance
description: Use esta skill para revisar ou ajustar GitHub Actions, packaging, segurança de automação e fluxo de release desta biblioteca .NET. Não use para mudanças funcionais em código de produção ou testes sem impacto no pipeline.
license: MIT
---

# Objetivo

Orientar mudanças em CI/CD, packaging e release com segurança, rastreabilidade e aderência aos workflows que realmente existem no repositório.

# Regra principal

Antes de assumir qualquer automação, inspecione `.github/workflows/`.

Não declare como existente um workflow de release, publicação, CodeQL, Dependency Review ou outra automação se o arquivo correspondente não estiver presente na árvore atual. Se um fluxo ainda não existir, limite-se à análise de prontidão ou crie-o somente quando a tarefa pedir explicitamente.

# Quando usar

- Alterar ou revisar arquivos em `.github/workflows/`.
- Ajustar restore, build, test, coverage ou pack no CI.
- Revisar permissões de `GITHUB_TOKEN`, triggers, concurrency ou artifacts.
- Avaliar criação ou alteração de release/publicação de pacote.
- Revisar segurança de secrets e publicação NuGet.
- Alinhar documentação com comportamento real da automação.

# Quando não usar

- Mudanças funcionais em `/src` sem impacto em CI.
- Testes unitários sem mudança de pipeline.
- Refatorações de código sem impacto em packaging ou automação.
- Executar publicação, release ou deploy real sem solicitação explícita.

# Processo

1. Leia `AGENTS.md` e liste os workflows existentes.
2. Identifique trigger, permissões, comandos, secrets e artifacts do fluxo afetado.
3. Compare a automação com os comandos oficiais da baseline.
4. Preserve restore reproduzível com `--locked-mode`.
5. Preserve build e testes antes de packaging/publicação.
6. Use permissões mínimas; não utilize `write-all`.
7. Nunca coloque secret, token ou API key em arquivo versionado.
8. Se existir workflow de release, siga seus triggers, versão e secret reais; não invente nomes alternativos.
9. Se não existir workflow de release, não afirme que releases são automáticas e não introduza publicação real fora do escopo.
10. Revise se mudanças no template devem ou não existir também no projeto gerado.
11. Atualize documentação quando o fluxo oficial mudar.
12. Valide sintaxe, comandos e consistência do diff antes de concluir.

# Comandos baseline

Para mudanças que afetem o pipeline de build/test/package:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet pack --configuration Release --no-build --output artifacts/packages
```

Quando houver contexto Git e a automação precisar provar Source Link:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages --require-source-link
```

# Segurança e release

- Permissões de escrita devem existir somente onde forem necessárias.
- Pull requests não devem receber acesso desnecessário a secrets.
- Falha de restore, build ou testes deve impedir packaging/publicação quando o fluxo de release existir.
- A versão publicada deve ser derivada de uma fonte explícita e validada pelo workflow existente.
- Não publique pacote com identidade placeholder ou metadados não revisados.
- Não contorne uma guarda de segurança para fazer um job passar.

# Restrições

- Não executar `dotnet nuget push`, criar GitHub Release ou publicar artifacts externos sem pedido explícito.
- Não ampliar permissões apenas por conveniência.
- Não remover checks, auditoria ou testes para reduzir tempo de CI sem justificativa técnica.
- Não assumir que configurações administrativas, secrets, environments ou rulesets são copiados pelo GitHub Template Repository.

# Critério de qualidade

Uma boa mudança de automação reproduz os comandos suportados localmente, usa permissões mínimas, falha de forma diagnóstica e documenta apenas capacidades realmente presentes no repositório.
