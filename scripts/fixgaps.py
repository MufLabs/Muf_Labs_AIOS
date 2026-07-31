import io
p = r"d:\Ai_tools\Muf_Labs\docs\AIOS_Book.md"
s = io.open(p, encoding="utf-8").read()

old2 = "- \u2705 Phase 4 \u2014 Build completo del monorepo verificado\n- \u2705 Phase 4 Extended \u2014 7 paneles UI T-Bit creados"
new2 = (
    "- \u2705 Phase 4 \u2014 Build completo del monorepo verificado\n"
    "- \u2705 Phase 4 Extended \u2014 10 paneles UI T-Bit creados (incluye KVStorePanel)\n"
    "- \u2714\ufe0f Phase 3 \u2014 First-run setup completo (key gen, space manifest, /setup endpoints, OnboardingView)\n"
    "- \u2714\ufe0f Fase 6 \u2014 UI 3D / QuantumEngine + QVault + 16 paneles cableados a la navegacion (build green 2248 modulos)\n"
    "- \u23f3 Fase 7 \u2014 Conectar apps (Docker, descomponer server.ts) \u2014 NO iniciada\n"
    "- \u23f3 Fase 8 \u2014 Testing y despliegue \u2014 NO iniciada"
)
assert old2 in s, "GAP2 not found"
s = s.replace(old2, new2, 1)

st = chr(96)
old4 = "Estado verificado el 2026-07-29: tbit-core compila; kernel, llm y database compilan; Phase 1 (API REST) completada; Phase 2 (frontend hook) completada; Phase 4 (monorepo build) verificado exitosamente."
new4 = (
    "Estado verificado el 2026-07-30: tbit-core, kernel, llm y database compilan; "
    + st + "apps/api" + st + " compila limpio (Phase 1 confirmada: TBitService/TBitController sin errores); "
    "Phase 2 (frontend hook) completada; Phase 3 (first-run setup) completada; "
    "Phase 4 (monorepo build) verificado; Fase 6 (UI 3D / QuantumEngine + QVault + 16 paneles) completada. "
    "Pendientes: Fase 7 (Docker + descomposicion de " + st + "server.ts" + st + ") y Fase 8 (tests de integracion + deploy)."
)
assert old4 in s, "GAP4 not found"
s = s.replace(old4, new4, 1)

io.open(p, "w", encoding="utf-8").write(s)
print("GAPS2+4 FIXED")