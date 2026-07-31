# Web App Build Fix Plan - Phase 4

## Error Categories & Fix Strategy:

### 1. Missing Modules/Files (CREATE MISSING FILES)
- [ ] Create `src/api/tbit/types.ts` - needed by assetManagerClient.ts
- [ ] Create `src/lib/tbit/fractalProjection.ts` - copy from aios-mvp (needed by tbitChatClient.ts, useTBitCognitiveStore.ts)
- [ ] Create `src/api/tbit/encryptionClient.ts` - needed by EncryptionKeyPanel.tsx
- [ ] Fix `src/api/tbit/tbitRegistrationClient.ts` import path in useSession.ts (wrong path)
- [ ] Create `src/lib/tbit/computableMemory.ts` - needed by computableMemory.ts
- [ ] Create `src/lib/tbit/symbolicEngine.ts` - needed by symbolicEngine.ts
- [ ] Create `src/components/tbit/components/QuantumTelemetryRay.tsx` - needed by CognitiveQuantumRay.tsx
- [ ] Export `useTBitCognitiveStore` and `useTBitStore` from stores correctly

### 2. Missing Exports (ADD EXPORTS)
- [ ] Add `getLocalApiKey` export to `tbitApiHeaders.ts` (used by networkSyncClient.ts)
- [ ] Add missing lucide-react icons: `Brain`, `GitBranch`, `Trash2`, `Plus` imports

### 3. Type Errors (FIX TYPES)
- [ ] Add proper type annotations for implicit `any` parameters in components
- [ ] Handle possibly null values (selectedAsset, selectedNode, selectedDoc, etc.)
- [ ] Fix KVEntry type to include `expiresAt` property
- [ ] Fix Three.js version mismatch - align @types/three version in package.json
- [ ] Fix React Three Fiber component types (SVGLineElement vs Line)
- [ ] Fix Three.js API issues: `dashOffset` -> use `dashOffset` via userData, `damping` -> `enableDamping` + `dampingFactor`

### 4. Import Path Fixes
- [ ] Fix import paths for `useTBitCognitiveStore` and `useTBitStore` (wrong relative paths)
- [ ] Fix `networkSyncClient` import in TBitNetworkPanel.tsx
- [ ] Fix `tbitRegistrationClient` import in useSession.ts

## Fix Order:
1. First: Create missing type files and core lib files
2. Second: Fix tbitApiHeaders export (getLocalApiKey)
3. Third: Fix store exports and import paths
4. Fourth: Fix component imports and type errors
5. Fifth: Fix Three.js version conflicts
6. Sixth: Fix React Three Fiber component issues
7. Seventh: Fix lucide-react imports
8. Finally: Run build to verify