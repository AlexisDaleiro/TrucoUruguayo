# Reportes

## Fase 0 — Cerrada (2026-11-06)
Prompt leído completo y movido; referencias copiadas. Monorepo pnpm/TS strict, Vite/React, Wrangler, esquema inicial Supabase con RLS, CI y documentación listos.

Verificado: `pnpm check` verde (lint sin warnings, tipos, 1 test, build); `pnpm test:e2e` verde; 11 capturas revisadas en `docs/capturas/fase-0/` (contacto `revision.jpg`): sin desbordes ni recortes. Menú inicial JS+CSS ≈69,3 KB gzip.

CI remota verde: https://github.com/AlexisDaleiro/TrucoUruguayo/actions/runs/42315839548 . Worker nuevo publicado: https://truco-de-boliche.alexisdaleiro.workers.dev ; página y `/api/health` verificados HTTP 200. Migración generada localmente, aplicación a Supabase pendiente de proyecto/credenciales. Deploy automático pendiente de secrets; deploy manual verificado.

[REVISAR] Composición según sección 6.2 ante referencias con nombres invertidos. Riesgo: UI inicial de infraestructura, todavía no es el juego. La CI avisa acciones Node20 deprecadas y artefacto vacío (capturas sí están versionadas); corregir workflow en siguiente fase.

## Fase 1 — Cerrada con verificación local (2026-11-06)
Motor puro determinista 1v1/2v2: piezas, alcahuete, envido/flor, secuencias de cantos, parda, puntuación inmediata, rotación, tiempos, reglas configurables y proyección privada por asiento. Nuevas manos exigen mazo explícito del servidor. Bots de tres niveles con determinización desde la vista privada y simulador reproducible.

Pruebas: 39 verdes; todos los vectores 4.14 y 250 ejecuciones generativas con partidas completas. Cobertura: líneas/funciones/statements 100%, ramas 99,57%; evidencia en `docs/evidencia/cobertura-motor.json`. `pnpm sim --hands 100000`: 100000 manos, 8241 partidas, 720542 acciones, cero estados ilegales, alto 7380 victorias vs bajo 861 (89,55%), 98,4 s; `docs/evidencia/simulacion.json`.

Capturas fase-1 revisadas: la UI base no cambia en esta fase sin gráficos; matriz completa sin desbordes. `pnpm check`, cobertura y e2e locales verdes; empaquetado Wrangler dry-run verde. CI remota 42316757113 pasó checks y cobertura; sigue instalando Chromium al integrar. Se sigue su resultado durante Fase 2 sin bloquear trabajo independiente. [REVISAR] Señas provisionales de 1B/7O y flags documentados en decisiones. Riesgo: reglas [VALIDAR] requieren jugadores reales; la fuerza medida es entre estos bots, no contra humanos.
