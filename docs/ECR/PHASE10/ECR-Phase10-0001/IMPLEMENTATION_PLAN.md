# Phase 10 Implementation Plan & Acceptance Gates

**ECR ID:** ECR-Phase10-0001  
**Project:** MUF Labs AIOS  
**Scope:** Deployment & Production Hardening  
**Target Version:** Determined at Stage 10.7 per repository versioning policy (v0.3.0 baseline; Phase 10 release gate authorizes bump)  
**Date:** 2026-08-18  

---

## 1. Implementation Principles

1. **Strict Staging Sequence:** Stages must be implemented sequentially (10.1 through 10.7). No stage may begin until the preceding stage passes its acceptance gate.
2. **Zero In-Place Refactoring:** Only additive hardening and containerization/governance changes are allowed. Frozen Phase 8/9 code contracts remain immutable.
3. **Continuous Validation:** Every stage must satisfy `pnpm typecheck` and `pnpm test` without regressions.
4. **No Premature Releases:** Version remains `v0.3.0` until Stage 10.7 where the semantic release strategy executes.

---

## 2. Stage Breakdown & Acceptance Gates

### Stage 10.1: Production Hardening & Security Middleware
- **Scope:**
  - Install and configure `helmet` in `@aios/api`.
  - Install and configure `express-rate-limit` with tiered limits (auth, vault init, default API).
  - Add request body size limits (`express.json({ limit: '1mb' })`).
  - Add request correlation ID middleware (`X-Request-ID` generation/propagation).
  - Add explicit CORS origin restriction configurable via `CORS_ALLOWED_ORIGINS`.
- **Target Files:**
  - `apps/api/package.json`
  - `apps/api/src/server.ts`
  - `apps/api/src/middleware/rateLimiter.ts` (new)
  - `apps/api/src/middleware/securityHeaders.ts` (new)
  - `apps/api/src/middleware/requestId.ts` (new)
- **Acceptance Gate 10.1:**
  - [ ] `pnpm --filter @aios/api typecheck` passes.
  - [ ] `pnpm --filter @aios/api test` passes with new middleware unit tests.
  - [ ] Security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.) verified in test suite.
  - [ ] Rate limiting verified returning HTTP 429 when threshold exceeded.

---

### Stage 10.2: Health, Observability & Structured Logging
- **Scope:**
  - Evaluate the existing Phase 9 `bootstrapLogger` (dependency-free, JSON lines via `console.log`) for production readiness.
  - Determine whether to extend `bootstrapLogger` (add request lifecycle, redaction, log levels) or replace with a structured logging library (e.g., Winston, Pino) — decision must be justified by repository evidence (native module compatibility, log aggregation requirements, bundle size).
  - If extending: enhance `bootstrapLogger` with request-id/correlation-id injection, secret/key redaction, and configurable output (stdout/file).
  - If replacing: introduce minimal dependency with migration path; deprecate `bootstrapLogger` surface.
  - Upgrade `/health` endpoint to structured payload with subsystem status checks (`liveness` vs `readiness`).
  - Add `/ready` endpoint verifying database and vault readiness.
- **Target Files:**
  - `apps/api/src/services/bootstrapLogger.ts` (extend) OR `apps/api/src/services/logger.ts` (new, with migration)
  - `apps/api/src/routes/health.ts` (or within `routes/index.ts`)
- **Acceptance Gate 10.2:**
  - [ ] `pnpm --filter @aios/api test` passes.
  - [ ] Structured logs output strictly valid JSON when `NODE_ENV=production`.
  - [ ] Sensitive headers (`x-tbit-api-key`, `Authorization`) are redacted in logs.
  - [ ] `/health` returns HTTP 200 (liveness).
  - [ ] `/ready` returns HTTP 200 when subsystems ready, HTTP 503 during startup/degraded.
  - [ ] Logging decision (extend vs replace) documented with evidence-based rationale.

---

### Stage 10.3: Production Docker Images & Compose Topology
- **Scope:**
  - **Evidence-based container hardening**: Inspect existing `apps/api/Dockerfile` (multi-stage, `node:22-alpine`, non-root `nodejs` UID 1001) and `apps/web/Dockerfile` (multi-stage, `nginx:alpine` runner). Validate runtime dependencies (native modules: none in `@aios/api` deps; `@muf/tbit-core` uses pure JS crypto), filesystem requirements (`/data` volume for T-Bit persistence), and health check endpoints.
  - Determine production base image and non-root UID from evidence:
    - API: `node:22-alpine` (or `node:22-slim` if glibc needed) with existing `nodejs` user (UID 1001) or dedicated `aios` user — decision based on `apk` vs `apt` availability, image size, and security scanning results.
    - Web: `nginx:alpine` (or `nginx:stable-alpine`) with non-root nginx user — decision based on nginx config requirements (privileged ports, file permissions).
  - Refactor `apps/api/Dockerfile`: fix entrypoint to `dist/main.js`; copy only `dist/` + `--prod` `node_modules` into runner; add `HEALTHCHECK` using `/readyz`.
  - Refactor `apps/web/Dockerfile`: minimize build stage (copy only `apps/web` + required workspace packages); harden `nginx.conf` with security headers.
  - Update `docker-compose.yml`: remove `TBIT_API_KEY=changeme` default; add resource constraints; configure healthcheck dependencies (`web` depends on `api` readiness).
- **Target Files:**
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `apps/web/nginx.conf`
  - `docker-compose.yml`
  - `.dockerignore`
- **Acceptance Gate 10.3:**
  - [ ] `docker build` succeeds for both `apps/api` and `apps/web`.
  - [ ] Containers run as non-root user (verified via `id -u` inside container != 0); UID documented with rationale.
  - [ ] `docker compose up -d` brings up API and Web services; both report `healthy` in `docker ps`.
  - [ ] Image sizes reduced vs current baseline; security scan (Trivy/Grype) passes with no critical vulns.
  - [ ] Base image and UID choices documented in `docs/OPERATIONS/CONTAINER_RUNTIME.md` with evidence.

### Stage 10.4: Production Secrets & Environment Validation
- **Scope:**
  - Define strict production `.env.example` templates for root, API, and Web.
  - Implement runtime environment validation using Zod schemas at API startup.
  - Reject startup if critical secrets (`TBIT_VAULT_ENCRYPTION_KEY`, `TBIT_API_KEY`) are missing or use default insecure values.
- **Target Files:**
  - `.env.example`
  - `apps/api/.env.example`
  - `apps/web/.env.example`
  - `apps/api/src/config/env.ts` (new schema validation)
- **Acceptance Gate 10.4:**
  - [ ] API refuses to start and exits with clear error when required production variables are missing.
  - [ ] Secret validation test suite passes.
  - [ ] No secrets committed or present in build cache.

---

### Stage 10.5: CI/CD Pipeline & Automated Quality Gates
- **Scope:**
  - Create GitHub Actions workflow `.github/workflows/ci.yml`:
    - Full build, typecheck, and test execution matrix.
  - Create GitHub Actions workflow `.github/workflows/security.yml`:
    - Dependency vulnerability audit (`pnpm audit`).
    - Container scanning.
  - Create GitHub Actions workflow `.github/workflows/release.yml`:
    - Triggered on tag creation to build and publish release containers.
- **Target Files:**
  - `.github/workflows/ci.yml`
  - `.github/workflows/security.yml`
  - `.github/workflows/release.yml`
- **Acceptance Gate 10.5:**
  - [ ] All workflows pass local validation / dry-run.
  - [ ] Workflow steps enforce zero tolerance for failed tests or typecheck errors.

---

### Stage 10.6: Verification & End-to-End Deployment Smoke Test
- **Scope:**
  - Execute end-to-end containerized smoke test in simulated staging environment:
    1. Start container topology via `docker compose up -d`.
    2. Validate container health status.
    3. Execute vault initialization via API through Nginx reverse proxy.
    4. Run integration test suite against containerized endpoints.
- **Target Files:**
  - `scripts/smoke-test-prod.sh` (or `.ps1`)
- **Acceptance Gate 10.6:**
  - [ ] Full smoke test execution PASS: 100% endpoints responsive, CORS valid, auth enforced, vault initialized and operational.

---

### Stage 10.7: Semantic Release & Phase 10 Governance Closure
- **Scope:**
  - Determine release version at Stage 10.7 approval gate per repository versioning policy (baseline v0.3.0; `docs/VERSION.md` maps Phase 10 → v0.5.x at governance discretion). Record the approved version as a Stage 10.7 decision.
  - Bump package versions to approved version across workspace packages.
  - Update `CHANGELOG.md` with Phase 10 Production Release notes.
  - Update `PROJECT_STATE.md` and `docs/VERSION.md`.
  - Create `docs/PHASE10_FINAL_ACCEPTANCE.md`.
- **Target Files:**
  - `package.json`
  - Workspace `package.json` files
  - `VERSION`
  - `docs/VERSION.md`
  - `CHANGELOG.md`
  - `PROJECT_STATE.md`
  - `docs/PHASE10_FINAL_ACCEPTANCE.md` (new)
- **Acceptance Gate 10.7:**
  - [ ] Working tree clean.
  - [ ] `git diff --check` passes.
  - [ ] Phase 10 formally accepted and signed off.
  - [ ] Release version approved and recorded (e.g., `v0.5.0` per `docs/VERSION.md` policy, or as authorized at gate).
  - [ ] `docker build` succeeds for both `apps/api` and `apps/web`.
  - [ ] Containers run as non-root user (verified via `id -u` inside container != 0); UID documented with rationale.
  - [ ] `docker compose up -d` brings up API and Web services; both report `healthy` in `docker ps`.
