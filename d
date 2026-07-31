# -*- coding: utf-8 -*-
import io, sys

PATH = r"d:\Ai_tools\Muf_Labs\docs\AIOS_Book.md"
s = io.open(PATH, encoding="utf-8").read()

OLD_PHASE3 = """## Phase 3 — Flujo de registro de usuario (First-run setup)  ❌ NO INICIADA

- Pantalla de bienvenida/registro en el primer inicio
- Creación de espacio T-Bit por usuario
- Generación de claves de cifrado
"""

NEW_PHASE3 = """## Phase 3 — Flujo de registro de usuario (First-run setup)  ✅ COMPLETADO (30-Jul-2026)

Implementado el flujo completo de primer arranque: generación de claves de cifrado, creación persistente de espacio T-Bit, endpoints de setup, cliente frontend y wizard de onboarding.

### Backend (paquete `@muf/tbit-core`)

- **`packages/tbit-core/src/EncryptionKeyManager.ts`** — generación real de claves (ya no depende de variables de entorno):
  - `generateEncryptionKey(keyId?)` — genera un secreto AES-256-GCM de 48 caracteres con `randomBytes` y lo persiste en el archivo `encryption-keyring.json`.
  - `getActiveEncryptionKeyAsync()` — resuelve la clave activa desde el **keyring persistente primero**, con fallback a variables de entorno.
  - `activateStoredKey(keyId)` — cambia la clave activa.
  - `isEncryptionConfigured()` — indica si hay alguna clave disponible (usado por `/setup/status`).
- **`packages/tbit-core/src/tbitRuntimePaths.ts`** — persistencia del manifiesto de espacio:
  - `createSpaceManifest({spaceId,label,userId})` — crea el árbol de directorios del espacio (`rootDir`, `snapshotsDir`, `replicasDir`, `aiReplicasDir`) y escribe un `space.json` real (`version: "space-manifest-v1"`).
  - `listSpaceManifests()` — enumera los espacios persistidos (usado por `/setup/status`).
- Exportados vía `packages/tbit-core/src/index.ts`.

### API (`apps/api`)

- **`apps/api/src/services/TBitService.ts`**:
  - `getSetupStatus()` → `{initialized, encryptionConfigured, spacesCount}` (estado autoritativo del servidor).
  - `bootstrapSetup({userId,label,generateKey})` → orquesta el primer arranque: genera clave (si procede) → crea manifiesto de espacio → recupera almacenamiento → devuelve `{containerId, spaceId, label, manifest, encryptionKeyId, ready}`.
  - `createContainer` ahora usa `getActiveEncryptionKeyAsync()` y `createSpaceManifest()`.
- **`apps/api/src/controllers/TBitController.ts`** — handlers `getSetupStatus` y `bootstrapSetup`.
- **`apps/api/src/routes.ts`** — rutas registradas:
  - `GET  /api/v1/tbit/setup/status`
  - `POST /api/v1/tbit/setup/bootstrap`

### Frontend (cliente + hook)

- **`apps/web/src/api/tbit/tbitRegistrationClient.ts`**:
  - `bootstrap(userId,label,generateKey=true)` ahora llama al nuevo endpoint de setup (antes usaba un `userId` codificado).
  - `getSetupStatus()` — consulta el estado del servidor.
  - `getUserId()` — recupera el id de usuario persistido en `localStorage` (`tbit:userId`).
  - Tipos exportados: `SetupStatus`, `SetupBootstrapResult`.
- **`apps/web/src/hooks/useSession.ts`** — eliminado el `USER_ID = 'user-001'` codificado; `initSession(userId, projectPath?)` ahora recibe el id de usuario del wizard. El bootstrap de primer arranque usa el nuevo endpoint.

### Wizard de onboarding (UI)

- **`apps/web/src/components/OnboardingView.tsx`** — wizard multistep:
  1. `welcome` — explica lo que se creará (manifiesto de espacio, clave AES-256-GCM, contenedor cifrado) con checklist.
  2. `profile` — pide el **user id** (requerido) y una etiqueta opcional de espacio, con Enter-to-submit.
  3. `creating` — spinner mientras `bootstrap()` ejecuta el endpoint de setup.
  4. `done` — muestra el containerId y etiqueta resultantes.
  5. `error` — muestra errores del backend con opción "Try again".
  - **Auto-skip al montar:** llama a `getSetupStatus()`. Si `initialized` y ya hay `userId`, omite el wizard por completo (las instalaciones existentes no se interrumpen; solo los first-runs reales ven el wizard).
- **`apps/web/src/styles/onboarding.css`** — estilos del wizard usando los design tokens del proyecto (`--bg-card`, `--accent-primary`, `--radius-lg`, tema oscuro, spinner con animación, focus rings).
- **`apps/web/src/App.tsx`** — añadido `onboarded` state (inicializado desde `localStorage('tbit:activeContainerId')`) que renderiza `<OnboardingView>` antes del control plane principal cuando `!onboarded`.

### Edge cases cubiertos

- Validación de user id vacío.
- Errores del backend se muestran con opción de reintentar.
- Si el endpoint `/setup/status` no responde, se hace fallback a la pista del cliente (`localStorage`).
- Instalaciones ya inicializadas se saltan el wizard.

### Verificación de build

`npm run build` → **10 successful, 10 total** (1680 módulos web transformados, incluido el nuevo wizard). Sin errores de TypeScript ni Vite.
"""

assert OLD_PHASE3 in s, "OLD_PHASE3 not found"
s = s.replace(OLD_PHASE3, NEW_PHASE3, 1)

OLD_CHECKLIST = """- ✅ Phase 2 — Frontend conectado a API real
- ✅ Phase 4 — Build completo del monorepo verificado
"""

NEW_CHECKLIST = """- ✅ Phase 2 — Frontend conectado a API real
- ✅ Phase 3 — First-run setup completo (generación de claves, manifiesto de espacio, endpoints /setup, wizard OnboardingView)
- ✅ Phase 4 — Build completo del monorepo verificado
"""

assert OLD_CHECKLIST in s, "OLD_CHECKLIST not found"
s = s.replace(OLD_CHECKLIST, NEW_CHECKLIST, 1)

io.open(PATH, "w", encoding="utf-8").write(s)
print("WROTE", len(s))