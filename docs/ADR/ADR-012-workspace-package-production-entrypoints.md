# ADR-012: Workspace Package Production Entry-Point Mapping (`dist` vs `src`)

- **Status**: Proposed — pending Phase 10 governance approval (ECR-Phase10-0001 Amendment-0001)
- **Date**: 2026-08-19
- **Related Freeze**: `docs/ECR/PHASE10/ECR-Phase10-0001/AMENDMENT-0001-production-entrypoint-mapping.md`; ADR-008 (Freeze Policy); ADR-011 (Container Runtime Decisions); Stage 10.3 Implementation Plan

## Context

Phase 10 Stage 10.3 delivers production Docker images. The Stage 10.3 API Dockerfile builds all workspace packages (via `pnpm run build --filter=@aios/api --filter=@aios/api^...`) and then packages production dependencies with `pnpm deploy --prod --legacy`.

During Stage 10.3 runtime validation the API container fails to start with:

```
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is currently unsupported
for files under node_modules, for
"file:///app/node_modules/.pnpm/@aios+kernel@file+packages+kernel/node_modules/@aios/kernel/src/index.ts"
(Node.js v22.23.2)
```

## Problem

Four workspace packages declare their production entry points (the `main`/`types` fields) as **TypeScript source** (`src/index.ts`) instead of the **compiled artifact** (`dist/index.js` / `dist/index.d.ts`):

- `packages/kernel/package.json`
- `packages/agents/package.json`
- `packages/database/package.json`
- `packages/llm/package.json`

When `pnpm deploy --legacy` copies these workspace packages verbatim into `node_modules`, Node 22 resolves the package `main` to a `.ts` file **under `node_modules`** and rejects it — type stripping is unsupported for files under `node_modules`.

This is a **verified production defect** (Stage 10.3 Docker runtime gate) and falls under ADR-008 Freeze-Policy criterion #1 (verified defect) and criterion #2 (approved ECR authorization). The affected packages are frozen Phase 8/9 packages, so this is routed as an ECR amendment.

## Evidence

### Docker runtime failure (Stage 10.3 validation)
- `api` image: `docker compose build api` -> **passes** (compiles + `pnpm deploy` succeeds)
- `api` container: starts then **crashes on boot** -> `docker compose ps` shows `Restarting (1)`
- `docker logs aios-api`: `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` for `@aios/kernel/src/index.ts`

### Per-package inspection (individually verified — the four packages are NOT identical)

| Package | `type` | current `main` / `types` | build script | tsconfig `outDir`/`rootDir` | `dist/index.js` exists | `dist/index.d.ts` exists | dist is ESM (`.js`-ext imports) | `exports` field |
|---|---|---|---|---|---|---|---|---|
| `@aios/kernel` | `module` | `src/index.ts` | `tsc --build` | `dist` / `src` | ✅ | ✅ | ✅ | ❌ |
| `@aios/agents` | `module` | `src/index.ts` | `tsc --build` | `dist` / `src` | ✅ | ✅ | ✅ | ❌ |
| `@aios/database` | *(absent)* | `src/index.ts` | `tsc --project tsconfig.json` | `dist` / `src` | ✅ | ✅ | ✅ | ❌ |
| `@aios/llm` | `module` | `src/index.ts` | `tsc --build` | `dist` / `src` | ✅ | ✅ | ✅ | ❌ |

- All four compile to `dist/index.js` + `dist/index.d.ts` during the monorepo build (`pnpm build` 11/11 passes).
- The compiled `dist/index.js` files are ESM output using `.js`-extension relative imports (e.g. `@aios/kernel`: `export * from "./monitoring/GuardianObserver.js"`; `@aios/database`: `export { normalizeUnicodeText } from "./core/textEncoding.js"`).
- **`@aios/database` is the single non-identical case**: it lacks `"type": "module"`. Because its `dist/index.js` is ESM (`module: "ESNext"` in `tsconfig.base.json`), at runtime Node would treat it as CommonJS and fail on `export` syntax. It therefore requires `"type": "module"` as a companion field.

### Reference packages already correct

`@aios/shared`, `@muf/tbit-core`, `@aios/workflow` already expose `main`/`types` = `dist/*`; they are unaffected by this change and serve as precedent.

## Decision

Repoint the `main`/`types` fields of the four source-entry workspace packages to their compiled artifacts, and add the missing `"type": "module"` to `@aios/database` only.

### Exact before / after (package manifest fields)

**`packages/kernel/package.json`**
```diff
-  "main": "src/index.ts",
-  "types": "src/index.ts",
+  "main": "dist/index.js",
+  "types": "dist/index.d.ts",
```

**`packages/agents/package.json`**
```diff
-  "main": "src/index.ts",
-  "types": "src/index.ts",
+  "main": "dist/index.js",
+  "types": "dist/index.d.ts",
```

**`packages/llm/package.json`**
```diff
-  "main": "src/index.ts",
-  "types": "src/index.ts",
+  "main": "dist/index.js",
+  "types": "dist/index.d.ts",
```

**`packages/database/package.json`**
```diff
+  "type": "module",
-  "main": "src/index.ts",
-  "types": "src/index.ts",
+  "main": "dist/index.js",
+  "types": "dist/index.d.ts",
```

### Explicitly out of scope (NOT changed by this decision)
- Public package names (`@aios/kernel`, etc.) — unchanged.
- Kernel / T-Bit / database abstraction architecture — unchanged.
- Application source logic — unchanged.
- Multi-vault / Phase 11 functionality — not introduced.
- `exports`/`imports` maps — not added (would risk breaking existing deep imports; out of scope).
- Docker-specific manifest rewriting — rejected (see Alternatives).

## Development Impact

- **Vitest** (root `vitest.config.ts` + per-app configs) aliases `@aios/kernel` -> `packages/kernel/src`, `@aios/agents` -> `packages/agents/src`, etc. Unit/integration tests keep resolving **source** — unaffected.
- **tsx dev** (`apps/api` `"dev": "tsx watch src/main.ts"`) resolves `@aios/*` via source-aware resolution; compiled `dist` entry points also load fine under tsx — unaffected.
- **`tsc` typecheck** for `@aios/api` resolves `types` -> existing `dist/index.d.ts` — passes (declaration files are emitted by the composite build).
- **Local `pnpm build`** already emits `dist/`; no script changes required.
- **Conclusion**: no development-tooling regression. Dev-time `main: src/index.ts` was never a production-valid path and remains supported in-runner via source aliasing used by the tools.

## Production Impact

- Fixes the Stage 10.3 Docker runtime crash: `@aios/kernel` (first package loaded by `@aios/api`) will resolve `dist/index.js` and boot.
- Resolves the same latent defect in `@aios/agents`, `@aios/database`, `@aios/llm`, which would have crashed the same way once the loader reached them.
- Enables completion of all remaining Stage 10.3 runtime gates (health, livez, readyz, web, proxy, headers, CSP, non-root UID, /data, T-Bit persistence, healthchecks, restart).

## Compatibility Analysis

- **Consumers importing `@aios/kernel` / `@aios/agents` / `@aios/database` / `@aios/llm`** by bare specifier get the same public exports (barrels are unchanged; only the file Node loads changes from source to compiled).
- **`@aios/database` `"type":"module"`** addition brings it in line with `@aios/kernel`/`@aios/agents`/`@aios/llm` (all already `module`) and with its own ESM `dist` output — required for correct runtime classification.
- **`pnpm deploy` inclusion of gitignored `dist/`**: `dist/` is gitignored and excluded by `.dockerignore`, but it is regenerated inside the builder stage (`pnpm run build`). The build already proved `pnpm deploy` succeeds; **the make-or-break validation step is to confirm the *deployed* package contains `dist/index.js` at runtime** (see Validation).
- **`@aios/web`** builds via Vite (bundler resolves `main`/source at build time) and serves static files at runtime — this change has no runtime effect on web.

## Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| Docker build step that rewrites the four manifests to `dist` before `pnpm deploy` | Violates the explicit constraint "no Docker-specific manifest rewriting"; obscures the real repo defect; not reproducible outside Docker |
| Copy built `dist/` into the pnpm store via `COPY` | Fragile; duplicates packaging logic; breaks the single-source-of-truth for entry points |
| Add `"exports"` maps to each package | Out of scope; could break existing deep imports; larger surface than needed to fix the defect |
| Enable Node type-stripping for `node_modules` | Not a supported Node 22 configuration; masks the underlying packaging defect |
| Do nothing (leave `main: src/index.ts`) | Stage 10.3 Docker runtime stays BLOCKED (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`) |

## Rollback

- **Revert** the four `package.json` field changes to their committed `src/index.ts` values (and remove the `"type":"module"` line from `@aios/database`).
- Because no application source, public names, or architecture change, rollback is a trivial manifest-only revert; no data migration, no schema change.
- `dist/` artifacts are regenerated by the normal `pnpm build` and are gitignored — no repository pollution.

## Validation

1. `pnpm --filter @aios/api typecheck` — passes.
2. `pnpm build` — 11/11 tasks successful (dist regenerated).
3. `pnpm typecheck` — 10/10 tasks successful.
4. `pnpm test` — 18/18 task groups; `@aios/api` 29 passing.
5. `pnpm test:integration` (8/8) and `pnpm test:secret` (10/10).
6. `pnpm --filter @aios/web test -- --run` (47 passing).
7. **Docker (critical):** `docker compose build` -> succeeds; `docker run` the API image, `docker logs aios-api` shows **no** `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`; confirm the deployed `@aios/kernel/dist/index.js` (not `src/index.ts`) is present under `/app/node_modules/.pnpm/@aios+kernel@*/...`.
8. `docker compose up -d` -> `docker compose ps`: both `aios-api` and `aios-web` report `Up (healthy)`.
9. Runtime gates: `GET /health`, `/livez`, `/readyz` (API); `GET /health`, SPA, nginx->API proxy (Web); security headers; CSP; non-root UID (1001/101); `/data` permissions; T-Bit vault persistence; healthchecks; restart behavior.
10. `git status --short`, `git diff --check`, `git diff --stat` reviewed before closure.

If step 7 reveals `pnpm deploy` omitted the gitignored `dist/`, that is a **separate packaging finding** to be re-scoped and reported — it is not silently worked around here.

## Architectural Impact

- **None to runtime architecture.** This is a packaging/module-mapping correction. Public API surface, Kernel single-orchestrator role, T-Bit canonical ownership, database abstraction, event bus, and stage lifecycle are unchanged.
- Establishes a durable production invariant: **workspace packages consumed at runtime must expose compiled `dist` entry points.** Future packages should set `main`/`types` to `dist/*` from inception (a convention now recorded in this ADR).

## Approval Gate

- **Status:** Proposed — READY FOR APPROVAL (pending ECR-Phase10-0001 Amendment-0001 sign-off).
- **Approvers:** Core Architecture Team / Technical Lead.
- **Prerequisites:** ADR-012 content validated; ECR Amendment-0001 recorded; `@aios/database` `"type":"module"` nuance documented.
- **Implementation:** Only after amendment approval. This ADR does not itself modify any `package.json`; the four file edits are executed as part of the approved ECR amendment.