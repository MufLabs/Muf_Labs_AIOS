# ECR-Phase10-0001 — Amendment-0001: Production Entry-Point Mapping for Workspace Packages

> **Amendment ID:** ECR-Phase10-0001 / AMENDMENT-0001
> **Title:** Production Entry-Point Mapping for Workspace Packages (`@aios/kernel`, `@aios/agents`, `@aios/database`, `@aios/llm`)
> **Parent ECR:** [ECR-Phase10-0001](ECR-Phase10-0001.md) — Deployment & Production Hardening
> **Status:** READY FOR APPROVAL
> **Date:** 2026-08-19
> **Governance Basis:** ADR-008 Freeze Policy (criterion #1 verified defect; criterion #2 ECR authorization); ADR-012 (associated Architecture Decision Record); Stage 10.3 Implementation Plan
> **Scope:** Modifies *package manifests only*. No public API, no application source logic, no architecture, no Docker manifest rewriting.

---

## 1. Context (Stage 10.3 Runtime Block)

ECR-Phase10-0001 Stage 10.3 (`AMENDMENT-0001` parent scope W2 — Docker Production Images) delivers
production Docker images. The Stage 10.3 API `Dockerfile` builds the workspace tree
(`pnpm run build --filter=@aios/api --filter=@aios/api^...`) and packages production dependencies
with `pnpm deploy --prod --legacy`.

The Stage 10.3 acceptance gate (Docker runtime health) is **currently BLOCKED**. The API container
builds successfully but crashes on boot:

```
docker compose build api  -> PASS (compile + pnpm deploy succeed)
docker compose up api     -> container starts, then Restarting (1)
docker logs aios-api:
  Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is currently unsupported
  for files under node_modules, for
  "file:///app/node_modules/.pnpm/@aios+kernel@file+packages+kernel/node_modules/@aios/kernel/src/index.ts"
  (Node.js v22.23.2)
```

## 2. Root Cause

Four workspace packages declare their production entry points as **TypeScript source**
(`main` / `types` = `src/index.ts`) rather than the **compiled artifact**
(`main` / `types` = `dist/index.js` / `dist/index.d.ts`):

- `packages/kernel/package.json`
- `packages/agents/package.json`
- `packages/database/package.json`
- `packages/llm/package.json`

`pnpm deploy --legacy` copies these workspace packages verbatim into `node_modules` at deploy time.
Node 22 then resolves the package `main` to a `.ts` file **under `node_modules`** and rejects it,
because type stripping is unsupported for files under `node_modules`.

Reference packages already exposing `dist/*` (`@aios/shared`, `@muf/tbit-core`, `@aios/workflow`)
are unaffected and serve as precedent.

## 3. Evidence (per-package, individually verified — the four are NOT identical)

| Package | `type` | current `main` / `types` | `dist/index.js` exists | `dist/index.d.ts` exists | dist is ESM (`.js`-ext) | `exports` field |
|---|---|---|---|---|---|---|
| `@aios/kernel` | `module` | `src/index.ts` | ✅ | ✅ | ✅ | ❌ |
| `@aios/agents` | `module` | `src/index.ts` | ✅ | ✅ | ✅ | ❌ |
| `@aios/database` | *(absent)* | `src/index.ts` | ✅ | ✅ | ✅ | ❌ |
| `@aios/llm` | `module` | `src/index.ts` | ✅ | ✅ | ✅ | ❌ |

**Non-identical case — `@aios/database`:** it is the only one lacking `"type": "module"`. Its
compiled `dist/index.js` is ESM output (`module: "ESNext"` in `tsconfig.base.json`). Without
`"type": "module"`, Node would classify the file as CommonJS and fail on `export` syntax at runtime.
A pure `main`/`types` repoint is therefore **insufficient** for `@aios/database`; this amendment adds
`"type": "module"` for that package only.

All four compile successfully to `dist/index.js` + `dist/index.d.ts` during `pnpm build` (11/11
passes); the dist output uses `.js`-extension ESM relative imports (verified, e.g.
`@aios/kernel`: `export * from "./monitoring/GuardianObserver.js"`; `@aios/database`:
`export { normalizeUnicodeText } from "./core/textEncoding.js"`).
---

## 4. Proposed Change (exact)

Repoint the `main` / `types` fields of the four packages to their compiled artifacts, and add
`"type": "module"` to `@aios/database` only.

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

### Reasons for the `@aios/database` `"type": "module"` companion field
- Its `dist/index.js` is ESM output; absent `"type":"module"` Node classifies it CJS and crashes on
  `export` syntax.
- It brings `@aios/database` in line with `@aios/kernel`/`@aios/agents`/`@aios/llm` (all already `module`)
  and with the reference packages that already point at `dist`.

### Non-goals (explicitly excluded)
- Public package names (`@aios/kernel`, etc.) — unchanged.
- Kernel / T-Bit / database abstraction architecture — unchanged.
- Application source logic — unchanged.
- Multi-vault / Phase 11 functionality — not introduced.
- `exports` / `imports` maps — not added (would risk breaking existing deep imports).
- Docker-specific manifest rewriting — rejected (would mask the repo defect and violate the "no
  Docker-specific manifest rewriting" constraint; not reproducible outside Docker).
---

## 5. Impact Analysis

### Development tooling — no impact
- **Vitest** (root + per-app configs) aliases `@aios/kernel` -> `packages/kernel/src`, etc. Tests
  keep resolving **source**; unit/integration suites unaffected.
- **tsx dev** (`apps/api` `"dev": "tsx watch src/main.ts"`) resolves `@aios/*` source-aware;
  compiled `dist` entries also load under tsx. Unaffected.
- **`tsc` typecheck** resolves `types` -> existing `dist/index.d.ts` (emitted by the composite
  build). Passes.

### Production — resolves the Stage 10.3 blocker
- `@aios/kernel` (first workspace import of `@aios/api`) loads `dist/index.js` and boots.
- `@aios/agents`, `@aios/database`, `@aios/llm` carry the same latent defect; corrected in the same
  change before the loader reaches them.
- Unblocks the remaining Stage 10.3 runtime gates (health, livez, readyz, web, proxy, headers, CSP,
  non-root UID, /data, T-Bit persistence, healthchecks, restart).

### Compatibility
- Public barrel exports unchanged; only the file Node loads changes (source -> compiled).
- `@aios/database` `"type":"module"` aligns it with all other `@aios` ESM packages.
- **Critical out-of-band check:** `dist/` is gitignored and excluded by `.dockerignore`, though it is
  regenerated in the builder stage. **The make-or-break validation is confirming the *deployed*
  package contains `dist/index.js` at runtime** (step 7 below). If `pnpm deploy` omits the gitignored
  `dist/`, that is a **separate packaging finding** re-scoped separately — not silently worked around here.

## 6. Validation Plan

1. `pnpm --filter @aios/api typecheck` — passes.
2. `pnpm build` — 11/11 tasks successful (dist regenerated).
3. `pnpm typecheck` — 10/10 tasks successful.
4. `pnpm test` — 18/18 task groups; `@aios/api` 29 passing.
5. `pnpm test:integration` (8/8) and `pnpm test:secret` (10/10).
6. `pnpm --filter @aios/web test -- --run` (47 passing).
7. **Docker (critical):** `docker compose build` succeeds; run API image; `docker logs aios-api`
   shows **no** `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`; confirm deployed
   `@aios/kernel/dist/index.js` (not `src/index.ts`) under `/app/node_modules/.pnpm/@aios+kernel@*/...`.
8. `docker compose up -d` -> `docker compose ps`: `aios-api` and `aios-web` both `Up (healthy)`.
9. Runtime gates: `GET /health`, `/livez`, `/readyz` (API); SPA, nginx->API proxy, `/health` (Web);
   security headers; CSP; non-root UID (1001/101); `/data` perms; T-Bit vault persistence;
   healthchecks; restart behavior.
10. `git status --short`, `git diff --check`, `git diff --stat` reviewed before closure.

## 7. Rollback

- Revert the four `package.json` field changes to their committed `src/index.ts` values and remove
  the `"type":"module"` line from `@aios/database`. Manifest-only revert; no data migration, no
  schema change, `dist/` is gitignored (no repository pollution).

## 8. Governance Authorization

- **Basis:** ADR-008 Freeze Policy — criterion #1 (verified production defect: Stage 10.3 Docker
  runtime blocked) and criterion #2 (explicit ECR authorization via this amendment).
- **Associated ADR:** ADR-012 — Workspace Package Production Entry-Point Mapping (`dist` vs `src`).
- **Status:** READY FOR APPROVAL. Implementation (the four `package.json` edits) proceeds **only**
  after this amendment is approved and the parent ECR-Phase10-0001 Stage 10.3 gate is re-opened.
- **Ownership lifecycle:** No change to package names, public API, or architecture; this is a
  packaging/module-mapping correction under workstream W2 (Docker Production Images).

## 9. References

- `docs/ECR/PHASE10/ECR-Phase10-0001/ECR-Phase10-0001.md` (parent ECR, §20.2 / Stage 10.3)
- `docs/ECR/PHASE10/ECR-Phase10-0001/IMPLEMENTATION_PLAN.md` (Stage 10.3 acceptance gates)
- `docs/ECR/PHASE10/ECR-Phase10-0001/CHANGE_MATRIX.md` (W2 — Docker Production Images scope)
- `docs/ADR/ADR-008-freeze-policy.md`
- `docs/ADR/ADR-011-container-runtime-decisions.md`
- `docs/ADR/ADR-012-workspace-package-production-entrypoints.md`
- `apps/api/Dockerfile`; `docker-compose.yml`; the four `packages/*/package.json` manifests