---
name: dotnet-library-change
description: Use esta skill ao alterar código de produção, contratos públicos, configuração de projeto, dependências ou testes relacionados desta biblioteca .NET. Não use para CI/CD puro, auditoria de cobertura isolada ou refatoração sem mudança funcional.
license: MIT
---

# Objetivo

Orientar mudanças pequenas e seguras em bibliotecas .NET, preservando a baseline de build, testes, empacotamento e compatibilidade pública.

# Quando usar

- Alterações em código sob `/src`.
- Mudanças comportamentais que exigem atualização de testes em `/tests`.
- Ajustes em `.csproj`, PackageId, metadados NuGet ou documentação XML.
- Inclusão, remoção ou atualização de dependências.
- Mudanças em tipos ou membros públicos.

# Quando não usar

- Refatoração puramente estrutural sem mudança funcional: use `dotnet-refactoring-engineer`.
- Auditoria de cobertura: use `coverage-analysis`.
- Auditoria de qualidade dos testes: use `test-anti-patterns`.
- Mudanças apenas em workflows ou release: use `ci-release-governance`.

# Processo

1. Leia `AGENTS.md` e os arquivos diretamente relacionados à mudança.
2. Identifique o projeto de produção e os testes correspondentes.
3. Verifique se a mudança altera comportamento observável ou API pública.
4. Escolha o menor ajuste coerente com os padrões existentes.
5. Atualize ou adicione testes para mudanças comportamentais.
6. Para dependências, altere versões somente em `Directory.Packages.props` e regenere lock files por restore.
7. Atualize `CHANGELOG.md` se houver impacto relevante para consumidores.
8. Se a mudança afetar empacotamento ou contrato público, valide o pacote.
9. Revise o diff e remova alterações não relacionadas.

# Validação

Baseline a partir da raiz:

```bash
dotnet tool restore
dotnet restore --locked-mode
dotnet format --verify-no-changes --no-restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Para mudanças de dependência, regenere antes os lock files:

```bash
dotnet restore --force-evaluate
dotnet restore --locked-mode
```

Para mudanças em API pública, metadados ou packaging:

```bash
dotnet pack --configuration Release --no-build --output artifacts/packages
dotnet run --file scripts/verify-package.cs -- artifacts/packages
```

# Restrições

- Não adicione `Version=` em `PackageReference`.
- Não edite `packages.lock.json` manualmente.
- Não transforme membros internos em públicos apenas para facilitar testes.
- Não introduza dependência de domínio, infraestrutura ou framework sem necessidade reutilizável clara.
- Não quebre API pública de forma incidental.
- Não reduza warnings, testes, auditoria ou validações para contornar falhas.
- Não faça push, release ou publicação sem solicitação explícita.

# Critério de qualidade

Uma boa mudança resolve o problema com diff limitado, preserva contratos não envolvidos, possui testes proporcionais ao risco e deixa restore, build, test e packaging coerentes com a baseline.
