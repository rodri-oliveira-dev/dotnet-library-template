---
name: ci-release-governance
description: Use esta skill para revisar ou ajustar GitHub Actions, packaging, segurança de automação, versionamento e fluxo de release desta biblioteca .NET. Não use para mudanças funcionais em código de produção ou testes sem impacto no pipeline.
license: MIT
---

# Objetivo

Orientar mudanças em CI/CD, packaging, versionamento e release com segurança, rastreabilidade e aderência aos workflows que realmente existem no repositório.

# Regra principal

Antes de assumir qualquer automação, inspecione `.github/workflows/`.

Não declare como existente uma automação se o arquivo correspondente não estiver presente na árvore atual. Quando `release.yml` existir, trate-o como fonte de verdade para triggers, versionamento de release, autenticação, guardas e ordem de publicação. Para builds locais, trate `VersionPrefix` em `Directory.Build.props` como a fonte de versão base.

# Quando usar

- Alterar ou revisar arquivos em `.github/workflows/`.
- Ajustar restore, build, test, coverage ou pack no CI.
- Alterar `VersionPrefix`, regras SemVer ou metadata de assembly/pacote.
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
2. Identifique trigger, permissões, comandos, credenciais, artifacts e fonte de versão do fluxo afetado.
3. Compare a automação com os comandos oficiais da baseline.
4. Preserve restore reproduzível com `--locked-mode`.
5. Preserve build e testes antes de packaging/publicação.
6. Use permissões mínimas; não utilize `write-all`.
7. Nunca coloque secret, token ou API key de longa duração em arquivo versionado.
8. Para NuGet.org, preserve Trusted Publishing/OIDC quando `release.yml` usar `NuGet/login@v1`; não substitua por chave persistente sem requisito explícito e justificativa.
9. Preserve `VersionPrefix=1.0.0` em `Directory.Build.props` como versão base enquanto essa for a baseline vigente; não duplique propriedades de versão nos `.csproj`.
10. Preserve a validação SemVer e a correspondência entre tag, `Version`, metadata de assembly e versão do pacote.
11. Em release, use a tag como fonte de verdade e preserve `Version` como único override MSBuild; não reintroduza um `PackageVersion` concorrente sem necessidade comprovada.
12. Preserve a guarda que impede a identidade placeholder da biblioteca de ser publicada.
13. Em release manual, preserve a ordem `validate/build/test/pack/verify -> create tag -> external publication -> GitHub Release`; a tag deve apontar exatamente para o SHA validado.
14. Restrinja release manual à branch `main` e rejeite colisão de tag antes do build, com nova checagem imediatamente antes de criar a tag.
15. Trate `NUGET_USER` como Repository Variable opcional que habilita somente a publicação NuGet; sua ausência não deve impedir a tag nem o GitHub Release.
16. Garanta que falha de autenticação/publicação NuGet impeça a criação do GitHub Release quando a publicação NuGet estiver habilitada.
17. Revise se mudanças no template devem ou não existir também no projeto gerado.
18. Atualize documentação quando o fluxo oficial mudar.
19. Valide sintaxe, comandos, versão resolvida e consistência do diff antes de concluir.

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

Quando houver contexto Git e a automação precisar provar Source Link e a versão base:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version 1.0.0
```

Para validar a versão exata de um pacote de release:

```bash
dotnet run --file scripts/verify-package.cs -- artifacts/packages \
  --require-source-link \
  --expected-version <versao>
```

O verificador deve confirmar versão NuGet e metadata de assembly (`AssemblyVersion`, `FileVersion` e `InformationalVersion`) conforme as convenções .NET/SemVer.

# Versionamento

- A versão base atual é `1.0.0`, declarada uma única vez em `Directory.Build.props` via `VersionPrefix`.
- Builds locais sem override usam `1.0.0`.
- Releases usam tags `vMAJOR.MINOR.PATCH[-prerelease]` como fonte de verdade.
- Em `workflow_dispatch`, a versão informada é validada antes do build e a tag correspondente só é criada depois de todas as validações locais do release passarem.
- Em push de tag, a tag já existente deve resolver para o mesmo SHA validado pelo workflow.
- `release.yml` remove o prefixo `v` e passa o valor via `-p:Version`.
- `PackageVersion` deve ser derivado do mesmo `Version`, não mantido como segunda fonte independente.
- Prerelease mantém o identificador completo em `InformationalVersion`, enquanto `AssemblyVersion`/`FileVersion` usam a parte numérica conforme convenção do SDK.
- Mudança relevante em versionamento deve passar `.github/workflows/versioning-validation.yml` e provar stable, prerelease e mismatch.

# Segurança e release

- Permissões de escrita devem existir somente onde forem necessárias.
- Pull requests não devem receber acesso desnecessário a credenciais.
- Falha de restore, build, testes, pack ou validação do pacote deve impedir a criação de uma tag manual e qualquer publicação externa.
- A versão publicada deve ser derivada de uma fonte explícita e validada pelo workflow.
- O workflow de release suporta tanto `workflow_dispatch` em `main` quanto tags `vMAJOR.MINOR.PATCH[-prerelease]` já enviadas.
- `workflow_dispatch` é um release real: valida a versão, rejeita tag existente, valida o commit e só então cria a tag no SHA validado.
- O job de criação/verificação da tag recebe `contents: write`; outros jobs devem manter permissões menores quando possível.
- NuGet.org usa Trusted Publishing: `id-token: write` fica restrito ao job de publicação e `NUGET_USER` identifica o perfil do nuget.org e habilita esse caminho.
- `NUGET_USER` é uma Repository Variable opcional em **Settings → Secrets and variables → Actions → Variables**. Não deve ser tratado como secret nem receber valor fictício para repositórios que não publicam no NuGet.
- Sem `NUGET_USER`, `NuGet/login` e `dotnet nuget push` ficam desabilitados, mas a tag e o GitHub Release continuam permitidos.
- Quando NuGet estiver habilitado, falha no login/push deve impedir o GitHub Release para não anunciar uma distribuição NuGet incompleta.
- `contents: write` do GitHub Release permanece restrito ao job que cria a release.
- O workflow resolve `PackageId` antes da publicação e bloqueia publicação quando ele ainda corresponde à identidade placeholder do source template.
- A identidade placeholder é construída em partes no script do workflow para não ser substituída pelo template engine; assim projetos gerados recebem sua identidade real e ficam aptos a publicar.
- O source template pode criar tag e GitHub Release, mas não deve publicar nem anexar o pacote placeholder.
- Não publique pacote com identidade placeholder ou metadados não revisados.
- Não contorne a guarda `safe-to-publish` para fazer um job passar.

# Restrições

- Não executar `dotnet nuget push`, criar tag, criar GitHub Release ou publicar artifacts externos sem pedido explícito.
- Não ampliar permissões apenas por conveniência.
- Não remover checks, auditoria ou testes para reduzir tempo de CI sem justificativa técnica.
- Não substituir credenciais OIDC temporárias por `NUGET_API_KEY` persistente apenas por familiaridade.
- Não manter duas fontes de versão editáveis para o mesmo release.
- Não assumir que Trusted Publishing policies, repository variables, environments, rulesets ou demais configurações administrativas são copiadas pelo GitHub Template Repository.

# Critério de qualidade

Uma boa mudança de automação reproduz os comandos suportados localmente, usa permissões mínimas, mantém uma única fonte de versão por contexto, cria a tag somente para um SHA que passou pelas validações do release, separa GitHub Release de opt-in NuGet, publica pacote somente a partir de uma identidade não-placeholder, falha de forma diagnóstica e documenta apenas capacidades realmente presentes no repositório.
