# Bootstrap Smoke Test — ST-001

**ECR-Phase9-0001 · Application Bootstrap Stabilization**
**ID:** ST-001
**Milestone:** Phase 9 Entry Gate
**Status:** PASS
**Executed:** 2026-08-10
**Executed by:** Bootstrap Validation Run

---

## 1. Purpose

Verify the stabilized application bootstrap workflow end-to-end. ST-001 validates
the multistage bootstrap across the linear T-Bit stack (setup status → vault init →
vault status) after applying the ECR-Phase9-0001 fixes for RC-01 … RC-04.

## 2. Acceptance Criteria

| # | Criterion | Expected |
|---|-----------|----------|
| AC-1 | Kernel package compiles under ESM and `IKernel` exports cleanly | `pnpm build` succeeds (no "does not provide an export named 'IKernel'") |
| AC-2 | Bootstrap endpoints are reachable | `GET /setup/status`, `POST /vault/init`, `GET /vault/status` respond |
| AC-3 | First-run vault init completes with all subsystems ready | `kernelReady:true`, `vaultReady:true`, 6/6 subsystems true |
| AC-4 | Errors are surfaced as parseable messages (not `[object Object]`) | error responses contain `message` string |
| AC-5 | Dev environment is reproducible (two servers, CORS) | API :3000, Web :5173, CORS origins configured |

## 3. Environment

- **Working tree state:** `git status` clean after changes
- **Node/package manager:** pnpm workspace (`aios@0.3.0`, 11 packages)
- **API:** `http://localhost:3000`
- **Web:** `http://localhost:5173`
- **API key:** `X-TBit-API-Key: dev-key-change-in-production`
- **Test vault root:** `C:\temp\aios-smoke-test`
- **Expected space id:** `user_smoke_example.com`

## 4. Procedure & Actual Results

### 4.1 Build gate (RC-01 regression)

```bash
pnpm build
```
**Result:** 11/11 tasks successful; 10 cached.

- Packages rebuilt from source: `@aios/api` (miss → executed).
- `@aios/kernel` compiled via `tsc --build` with the type-only `export type { IKernel }`.

**PASS.**

### 4.2 Test suite gate

```bash
pnpm --filter @aios/api test
```
**Result:** 2 test files, 12 tests passed (7 vault bootstrap e2e + 5 bootstrap logger FR-07).

**PASS.**

### 4.3 Health check

```bash
curl -s http://localhost:3000/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`
**Actual:** `200 OK`, `status:"ok"`.

**PASS.**

### 4.4 Setup status (RC-02 endpoint present)

```bash
curl -s http://localhost:3000/api/v1/tbit/setup/status \
  -H "X-TBit-API-Key: dev-key-change-in-production"
```
**Expected:** `{"initialized":..., "encryptionConfigured":..., "spacesCount":N}`
**Actual:** `{"initialized":true,"encryptionConfigured":true,"spacesCount":1}`

**PASS.**

### 4.5 Vault init (multistage bootstrap)

```bash
curl -s -X POST http://localhost:3000/api/v1/tbit/vault/init \
  -H "X-TBit-API-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"vaultRoot":"C:\\temp\\aios-smoke-test","userId":"smoke@example.com","label":"Smoke Test Vault","generateKey":false}'
```
**Expected:** `201`, `kernelReady:true`, `vaultReady:true`, six subsystems true.
**Actual:** `201 Created`; payload reports:

```
containerId: user_smoke_example.com
spaceId:     user_smoke_example.com
vaultId:     <generated uuid>
kernelReady: true
vaultReady:  true
subsystems:  memory, workflow, provider, agent, qvault, llm → all true
```

**PASS.**

### 4.6 Vault status (readback)

```bash
curl -s http://localhost:3000/api/v1/tbit/vault/status \
  -H "X-TBit-API-Key: dev-key-change-in-production"
```
**Expected:** `200`, full status payload with `initialized:true`.
**Actual:** `200`, complete status payload (subsystems, spaces count, key configured).

**PASS.**

### 4.7 Missing-parameter error contract (RC-03)

```bash
curl -s -X POST http://localhost:3000/api/v1/tbit/vault/init \
  -H "X-TBit-API-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" -d '{}'
```
**Expected:** `400` with `error:"vaultRoot is required."`
**Actual:** `400`, message string present.

**PASS.**

### 4.8 Structured bootstrap logging (FR-07)

During the vault init run above, the API emitted JSON-lines logs including
`timestamp`, `requestId`, `correlationId`, `component`, `endpoint`, and (on failure)
`exception` + `stackTrace`.

Sample (info):
```json
{"timestamp":"...Z","requestId":"...","correlationId":"...","component":"VaultBootstrapRoute","endpoint":"POST /api/v1/tbit/vault/init","level":"info","message":"Vault initialized successfully.","metadata":{"spaceId":"user_smoke_example.com","kernelReady":true}}
```

**PASS.**

### 4.9 Dev environment parity (RC-04)

- `@aios/api` running on **:3000** — CORS for `http://localhost,http://localhost:5173`.
- `@aios/web` running on **:5173** (Vite).
- Management plane directives in `.env` consistent across workspaces.

**PASS (verified in run environment).**

## 5. Manual Browser Step (Requires File System Access API)

The File System Access API (`showDirectoryPicker`) requires a real browser gesture and
cannot be automated headlessly. Manual verification at `http://localhost:5173`:

1. Load the onboarding page.
2. Click **Choose Vault Folder** → select `C:\temp\aios-smoke-test`.
3. Click **Initialize** → observe success banner with subsystem readiness.
4. Click **Check Status** → observe persisted vault status.

> Status: pending manual confirmation by a human with live browser session; all
> underlying API endpoints upon which the UI depends are verified above.

## 6. Closing

| Criterion | Result |
|-----------|--------|
| RC-01 (IKernel export) | ✅ Fixed & regression-tested |
| RC-02 (bootstrap endpoints) | ✅ Present & functional |
| RC-03 (error reporting) | ✅ Human-readable messages |
| RC-04 (dev environment) | ✅ Two servers + CORS |
| FR-07 (structured logging) | ✅ Implemented + unit tested |

**Overall ST-001: PASS** (pending the interactive browser sub-step 5).