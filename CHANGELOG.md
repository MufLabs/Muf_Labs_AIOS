# AIOS — Changelog

> **All notable lifecycle events** for the AIOS project are documented here.
> Entries follow [Keep a Changelog](https://keepachangelog.com/) conventions.
> Each entry corresponds to a Formal Acceptance & Freeze event.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) for the
implementation surface (per the architecture audit).

---

## [Unreleased]

### 🧊 Frozen — Stage 8.3 (2026-08-06)

**Stage 8.3 — Application Startup & Vault Loader (Frontend)** has been formally accepted and frozen.

#### Added
- `apps/web/src/hooks/useVaultInit.ts` — startup state machine (loading/onboarding/ready/error) and init flow: load config → restore permission → get vault status → set state.
- `apps/web/src/hooks/useVaultPicker.ts` — File System Access API integration + IndexedDB persistence (`idb@^8.0.2`).
- `apps/web/src/api/tbit/tbitVaultClient.ts` — HTTP client for `/api/v1/tbit/vault/init` and `/api/v1/tbit/vault/status`.
- `apps/web/src/types/vault.ts` — `VaultConfig`, `VaultInitRequest`, `VaultInitResponse`, `VaultStatusResponse`, `isFileSystemAccessSupported()` type guard.
- `apps/web/src/AppWrapper.tsx` — startup routing component (LoadingSpinner / OnboardingView / ErrorView / App).
- `apps/web/src/index.tsx` — entry point rendering `<AppWrapper />` in StrictMode.
- `apps/web/src/components/OnboardingView.tsx` — added Vault Selection step; uses `useVaultPicker`; calls `tbitRegistrationClient.bootstrapWithVault`.
- `apps/web/src/App.tsx` — now accepts `vaultConfig: VaultConfig | null` and `onReconfigureVault: () => void` props; removes `localStorage` check.
- `apps/web/vitest.config.ts` — React plugin, `NODE_ENV=test`, setup file, resolve aliases.
- `apps/web/tests/setup.ts` — local setup file (mirrors root `tests/setup-web.ts`).

#### Validation
- **47/47** frontend Stage 8.3 tests passing (15 `useVaultInit` + 19 `useVaultPicker` + 13 `AppWrapper`).
- **72 tests** total across the monorepo.
- **11/11** packages build successfully (`pnpm run build`).
- **TypeScript** compilation clean (`tsc --noEmit` on `@aios/web`).
- Backend regression: `@aios/api` Stage 8.2 e2e 3/3 passing.
- Kernel regression: `@aios/kernel` 1/1 passing.

#### Boundary Contract (Preserved)
- Frontend `useVaultInit` gates the `ready` state on `status.initialized && status.vaultReady` (NOT on `kernelReady`), per Stage 8.2 boundary.
- **`vaultReady=true, kernelReady=false`** held until Stage 8.4.

#### Specification Compliance Audit
- **13/13** Stage 8.3 requirements verified implemented.
- Traceability matrix: see `docs/PHASE8_IMPLEMENTATION_PLAN.md` (Stage 8.3 Freeze Notice) and `docs/AIOS_ENGINEERING_AUDIT_v2.md` (Stage 8.3 Freeze Notice).
- Audit verdict: **FULLY IMPLEMENTED**.

#### Locked
Stage 8.3 architecture, startup flow, validation logic, readiness boundaries, and the following files are **LOCKED** unless an approved Engineering Change Request (ECR) authorizes a modification or a verified defect is discovered:

- `apps/web/src/hooks/useVaultInit.ts`
- `apps/web/src/hooks/useVaultPicker.ts`
- `apps/web/src/AppWrapper.tsx`
- `apps/web/src/index.tsx`
- `apps/web/src/api/tbit/tbitVaultClient.ts`
- `apps/web/src/types/vault.ts`
- `apps/web/src/components/OnboardingView.tsx`
- `apps/web/src/App.tsx`
- `apps/api/src/services/vaultBootstrapService.ts`
- `apps/api/src/routes/tbit-vault.routes.ts`

---

## Frozen — Stage 8.2 (Backend Vault Bootstrap Service) — pre-2026-08-06

(Stage 8.2 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.2 section.)

## Frozen — Stage 8.1 (Client-Side Vault Selection UI) — pre-2026-08-06

(Stage 8.1 freeze predates this changelog. See `docs/PHASE8_IMPLEMENTATION_PLAN.md` Stage 8.1 section.)

---

[Unreleased]: #

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/
