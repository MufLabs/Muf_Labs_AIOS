import io

p = r"d:\Ai_tools\Muf_Labs\docs\AIOS_Book.md"
s = io.open(p, encoding="utf-8").read()

old1 = (
    "| QuantumEngine 3D | `apps/web/src/views/quantum/` | \u23f3 Pendiente (Fase 6) |\n"
    "| QVault UI | `apps/web/src/panels/` | \u23f3 Pendiente (Fase 6) |\n"
    "| 14 Paneles UI | `apps/web/src/panels/` | \u23f3 Pendiente (Fase 6) |"
)
new1 = (
    "| QuantumEngine 3D | `apps/web/src/components/qvault/` + `tbit/` | \u2705 Completado (Fase 6) |\n"
    "| QVault UI | `apps/web/src/components/qvault/QVaultView.tsx` | \u2705 Completado (Fase 6) |\n"
    "|  | 16 Paneles UI | `apps/web/src/components/tbit/` | \u2705 Completado (Fase 6) |"
)
assert old1 in s, "mapping rows not found"
s = s.replace(old1, new1, 1)

old2 = (
    "## Fase 6 \u2014 Migrar UI y visualizaci\u00f3n 3D  \u23f3 PENDIENTE\n"
    "\n"
    "- QuantumEngine 3D (React Three Fiber)\n"
    "- QVault 3D limpio\n"
    "- 14 paneles de gesti\u00f3n\n"
    "- Stores (useTBitStore, useTBitCognitiveStore)\n"
    "- Clientes API (todos los *Client.ts)"
)
new2 = (
    "## Fase 6 \u2014 Migrar UI y visualizaci\u00f3n 3D  \u2705 COMPLETADO (30-Jul-2026)\n"
    "\n"
    "**En simple:** El motor cu\u00e1ntico visual de T-Bit ya est\u00e1 conectado y accesible desde la app web. La vista estrella \u2014 **Q-Vault 3D Engine** \u2014 renderiza la topolog\u00eda de memoria en una escena 3D interactiva (React Three Fiber) o un mapa 2D, con buscador, panel de detalle del nodo y bot\u00f3n \u201cRecall\u201d que trae el contenido real desde el backend. Adem\u00e1s se integraron los 6 paneles de telemetr\u00eda cu\u00e1ntica/3D y los 10 paneles de gesti\u00f3n de subsistemas, todos navegables desde la barra lateral agrupada.\n"
    "\n"
    "### Vistas 3D / Quantum integradas (`apps/web/src/`)\n"
    "\n"
    "- **`components/qvault/QVaultView.tsx`** \u2014 vista estrella del QuantumEngine:\n"
    "  - Escena 3D (`QVaultScene3D`, R3F) y proyecci\u00f3n 2D (`QVaultMap2D`) conmutables.\n"
    "  - Alimentada por el hook real `useMemoryGraph(\"user-001\", true)` \u2192 `memoryCoreClient` (API T-Bit real, con fallback demo).\n"
    "  - Toolbar: t\u00edtulo + contador de nodos, filtro por key/tag, toggle 3D/2D, toggle Links, toggle Anti-Vits.\n"
    "  - Panel de detalle del nodo: source, updatedAt, checksum, tags, links/backlinks navegables (clic salta entre nodos).\n"
    "  - Acci\u00f3n \u201cRecall Content\u201d \u2192 `memoryCoreClient.recall(key)` muestra el contenido real recuperado.\n"
    "  - Estado reactivo v\u00eda `useSyncExternalStore` + `tbitCognitiveStore`.\n"
    "- **`components/tbit/QuantumTelemetryRay.tsx`** \u2014 rayo/telemetr\u00eda cu\u00e1ntica 3D.\n"
    "- **`components/tbit/WikiLinksMesh.tsx`** \u2014 malla 3D de WikiLinks.\n"
    "- **`components/tbit/NetworkTopologyView.tsx`** \u2014 topolog\u00eda de red 3D.\n"
    "- **`components/tbit/TBitCognitiveTelemetry.tsx`** \u2014 telemetr\u00eda cognitiva + `emitTBitCanvasAction`.\n"
    "- **`components/tbit/TBitNetworkPanel.tsx`** \u2014 panel de red T-Bit.\n"
    "\n"
    "### Paneles de gesti\u00f3n (subsystem panels)\n"
    "\n"
    "Los 10 paneles ya exist\u00edan (`components/tbit/*Panel.tsx`) pero no estaban cableados a la navegaci\u00f3n. Ahora todos cuelgan del sidebar:\n"
    "`ContainerHealthPanel`, `AiPermissionsPanel`, `EncryptionKeyPanel`, `AssetManagerPanel`, `BinaryAssetPanel`, `KVStorePanel`, `MemoryGraphPanel`, `QueryIndexPanel`, `MarkdownImportPanel`, `GuardianObserverPanel`.\n"
    "\n"
    "### Navegaci\u00f3n agrupada (`apps/web/src/App.tsx`)\n"
    "\n"
    "- `PanelConfig` extendido con `group` tipo `\"3D / Quantum\" | \"Management\"`.\n"
    "- Array `PANELS` reorganizado en dos grupos; Q-Vault 3D como panel por defecto.\n"
    "- Sidebar con cabeceras de grupo (`nav-group-label`) e iconos SVG hexagonales para los paneles 3D.\n"
    "- `activePanel` por defecto = `\"qvault\"` (QuantumEngine como landing visual).\n"
    "- Componentes 3D sueltos importados por ruta directa (no en el barrel); paneles de gesti\u00f3n v\u00eda barrel `./components/tbit`.\n"
    "\n"
    "### Estilos\n"
    "\n"
    "- `apps/web/src/styles/tbit-panels.css` \u2014 reglas `.nav-group`, `.nav-group-label` y sangr\u00eda de items en grupo.\n"
    "\n"
    "### Verificaci\u00f3n de build\n"
    "\n"
    "`npm run build` \u2192 **10 successful, 10 total** (2248 m\u00f3dulos web transformados, bundle 1.47 MB / 397 KB gzip, CSS 44 KB). Sin errores de TypeScript ni Vite. El tama\u00f1o crece respecto a las 1680 m\u00f3dulos pre-Phase-6 porque ahora todo el motor 3D (R3F + three.js) y los 10 paneles entran al bundle al importarse desde el entry.\n"
    "\n"
    "### Pendiente dentro de la Fase 6 (no bloqueante)\n"
    "\n"
    "- Code-splitting / lazy-load de paneles 3D pesados (vite warning \u201cchunk > 500 kB\u201d) para reducir el bundle inicial.\n"
    "- `tbitRuntimePaths` \u2192 `packages/shared` (ver mapeo).\n"
    "\n"
    "### Stores y clientes API\n"
    "\n"
    "- Stores (`useTBitStore`, `useTBitCognitiveStore`) y clientes API (todos los `*Client.ts`) ya exist\u00edan; ahora est\u00e1n efectivamente en uso desde el entry de la app."
)
assert old2 in s, "phase6 section not found"
s = s.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(s)
print("WROTE", len(s))