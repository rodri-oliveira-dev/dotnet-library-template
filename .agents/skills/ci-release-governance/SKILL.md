---
name: ci-release-governance
description: Use esta skill para revisar ou ajustar GitHub Actions, packaging, segurança de automação e fluxo de release desta biblioteca .NET. Não use para mudanças funcionais em código de produção ou testes sem impacto no pipeline.
license: MIT
---

# Objetivo

Orientar mudanças em CI/CD, packaging e release com segurança, rastreabilidade e aderência aos workflows que realmente existem no repositório.

# Regra principal

Antes de assumir qualquer automação, inspecione `.github/workflows/`.

Não declare como existente uma automação se o arquivo correspondente não estiver presente na árvore atual. Quando `release.yml` existir, trate-o como fonte de verdade para triggers, versionamento, autenticação, guardas e ordem de publicação.

# Quando usar

- Alterar ou revisar arquivos em `.github/workflows/`.
- Ajustar restore, build, test, coverage ou pack no CI.
- Revisar permissões de `GITHUB_TOKEN`, OIDC, triggers, concurrency ou artifacts.
- Avaliar criação ou alteração de release/publicação de pacote.
- Revisar segurança de credenciais e publicação NuGet.
- Alinhar documentação com comportamento real da automação.

# Quando não usar

- Mudanças funcionais em `/src` sem impacto em CI.
- Testes unitários sem mudança de pipeline.
- Refatorações de código sem impacto em packaging ou automação.
- Executar publicação, release ou deploy real sem solicitação explícita.

# Processo

1. Leia `AGENTS.md` e liste os workflows existentes.
2. Identifique trigger, permissões, comandos, credenciais e artifacts do fluxo afetado.
3. Compare a automação com os comandos oficiais da baseline.
4. Preserve restore reproduzível com `--locked-mode`.
5. Preserve build e testes antes de packaging/publicação.
6. Use permissões mínimas; não utilize `write-all`.
7. Nunca coloque secret, token ou API key de longa duração em arquivo versionado.
8. Para NuGet.org, preserve Trusted Publishing/OIDC quando `release.yml` usar `NuGet/login@v1`; não substitua por chave persistente sem requisito explícito e justificativa.
9. Preserve a validação SemVer e a correspondência entre tag e versão do pacote.
10. Preserve a guarda que impede a identidade placeholder da biblioteca de ser publicada.
11. Trate `workflow_dispatch` como dry-run quando assim definido pelo workflow; não transforme uma validação manual em publicação implícita.
12. Garanta que falha de autenticação/publicação NuGet impeça a criação do GitHub Release quando esse for o contrato vigente.
13. Revise se mudanças no template devem ou não existir também no projeto gerado.
14. Atualize documentação quando o fluxo oficial mudar.
15. Valide sintaxe, comandos e consistência do diff antes de concluir.

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

Para validar a versão exata de um pacote de release:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version <versao>
```

# Segurança e release

- Permissões de escrita devem existir somente onde forem necessárias.
- Pull requests não devem receber acesso desnecessário a credenciais.
- Falha de restore, build ou testes deve impedir packaging/publicação.
- A versão publicada deve ser derivada de uma fonte explícita e validada pelo workflow.
- O workflow de release atual usa tags `vMAJOR.MINOR.PATCH` (com prerelease opcional) para publicação real.
- `workflow_dispatch` existe para validar uma versão explicitamente informada, sem publicar.
- NuGet.org usa Trusted Publishing: `id-token: write` fica restrito ao job de publicação e `NUGET_USER` identifica o perfil do nuget.org.
- `contents: write` fica restrito ao job que cria o GitHub Release.
- O workflow resolve `PackageId` antes do build externo e bloqueia publicação quando ele ainda corresponde à identidade placeholder do source template.
- A identidade placeholder é construída em partes no script do workflow para não ser substituída pelo template engine; assim projetos gerados recebem sua identidade real e ficam aptos a publicar.
- Não publique pacote com identidade placeholder ou metadados não revisados.
- Não contorne a guarda `safe-to-publish` para fazer um job passar.

# Restrições

- Não executar `dotnet nuget push`, criar GitHub Release ou publicar artifacts externos sem pedido explícito.
- Não ampliar permissões apenas por conveniência.
- Não remover checks, auditoria ou testes para reduzir tempo de CI sem justificativa técnica.
- Não substituir credenciais OIDC temporárias por `NUGET_API_KEY` persistente apenas por familiaridade.
- Não assumir que Trusted Publishing policies, repository variables, environments, rulesets ou demais configurações administrativas são copiadas pelo GitHub Template Repository.

# Critério de qualidade

Uma boa mudança de automação reproduz os comandos suportados localmente, usa permissões mínimas, publica somente a partir de uma versão explícita e de uma identidade não-placeholder, falha de forma diagnóstica e documenta apenas capacidades realmente presentes no repositório.
