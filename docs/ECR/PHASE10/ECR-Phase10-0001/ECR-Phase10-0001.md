# ECR-Phase10-0001 — Deployment & Production Hardening

> **ECR ID:** ECR-Phase10-0001
> **Title:** Deployment & Production Hardening
> **Phase:** 10 — Deployment & Production Hardening
> **Status:** READY FOR APPROVAL
> **Created:** 2026-08-18
> **Authoritative Roadmap:** `docs/AIOS_ENGINEERING_AUDIT_v2.md` §14 Consolidated Roadmap; `docs/AIOS_Book.md`
> **Baseline:** Phase 9 Closure (validated commit `1307876`); Phase 8 Frozen Baseline (`b3cfbd7`)
> **Current Package Version:** v0.3.0 (unchanged until the Phase 10 release strategy explicitly authorizes a version change

---

## 1. Executive Summary

This Engineering Change Request (ECR) authorizes and scopes **Phase 10 — Deployment &
Production Hardening** for the AIOS / MUF Labs repository. Phase 9 (Testing, Validation &
Release Candidate Preparation) is **formally CLOSED and accepted**, producing a fully
validated Release Candidate at commit `1307876` (full build 11/11, full typecheck 10/10,
full test suite 18/18 task groups, integration 8/8, runtime API and T-Bit vault lifecycle
verified, git clean).

Phase 10 is a **production-readiness phase**: it hardens the existing API/Web runtime,
introduces production-grade Docker images and CI/CD pipelines, formalizes secrets
management, adds observability and monitoring, and establishes release/rollback
management. **No new product functionality is added.** Phase 10 does **not** alter the
frozen Phase 8 architecture (single-vault, linear bootstrap, Kernel as the single
orchestration point, `@aios/database` as the persistence abstraction, `@muf/tbit-core` as
the canonical T-Bit owner) and does **not** introduce Phase 11 functionality (multi-vault,
P2P network, SDK/Desktop/CLI, semantic/query index, etc.).

This ECR is a **documentation/governance artifact only**. It does not implement Phase 10.
All proposed changes are enumerated in `CHANGE_MATRIX.md`; the staged sequence is defined
in `IMPLEMENTATION_PLAN.md`. Package version remains `v0.3.0` until the Phase 10 release
strategy explicitly authorizes a version change (per `docs/VERSION.md`).

## 2. Current-State Assessment (Phase 9 Closure)

Validated at commit `1307876`:

- **Monorepo:** pnpm workspace + Turborepo. Root `package.json` version `0.3.0`, `packageManager: pnpm@10.15.1`. Workspaces: `apps/*`, `packages/*`, `aios-mvp`. 11 buildable workspace tasks + standalone `aios-mvp`.
- **Build gate:** `pnpm build` → 11/11 tasks successful.
- **Typecheck gate:** `pnpm typecheck` → 10/10 tasks successful.
- **Test gate:** `pnpm test` → 18/18 task groups. Per-package: `@aios/web` 47, `@aios/kernel` 82, `@aios/api` 12, `@muf/tbit-core` 15, `aios-mvp` 55, `@aios/database` 4, `@aios/llm` 1, `@aios/agents` 1; `@aios/shared`/`ui`/`workflow` exit 0 (`--passWithNoTests`).
- **Integration:** `pnpm test:integration` → 8/8 (`tests/integration/vault-bootstrap.test.ts`).
- **Secret bootstrap:** `pnpm run test:secret` → 10/10.
- **Runtime API:** `GET /health` → HTTP 200.
- **T-Bit lifecycle:** setup status HTTP 200 (initialized=false pre-bootstrap), invalid key HTTP 403, vault init HTTP 201, full vault status all 6 subsystems ready.
- **CORS:** `Access-Control-Allow-Origin: http://localhost:5173` honored.
- **Git:** `git status --short` clean.

Notable current-state findings relevant to Phase 10 (from repository inspection):

- `apps/api/src/main.ts` is the true entry point (`createServer()` → `startServer(app)`); `apps/api/src/server.ts` only *exports* `startServer`. **`apps/api/Dockerfile` runs `CMD ["node","dist/server.js"]` — an entrypoint mismatch** (process would not start listening). Phase 10 deployment defect to correct.
- `apps/api/src/middleware/auth.ts` implements `requireSymbolicApiKey` (fails closed; 401/403/503). No rate limiting, no security-header middleware, no generic input-validation middleware.
- `apps/api/src/routes/index.ts` registers 14 T-Bit route modules under `/api/v1/tbit`, each guarded by `requireSymbolicApiKey`.
- `apps/api/src/services/bootstrapLogger.ts` is a dependency-free structured JSON logger (Phase 9 FR-07) — a reusable observability primitive.
- `docker-compose.yml` has `api` (3001) + `web` (3000, nginx) services, healthchecks, `tbit-data` volume, `NODE_ENV=production`, `TBIT_VAULT_ROOT=/data/spaces`, and defaults `TBIT_API_KEY=changeme`.
- `apps/api/Dockerfile` is multi-stage + non-root `nodejs`, but copies the whole `packages` tree into the runner (not minimal) and uses the wrong entrypoint.
- `apps/web/Dockerfile` is multi-stage + `nginx:alpine`; `apps/web/nginx.conf` has SPA fallback + gzip + `/api/` proxy + `/health`.
- **No ESLint config** at repo level (audit Gap G-1; deferred from Stage 8.7/Phase 9).
- **No CI/CD workflows** (`.github/` has only `agents/*.agent.md`; no `.github/workflows/`).
- Secrets bootstrapped into root `.env` via `scripts/setup-tbit-secret.mjs`; `.dockerignore` excludes `.env*`.
- `docs/VERSION.md` + root `VERSION` record `v0.3.0`; policy maps Phase 9→`v0.4.x`, Phase 10→`v0.5.x` at governance discretion.

## 3. Phase 10 Objectives

Produce a production-ready, observable, and operable AIOS deployment without altering the
frozen Phase 8/Phase 9 architecture:

1. Harden the API surface (security headers, rate limiting, input validation, production config, API security).
2. Deliver production Docker images (multi-stage, non-root, minimal, health checks, Compose production topology).
3. Establish CI/CD (build, typecheck, tests, security scanning, Docker image validation, deployment pipeline).
4. Formalize secrets management (production handling, env config, validation, no leakage, rotation strategy where applicable).
5. Add observability (structured logs, metrics, tracing, correlation/request IDs, OpenTelemetry evaluation/integration where justified).
6. Add monitoring (health endpoints, readiness/liveness, alerting, operational monitoring, failure detection).
7. Establish release/rollback management (semantic versioning, changelog, release artifacts, deployment verification, rollback strategy).
## 4. Workstream Breakdown

| ID | Workstream | Primary Target | Frozen Invariants Respected |
|----|-----------|---------------|-----------------------------|
| W1 | Production Hardening | `apps/api/src/server.ts`, new middleware, env config | Kernel stays single orchestrator; no second bootstrap |
| W2 | Docker Production Images | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, `docker-compose.yml` | Non-root, minimal, health checks |
| W3 | CI/CD | new `.github/workflows/*`, `turbo.json`, root `package.json` scripts | No existing CI to preserve; adds gate |
| W4 | Secrets Management | `scripts/setup-tbit-secret.mjs`, `.env.example`, app env examples, Docker/CI secret injection | `@muf/tbit-core` canonical crypto; no leakage |
| W5 | Observability | extends `apps/api/src/services/bootstrapLogger.ts`; metrics/tracing middleware | Reuse existing logger; Kernel event bus unchanged |
| W6 | Monitoring | `/health` + new `/livez`,`/readyz` endpoints; Compose healthchecks | No new product APIs beyond ops probes |
| W7 | Release/Rollback | `docs/RELEASES/*`, `CHANGELOG.md`, `VERSION`, tag/rollback runbooks | Version bump only at release gate |
## 5. Repository Evidence

| Evidence | Source | Phase 10 relevance |
|---------|--------|---------------------|
| Root `package.json` (v0.3.0, pnpm@10.15.1, scripts) | inspected | CI scripts, release scripts |
| `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `aios-mvp`) | inspected | Workspace scope for CI |
| `turbo.json` (build/typecheck/test/test:coverage; `dependsOn` DAGs) | inspected | CI task graph; add `lint`/`docker`/`scan` tasks |
| `docker-compose.yml` (api:3001, web:3000, healthchecks, `tbit-data` volume, `TBIT_API_KEY=changeme` default) | inspected | Production topology; remove default secret |
| `apps/api/Dockerfile` (multi-stage; non-root `nodejs`; `CMD ["node","dist/server.js"]`) | inspected | WRONG entrypoint; not minimal; W2 fix |
| `apps/web/Dockerfile` (multi-stage; `nginx:alpine` runner) | inspected | Harden/minimize; W2 |
| `apps/web/nginx.conf` (SPA + `/api/` proxy + `/health`) | inspected | Security headers; W1/W2 |
| `apps/api/src/server.ts` (CORS, `/health`, global error handler, `CORS_ORIGIN` env) | inspected | Add security headers, rate limit, request-id, validation |
| `apps/api/src/main.ts` (entry: `createServer`→`startServer`) | inspected | Correct Docker entrypoint to `dist/main.js` |
| `apps/api/src/middleware/auth.ts` (`requireSymbolicApiKey`, fails closed) | inspected | Existing API security; preserve & extend |
| `apps/api/src/routes/index.ts` (14 route modules under `/api/v1/tbit`) | inspected | Validation/rate-limit scope |
| `apps/api/src/services/bootstrapLogger.ts` (structured JSON logger, FR-07) | inspected | Observability reuse primitive |
| `scripts/setup-tbit-secret.mjs` (secret bootstrap) | inspected | Secrets rotation/validation |
| `.github/` (`agents/*.agent.md` only; NO workflows) | inspected | CI is greenfield; W3 |
| `.env.example` (canonical secret template) | inspected | Secrets governance |
| `apps/api/.env.example`, `apps/web/.env.example` (non-secret runtime config) | inspected | Env config standardization |
| `.dockerignore` (excludes `dist`, `.env*`, `.git`) | inspected | No-secret-leakage baseline |
| `tests/integration/vault-bootstrap.test.ts` (8/8) | inspected | CI integration gate |
| `docs/AIOS_ENGINEERING_AUDIT_v2.md` §13/§14/§16/§17 | inspected | Roadmap, freeze, DoD |
| `docs/AIOS_Book.md` (Phase 8 roadmap, Phase 9 closure) | inspected | Authoritative roadmap |
| `docs/VERSION.md` + root `VERSION` (v0.3.0; Phase 9→v0.4.x, Phase 10→v0.5.x) | inspected | Version-gate policy |
| Audit G-1 + F-1/F-2 findings | inspected | bundle-size as Phase 10 cross-cutting tasks |

## 6. Architecture Impact

**Impact level: LOW to MODERATE — additive only.**

- **No change to the frozen Phase 8 Architecture Baseline** (`docs/PHASE8_ARCHITECTURE_BASELINE.md`):
  - Kernel remains the single orchestration point (ADR-002).
  - `@muf/tbit-core` remains canonical for T-Bit primitives/storage/encryption/runtime paths (ADR-004).
  - `@aios/database` remains the persistence abstraction.
  - Single active vault, linear bootstrap, no multi-vault (ADR-001).
  - Provider abstraction unchanged (ADR-003); dependency injection preserved (ADR-005); Kernel event bus unchanged (ADR-006).
- **No second bootstrap/orchestration mechanism is introduced.** Phase 10 adds operational middleware and probes around the *existing* `server.ts`/`main.ts` and the *existing* `VaultBootstrapService`; it does not create a parallel orchestrator.
- **Phase 10 additions are confined to:** the API HTTP layer (middleware + endpoints), container images/Compose, CI workflows, secret-bootstrap tooling, observability plumbing that reuses `bootstrapLogger`, and release documentation.
- **The only frozen-adjacent touch is the API entrypoint correction** (`dist/server.js` → `dist/main.js` in `apps/api/Dockerfile`), which is a deployment *defect fix*, not an architectural change. It is flagged for explicit ECR blessing in the Approval Gate (§20) even though it does not alter frozen interfaces.
- **No new packages** are created. `@aios/sdk`, `@aios/desktop`, and the 7 aspirational packages remain empty/future (Phase 11+).

## 7. Security Impact

- **Positive:** security headers (HSTS/CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy), rate limiting, structural input validation, and removal of the `changeme` default API key from Compose improve the production security posture.
- **Preserved:** `requireSymbolicApiKey` fail-closed behavior; `TBIT_API_KEY` sourced strictly from environment; `.dockerignore` already excludes secret env files from images.
- **New risk surface:** CI pipeline must handle secrets without leakage (use CI secret store, never echo secrets, mask logs). Secrets-bootstrap must validate key identity invariants (`TBIT_API_KEY === VITE_TBIT_API_KEY`, HMAC/encryption key ids present) — these already exist and are reinforced.
- **No cryptographic change:** AES-256-GCM key generation/activation remains owned by `@muf/tbit-core`; Phase 10 does **not** implement key rotation (deferred beyond Phase 10 per Phase 8 known limitations), but defines a rotation *strategy* where applicable.
## 8. Deployment Architecture

**Topology (production Compose):**

```
┌─────────────┐     ┌──────────────┐
│  aios-web    │────▶│  aios-api    │──▶ tbit-data volume (/data/spaces)
│ (nginx:80)   │/api/│ (node, :3001)│   (@muf/tbit-core canonical paths)
└─────────────┘     └──────────────┘
   static SPA         Express + Kernel + 5 vault providers
```

- **`aios-api`:** multi-stage build, non-root `nodejs`, minimal production deps (`pnpm install --prod --frozen-lockfile`), `EXPOSE 3001`, `CMD ["node","dist/main.js"]` (corrected), healthcheck against `/health` (and `/livez`/`/readyz`).
- **`aios-web`:** multi-stage build, `nginx:alpine`, static `dist`, security headers in `nginx.conf`, gzip, SPA fallback, `/api/` reverse-proxy to `aios-api:3001`, `/health`.
- **Compose production profile:** explicit `NODE_ENV=production`, `TBIT_VAULT_ROOT=/data/spaces`, secrets injected via environment (not defaulted), healthcheck-gated dependency (`web` depends_on `api` `condition: service_healthy`), `restart: unless-stopped`, named `tbit-data` volume.
- **No orchestrator change:** the API process still runs the existing `createServer()`→`startServer()` path; vault bootstrap still uses the single `VaultBootstrapService`.

## 9. CI/CD Architecture

**Greenfield CI (no existing workflows).** A staged pipeline under `.github/workflows/`:

1. **ci-build** — `pnpm install --frozen-lockfile` → `pnpm build` (11/11).
2. **ci-typecheck** — `pnpm typecheck` (10/10).
3. **ci-test** — `pnpm test` (18/18) + `pnpm test:integration` (8/8) + `pnpm run test:secret` (10/10) + `pnpm run test:coverage`.
4. **ci-lint** — new ESLint flat config (`eslint.config.mjs`) + per-package `lint` scripts (resolves audit Gap G-1).
5. **ci-security-scan** — dependency audit + SAST scan + secret-leakage scan (e.g., gitleaks-style) on PRs.
6. **ci-docker** — build `aios-api` and `aios-web` images; validate with `docker compose config`; run image healthcheck smoke (`/health`).
7. **ci-release** (gated, manual dispatch / tag trigger) — build artifacts, generate changelog, tag per semver, publish images, perform deployment verification.

Turbo tasks (`turbo.json`) extended with `lint`, `docker:build`, `docker:scan`, `scan`, gated by `dependsOn` to mirror the manual Phase 9 gate order. CI never modifies the frozen baseline; it only gates.

## 10. Secrets Strategy

- **Canonical local bootstrap preserved:** `scripts/setup-tbit-secret.mjs` generates the installation-level `.env` (HMAC secret+key-id, encryption secret+key-id, shared `TBIT_API_KEY === VITE_TBIT_API_KEY`). Phase 10 reinforces validation and documents rotation.
- **Production injection:** secrets come from the deployment secret store (CI/Compose env/Vault), **never baked into images**. `.dockerignore` already excludes `.env*`. Compose removes the `changeme` default and requires an explicit `TBIT_API_KEY`.
- **Validation:** secret-bootstrap validates presence + identity invariants; CI secret-scan rejects any secret committed to the repo. A startup self-check in `server.ts` (non-fatal in dev, fail-closed in production) verifies required secrets before accepting traffic.
- **No leakage:** no secret logging (the `bootstrapLogger` already redacts by not including secret material), masked CI output, no secrets in image labels/metadata.
- **Rotation strategy where applicable:** document HMAC/encryption key rotation flow (dual-key `TBIT_HMAC_PREVIOUS_SECRETS`/`TBIT_ENCRYPTION_PREVIOUS_SECRETS` already templated in `.env.example`); API-key rotation via re-bootstrap + redeploy. **Implementation of actual rotation logic remains deferred** (not Phase 10 scope unless explicitly re-scoped by an ADR).
## 11. Observability Strategy

- **Structured logs:** reuse `apps/api/src/services/bootstrapLogger.ts` (JSON lines: `timestamp`, `requestId`, `correlationId`, `component`, `endpoint`, `level`, `message`, `exception`, `stackTrace`, `metadata`). Extend to cover request lifecycle, not only bootstrap.
- **Request/correlation IDs:** add a request-id middleware (`X-Request-Id` in/out) that feeds the existing logger; propagate `correlationId` across the bootstrap→request boundary.
- **Metrics:** lightweight Prometheus-style `/metrics` endpoint counters/histograms (requests, latency, vault-bootstrap outcomes); no new persistence for metrics.
- **Tracing:** evaluate OpenTelemetry; **integrate only where justified** (e.g., end-to-end trace for `/api/v1/tbit/vault/init`). OTel is optional per stage gate; if integrated, it instruments the existing Express/Kernel path without a second orchestrator.
- **Redaction:** logs/metrics/traces must never emit secrets, vault content, or API keys.

## 12. Monitoring Strategy

- **Health endpoints:** keep `/health` (liveness). Add `/livez` (process liveness) and `/readyz` (readiness = secrets present + vault context ready where applicable).
- **Compose healthchecks:** API `/livez`/`/readyz`/`/health`; web `/health` (nginx). `web` depends_on `api` readiness.
- **Alerting:** define alert conditions (high 5xx rate, readiness failures, bootstrap failures, secret-missing) and an alert routing stub; full alerting backend integration is configuration-only (no new code package).
- **Operational monitoring:** request rate, error rate, latency, vault-init success rate, subsystem readiness — surfaced via `/metrics` and the log stream.
- **Failure detection:** fail-closed startup on missing secrets; readiness flips on subsystem failure; Docker `restart: unless-stopped` with backoff.

## 13. Release/Rollback Strategy

- **Semantic versioning:** package version `v0.3.0` remains **unchanged** until the Phase 10 release gate explicitly authorizes a move to `v0.5.x` (per `docs/VERSION.md` policy; `v0.4.x` reserved for a Phase 9 Release Candidate if governance chooses). Any bump is metadata-only per the Phase 8 precedent.
- **Changelog:** `CHANGELOG.md` entry per stage freeze, following the existing Keep-a-Changelog convention.
- **Release artifacts:** Docker images (`aios-api`, `aios-web`), SBOM/dependency manifest, coverage report, release notes under `docs/RELEASES/RELEASE_vX.Y.Z.md`.
- **Deployment verification:** post-deploy smoke (ST-001 reuse: `/health`, setup status, vault init, vault status, CORS, invalid-auth), plus new Phase 10 ops probes (`/livez`,`/readyz`,`/metrics`).
- **Rollback:** image-tag-based rollback (redeploy previous image tag); volume-based data rollback is governed by the existing T-Bit snapshot/rollback primitives owned by `@muf/tbit-core` (no new rollback mechanism). Rollback runbook documented.
## 14. Implementation Stages

Phase 10 is staged 10.1 → 10.7 (see `IMPLEMENTATION_PLAN.md` for the full sequence and per-stage acceptance gates):

| Stage | Title | Scope summary |
|-------|-------|----------------|
| 10.1 | Production Hardening | Security headers, rate limiting, input validation, production config, API security (entrypoint fix included) |
| 10.2 | Docker Production Images | Multi-stage/non-root/minimal images, health checks, Compose production topology |
| 10.3 | CI/CD | Build/typecheck/test/security-scan/Docker validation/deployment pipeline |
| 10.4 | Secrets Management | Production handling, env config, validation, no-leakage, rotation strategy |
| 10.5 | Observability | Structured logs (extended), metrics, tracing, correlation/request IDs, OTel evaluation |
| 10.6 | Monitoring | Health/livez/readyz endpoints, alerting, operational monitoring, failure detection |
| 10.7 | Release/Rollback | Semver gate, changelog, artifacts, deployment verification, rollback runbook, Phase 10 closure |

## 15. Dependencies

- **Phase 9 Closure** (commit `1307876`) — required baseline (tests must pass in CI).
- **Phase 8 Frozen Baseline** — architectural invariants context.
- **Existing tooling:** pnpm@10.15.1, Turborepo, Vitest, Vite, Express 5, nginx, `node:22-alpine`, `nginx:alpine`.
- **New tooling (to be added by implementation, not this ECR):** ESLint flat config, a rate-limiter, a validator (zod-style), Prometheus metrics lib, optional OTel SDK, container scanner, secret scanner.
- **External:** a CI runner (GitHub Actions) capable of Docker builds; a secret store for CI.

## 16. Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Entrypoint fix (`server.js`→`main.js`) silently changes runtime behavior | Med | Stage-gated; smoke ST-001 + integration 8/8 must pass; verified via `/health`+`/readyz` |
| R2 | Rate limiting breaks bootstrap/vault flows | Med | Exempt `/api/v1/tbit/setup/**` and `/api/v1/tbit/vault/init` with documented policy; integration tests gate |
| R3 | Security headers break the web SPA/3D panels | Med | CSP tuned to existing Vite/Three.js assets; web tests (47/47) + manual smoke gate |
| R4 | Secret leakage in CI logs | High | Secret-scan + masked logs; no secret echo; fail CI on detection |
| R5 | Minimal Docker image drops a runtime dependency | Med | `--prod` install from lockfile; image smoke + `/readyz` gate |
| R6 | Version bump applied prematurely | Low | Release-gate controlled; version stays 0.3.0 until explicit authorization |
| R7 | Observability dependencies add bundle/runtime weight | Low | OTel optional/justified; metrics lib dependency-free where possible |
| R8 | Frozen-boundary drift via new middleware importing Kernel internals | Med | Middleware stays at HTTP layer; never imports `@aios/kernel` internals beyond existing public server bootstrap |

## 17. Explicit Non-Goals / Phase 11 Exclusions

Phase 10 explicitly **does NOT**:

- Implement multi-vault, vault switching, vault registry, or vault import/export (frozen ADR-001; Phase 11+).
- Create `@aios/network`, `@aios/semantic`, `@aios/query`, `@aios/guardian`, `@aios/assets`, `@aios/sdk`, `@aios/cli`, or populate `@aios/desktop` (Phase 11+).
- Implement P2P/anti-entropy sync beyond the existing `@muf/tbit-core` API (Phase 11+).
- Implement chemical encryption-key *rotation logic* (strategy only is in-scope; implementation deferred).
- Introduce a second bootstrap or orchestration mechanism.
- Modify the Kernel, Provider, Workflow, Agent, Q-Vault, or vault-lifecycle contracts (frozen).
- Move T-Bit ownership out of `@muf/tbit-core` or persistence out of `@aios/database` (frozen).
- Add repository-level lint to source packages beyond configuration (no architectural change).
- Authorize a version bump (release gate only).
## 18. Validation Strategy

Each stage must pass its acceptance gate (see `IMPLEMENTATION_PLAN.md`). Phase-wide:

- **Build:** `pnpm build` 11/11.
- **Typecheck:** `pnpm typecheck` 10/10.
- **Tests:** `pnpm test` 18/18, `pnpm test:integration` 8/8, `pnpm run test:secret` 10/10, `pnpm --filter @aios/web test -- --run` 47/47.
- **Lint:** new `pnpm lint` green (resolves Gap G-1).
- **Docker:** `docker compose config` valid; both images build; image smoke `/health` → 200.
- **Security:** secret-scan clean; SAST clean; dependency audit clean (or waived with rationale).
- **Runtime:** ST-001 reuse (health, setup status, invalid-auth 403, vault init 201, vault status all-subsystems-ready, CORS, git clean) + new ops probes `/livez`,`/readyz`,`/metrics`.
- **Governance:** `AIOS_Book.md`, `CHANGELOG.md`, `PROJECT_STATE.md`, `docs/ENGINEERING_TIMELINE.md`, `VERSION` updated at closure; this ECR approved; any ADRs approved.

## 19. Definition of Done

Phase 10 is **Complete** only when **ALL** are met (mirrors audit §17):

- Compiles: `pnpm build` passes.
- Tested: full suite (+ integration + secret + coverage) passes in CI.

- Documentation: `AIOS_Book.md`, `CHANGELOG.md`, `PROJECT_STATE.md`, `ENGINEERING_TIMELINE.md`, `VERSION` synchronized; Phase 10 closure acceptance doc created (`docs/PHASE10_FINAL_ACCEPTANCE.md`).
- Integration: Docker Compose production topology green (healthchecks pass).
- Security: secret-scan + SAST + dependency audit clean.
- Acceptance: all stage acceptance criteria + this ECR's gates met.
- Release: release artifacts produced; version bump only if authorized at the release gate; rollback runbook present.
- No frozen architecture modified without an approved ADR (none expected beyond the entrypoint defect blessing).

## 20. Approval Gate

**ECR-Phase10-0001 status: READY FOR APPROVAL.**

Approval steps:

1. **Engineering review** — confirm repository evidence (§5), architecture impact (§6), and non-goals (§17).
2. **ADR determination** — the following architecture-adjacent items require ADR *before implementation* if they modify frozen contracts:
   - API Docker entrypoint correction (`dist/server.js` → `dist/main.js`): **defect fix, not a frozen-contract change**; recorded as a Phase 10 deployment correction but blessed by this ECR's approval. ADR required only if review judges it material.
   - New operational middleware (security headers, rate limit, request-id) touching `server.ts`: **HTTP-layer only; no frozen-contract change**; no ADR required, but documented in CHANGE_MATRIX.
   - Any addition of OpenTelemetry that instruments Kernel internals: **ADR required** if it reaches beyond the Express HTTP boundary (would interact with ADR-002/ADR-006).
3. **Security sign-off** — secrets, scanning, and headers reviewed.
4. **Release-gate authorization** — version bump decision deferred to Stage 10.7.
5. On approval, status → **APPROVED** and `IMPLEMENTATION_PLAN.md` stages may proceed one at a time, each with its own freeze/acceptance per ADR-008.

Until approved, **no Phase 10 implementation is authorized.**

---

*End of ECR-Phase10-0001 (DRAFT). See `CHANGE_MATRIX.md` and `IMPLEMENTATION_PLAN.md`.*