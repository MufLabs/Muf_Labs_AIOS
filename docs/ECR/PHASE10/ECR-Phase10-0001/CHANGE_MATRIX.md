# CHANGE_MATRIX.md — ECR-Phase10-0001

Per-section change matrix for every proposed implementation change in Phase 10.

Each entry: **Exact path | Current state | Required change | Reason | Dependencies | Validation | Risk**

---

## W1 — Production Hardening (API surface)

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 1 | `apps/api/src/server.ts` | CORS, `/health`, global error handler; no security headers, no rate limit, no request-id | Add helmet-compatible security headers middleware; add rate limiter (exempt `/setup/**`, `/vault/init`); add request-id middleware; extend global error handler to log structured | Production security baseline; CORS already present | `npm: helmet`, rate-limiter lib; `bootstrapLogger` | `GET /health` 200; headers present; rate limit enforced; request-id echoed; ST-001 passes | R1, R2, R3 |
| 2 | `apps/api/src/middleware/securityHeaders.ts` | **Does not exist** | Create new middleware file exporting `securityHeaders()` Express middleware | Isolate security header logic; testable | None | Unit test middleware in isolation | R3 |
| 3 | `apps/api/src/middleware/rateLimiter.ts` | **Does not exist** | Create rate limiter with configurable window/max; exempt paths via config | Prevent abuse; exempt bootstrap | Rate limiter lib (e.g., `express-rate-limit`) | Integration test: 429 on excess; exempt paths pass | R2 |
| 4 | `apps/api/src/middleware/requestId.ts` | **Does not exist** | Create request-id middleware: reads `X-Request-Id` or generates UUID; sets on `req.id`; adds to response headers; feeds `bootstrapLogger` | Correlation IDs for observability | `bootstrapLogger` (existing) | Header present in `/health` response; logs contain `requestId` | Low |
| 5 | `apps/api/src/middleware/validation.ts` | **Does not exist** | Create structural input validation middleware (e.g., zod schemas for critical routes) | Defense in depth; catch malformed payloads early | Validator lib (e.g., `zod`) | Unit tests for schemas; integration: 400 on invalid body | R2 if applied to bootstrap routes (exempt them) |

## W2 — Docker Production Images

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 6 | `apps/api/Dockerfile` | Multi-stage; non-root `nodejs`; **`CMD ["node","dist/server.js"]`** (wrong entrypoint); copies full `packages/` into runner (not minimal) | Fix entrypoint to `CMD ["node","dist/main.js"]`; copy only `dist/` + runtime deps (`node_modules` from `--prod` install) into runner | Server only starts via `main.ts`; runner should be minimal | `apps/api/src/main.ts` (entry point) | Image builds; `docker run` → `/health` 200; `/readyz` 200; image size reduced | R1, R5 |
| 7 | `apps/web/Dockerfile` | Multi-stage; `nginx:alpine` runner; build stage copies all packages | Minimize build stage; ensure only `apps/web` + needed packages copied; final image serves static `dist/` only | Smaller attack surface; faster builds | `apps/web/nginx.conf` (updated for security headers) | Image builds; `docker run` → serves SPA; `/health` 200 | R5 |
| 8 | `apps/web/nginx.conf` | SPA fallback + gzip + `/api/` proxy + `/health`; no security headers | Add security headers (CSP tuned for Vite/Three.js, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy); ensure proxy pass headers preserved | Browser-side hardening; proxy integrity | `apps/api` security headers (complementary) | `curl -I` shows headers; CSP allows Three.js/WebGL; manual web smoke | R3 |
| 9 | `docker-compose.yml` | `api` (3001), `web` (3000), healthchecks, `tbit-data` volume, `TBIT_API_KEY=changeme` default, `NODE_ENV=production` | Remove `changeme` default; require `TBIT_API_KEY` from env; add `/livez` `/readyz` healthchecks; pin base image digests; add `read_only: true` where possible; drop caps | Production secret hygiene; explicit readiness; image immutability | `scripts/setup-tbit-secret.mjs`; secret store in CI | `docker compose config` valid; `docker compose up` → both healthy; no `changeme` in env | R4 |
## W3 — CI/CD

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 10 | `.github/workflows/ci-build.yml` | **Does not exist** | Create workflow: `pnpm install --frozen-lockfile` → `pnpm build` (11/11) | Gate builds on PR/main | Turbo, pnpm | Green on Phase 9 baseline | Low |
| 11 | `.github/workflows/ci-typecheck.yml` | **Does not exist** | Create workflow: `pnpm typecheck` (10/10) | Type safety gate | Turbo | Green on baseline | Low |
| 12 | `.github/workflows/ci-test.yml` | **Does not exist** | Create workflow: `pnpm test` (18/18) + `pnpm test:integration` (8/8) + `pnpm run test:secret` (10/10) + coverage | Test gate | Vitest, test utils | All suites green; coverage reported | Low |
| 13 | `.github/workflows/ci-security-scan.yml` | **Does not exist** | Create workflow: `pnpm audit` + SAST (CodeQL/gitleaks) + secret scan | Security gate | GitHub Actions secrets, scanners | No high/critical findings (or waived) | R4 |
| 14 | `.github/workflows/ci-docker.yml` | **Does not exist** | Create workflow: build `aios-api` + `aios-web` images; `docker compose config`; smoke `/health` | Docker gate | Docker Hub/GHCR creds | Images build; smoke passes | R5 |
| 16 | `.github/workflows/ci-release.yml` | **Does not exist** | Create workflow (manual dispatch / tag): build artifacts, changelog, semver tag, publish images, deploy verify | Release automation | All prior workflows green | Manual run produces tagged images + release notes | R6 |
| 17 | `turbo.json` | `build`, `typecheck`, `test`, `test:coverage`, `clean`, `dev` tasks; `dependsOn: ["^build"]` | Add `docker:build`, `docker:scan`, `scan` tasks with proper `dependsOn` | Local mirror of CI gates | New scripts in root `package.json` | `turbo run build` etc. work | Low |
| 18 | Root `package.json` | Scripts: `build`, `dev`, `clean`, `typecheck`, `test`, `test:secret`, `test:integration`, `test:coverage` | Add `docker:build`, `docker:scan`, `scan` scripts wiring to tools | CI/local parity | Tooling installed | `pnpm audit` etc. execute | Low |

## W4 — Secrets Management

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 19 | `scripts/setup-tbit-secret.mjs` | Generates root `.env` with HMAC secret+id, encryption secret+id, shared `TBIT_API_KEY===VITE_TBIT_API_KEY`; validates invariants | Add startup validation mode (`--validate-only`) for CI; document rotation strategy in comments; output JSON for CI consumption | CI secret validation; rotation docs | None | `node scripts/setup-tbit-secret.mjs --validate-only` exits 0 on valid `.env` | Low |
| 20 | `apps/api/src/server.ts` (startup) | No explicit secret check at startup (fails later in middleware) | Add early startup self-check: if `NODE_ENV=production`, verify `TBIT_API_KEY` present and non-empty; log structured warning/error via `bootstrapLogger`; optional fail-closed flag | Fail fast in prod if secrets missing | `bootstrapLogger` | Prod container fails to start/ready without key; dev mode warns only | R4 |
| 21 | `.github/workflows/ci-*.yml` | **Does not exist** (greenfield) | All workflows use GitHub Actions secrets for `TBIT_API_KEY`, `TBIT_HMAC_SECRET`, etc.; never echo; mask in logs | No leakage in CI | GitHub secret store | Secret scan clean; no secrets in workflow logs | R4 |

## W5 — Observability

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 22 | `apps/api/src/services/bootstrapLogger.ts` | Structured JSON logger (timestamp, requestId, correlationId, component, endpoint, level, message, exception, stackTrace, metadata); FR-07 unit tests (5) | Extend to cover request lifecycle (new `requestStart`, `requestEnd` methods); add child logger factory for middleware | Unified logging for bootstrap + HTTP | Existing FR-07 tests | Unit tests for new methods; logs appear in `/health` + bootstrap | Low |
| 23 | `apps/api/src/middleware/observability.ts` | **Does not exist** | Create middleware: wraps `bootstrapLogger.requestStart/End`; adds `requestId`, `correlationId` to response headers; logs latency, status | Per-request observability | `bootstrapLogger` extension | `/health` logs show request lifecycle; headers include IDs | Low |
| 24 | `apps/api/src/services/metrics.ts` | **Does not exist** | Create lightweight Prometheus-style `/metrics` endpoint (counters: `http_requests_total`, `http_request_duration_seconds`, `vault_bootstrap_total`; no persistence) | Metrics for monitoring | None (stdlib) | `GET /metrics` returns text format; counters increment | R7 |
| 25 | `apps/api/src/main.ts` | Creates server, starts listening | Conditionally mount `/metrics` route (if `ENABLE_METRICS=true`); mount observability middleware | Feature flag for metrics | `metrics.ts`, `observability.ts` | `/metrics` 200 when enabled; 404 when disabled | Low |
| 26 | OpenTelemetry evaluation | **Not present** | Document evaluation in ECR; if justified, add OTel SDK + auto-instrumentation for Express + Node; instrument `/api/v1/tbit/vault/init` end-to-end | Distributed tracing | `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node` | Trace appears in collector (if integrated); gate: only if justified | R7, R8 |
## W6 — Monitoring

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 27 | `apps/api/src/routes/health.routes.ts` (or inline in `server.ts`) | `/health` returns `{status:"ok", timestamp}` | Add `/livez` (process liveness: always 200 if process alive) and `/readyz` (readiness: secrets present + vault context ready where applicable) | K8s/Compose probe separation | `bootstrapLogger`, secret check | `GET /livez` 200; `GET /readyz` 200 when ready, 503 when not | Low |
| 28 | `docker-compose.yml` (healthchecks) | API: `wget /health`; web: `wget /health` | API healthcheck → `/readyz` (or `/livez` + `/readyz`); web unchanged | Readiness-gated dependency | `depends_on: api: condition: service_healthy` | `web` waits for `api` ready | Low |
| 29 | Alerting configuration | **Does not exist** | Document alert rules (high 5xx, readiness failures, bootstrap failures, secret-missing) and routing stub (e.g., webhook URL env var); no backend code | Operational visibility | CI/env provides webhook URL | Config loads; test alert fires | Low |

## W7 — Release/Rollback

| # | Path | Current State | Required Change | Reason | Dependencies | Validation | Risk |
|---|------|---------------|-----------------|--------|--------------|------------|------|
| 30 | `docs/RELEASES/RELEASE_vX.Y.Z.md` | **Does not exist** for Phase 10 | Create release note template + example for `v0.5.x` (Phase 10) | Release artifact | Version gate | Doc exists after release | R6 |
| 31 | `CHANGELOG.md` | Phase 9 closure entry present | Add Phase 10 stages entries per freeze; final Phase 10 closure entry | History | Stage freezes | Follows Keep-a-Changelog | Low |
| 32 | `VERSION` / `docs/VERSION.md` | `v0.3.0`, Phase 9 Closed | Update only at Phase 10 release gate to `v0.5.x` (per policy) | Version governance | Release gate approval | Updated only after approval | R6 |
| 33 | Rollback runbook | **Does not exist** | Create `docs/OPERATIONS/ROLLBACK.md`: image-tag rollback steps, T-Bit volume snapshot/rollback via existing `@muf/tbit-core` primitives, verification | Operational readiness | `@muf/tbit-core` snapshot API | Doc exists; steps validated in staging | Low |
| 34 | Deployment verification script | **Does not exist** | Create `scripts/verify-deployment.mjs`: runs ST-001 + `/livez`+`/readyz`+`/metrics`; exits non-zero on failure | Post-deploy gate | ST-001 logic, new probes | Script passes on healthy deploy | Low |

---

*End of CHANGE_MATRIX.md — 34 changes across 7 workstreams.*