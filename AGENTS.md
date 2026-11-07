# Truco de Boliche — continuidad del trabajo

## Fuente de verdad y autorización
Leer docs/PROMPT_MAESTRO.md. El usuario autorizó ejecutar fases 0 a 8 autónomamente y reemplazó cualquier pedido de aprobación entre fases. No ejecutar fase 9. No detenerse por cuentas, claves, imágenes o pagos: registrar pasos exactos en docs/PENDIENTES_HUMANO.md y seguir con adaptadores locales/placeholders. Detenerse solo cuando TODO el trabajo restante dependa del humano. No declarar cumplidos criterios sin evidencia. No delegar a agentes salvo autorización explícita aplicable.

## Estado actual
Fases 0, 1 y 2 en main. Fase 3 en codex/fase-3, lista para cierre/merge con checks verdes y capturas revisadas. Ver docs/REPORTES.md para evidencia y límites. CI Fase2 42321029588 verde. Próxima fase: 4, producción/integración de arte y audio; luego 5 a 8 sin paradas.

Fase3: Accounts/MatchRoom/Matchmaker SQLite, invitados locales persistidos, entradas, lobby, privados/equipos, matchmaking12s, Hibernation WS, turnos25s y gracia45s, chat/señas, reconexión, UUID/seq. 59 tests, cobertura motor100% líneas/99,63% ramas. Pase completo10e2e + nuevas pruebas de lobby y cancelación verdes (12 casos únicos). Partidas completas con2/4contextos. Capturas en docs/capturas/fase-3 revisadas. CPU4x60,29FPS/p9516,8ms. JS+CSS332,1KiB gzip, contando también SDK Supabase opcional. Auth Google/Supabase remota sin probar: faltan proyecto/claves. Datos aún en Accounts local; completar adaptador remoto/meta en Fase5.

## Comandos
Node24; pnpm11.25.0; pnpm i; pnpm dev (Vite5173 y Wrangler8787); pnpm check; pnpm test; pnpm test:coverage; pnpm test:e2e; pnpm build; pnpm sim --hands 100000; pnpm deploy; pnpm android:sync.
En Windows pnpm necesita enlaces simbólicos/permisos adecuados. Usar escalación de herramientas cuando el sandbox bloquee enlaces/procesos, sin leer ni imprimir secretos.
Para capturas de cierre: definir CAPTURE_PHASE=N antes de pnpm test:e2e. Sin esa variable las capturas van a test-results/capturas; no sobrescribir evidencia histórica. tools/contact-sheet.py docs/capturas/fase-N [prefijo] genera hojas de contacto. Revisarlas con view_image.
Playwright inicia Worker y Vite por separado y espera /api/health; no ejecutar suites e2e simultáneas. No modificar cliente/servidor mientras corre una prueba de navegador porque HMR/reinicio cambia la sesión. El proxyVite puede emitir ECONNABORTED al cerrar contextos deliberadamente.

## Stack
pnpm workspaces, TypeScript strict; React19/Vite, Pixi8, GSAP3, Zustand, CSS Modules y Web Audio. Motor puro sin dependencias. Protocolo zod. Worker/Durable Objects SQLite y Supabase Auth/Postgres/RLS con alternativa local. Android Capacitor. Vitest, fast-check, Playwright y GitHub Actions.

## Convenciones y restricciones
Una rama codex/fase-N, commits Conventional Commits pequeños, reporte/capturas/checks y merge a main al cerrar. Decisiones en docs/DECISIONES.md; visibles para jugadores se marcan [REVISAR] en reportes. Nunca secretos, .dev.vars, .env.local ni keystores en Git. No mover ni borrar trabajo ajeno.
Servidor autoritativo: manos ajenas, semilla y mazo nunca salen en snapshots. Son buenas no expone el tanto oculto; al cerrar se muestran solo cartas justificantes. Cuenta/fichas/inventario se validan en servidor. Ficha solo entrada, nunca transferencia ni premios de valor real. Tutorial gratis. Compras solo Android; web vitrina; anuncios opcionales recompensados. Chat solo frases predefinidas. Bots no se rotulan dentro de la mesa y no cuentan en ranking si rellenaron al inicio.
Todo texto del producto en locales/es-UY.json. Arte original o con licencia comercial y CREDITS.md. Primera referencia solo estilo: no copiar personajes/logo/assets/composición. Se conservaron nombres de referencias, aunque fotos2/3 están invertidas respecto a su contenido: manda sección6.2.

## Rendimiento y QA
60FPS, piso30 con calidad automática; menúJS+CSS<400KiB gzip, interactivo<4s4G, texturas<256MB, DPRmáximo2. Pausar audio/render oculto. Controles>=48px, textos>=14px, foco/lectores de pantalla y reduced motion.
Matriz: 360x640,390x844,412x915,844x390,768x1024,1024x768,1280x720,1366x768,1920x1080,2560x1440,3440x1440.
SwiftShader usa Canvas de Pixi; hardware usa WebGL. Mantener caché de fondo, mesa, carcasaTV, cartas y partes del rig. Tanteador separado: no reconstruir escena completa al puntuar. tools/frame-baseline.mjs, profile.mjs y render-counts.mjs perfilan un servidor local existente. No llamar aprobado al rendimiento de Android físico sin probarlo.

## Pendientes técnicos independientes para fases siguientes
Fase4: prompts/rigs/manifest de arte, pipeline AssetPack; vozAzureSSML con hash/ffmpeg/sprites, mezcla/música/ambientes originales y lip-flap; checklist de animación. Pulir capas de brazos, clip de vetas de mesa, tamaños de textos y gesto/confirmación en práctica local. Imágenes/voces finales faltantes se registran al humano, sin bloquear fases5–8.
Fase5: regeneración/ledger append-only/refund de error antes de primera mano, resultados idempotentes/XP/Elo/ranking horarioMontevideo, catálogo/loadout, onboarding13+/apodo/tutorial, opciones persistidas, legales/borrado, observabilidad opcional; adapter Supabase y RLS. No presentar XP de práctica como progreso acreditado.
Fase6: PWA/feedback, Lighthouse/publicación y datos de beta; mejorar determinización de bots para incluir cartas ya jugadas y restricciones de declaraciones/señas (actualmente aproximación Monte Carlo heurística). Repetir simulación si cambia política.
Fase7: Capacitor/Android, AdMob SSV y RevenueCat verificados en servidor, firma/AAB y pruebas físicas externas. Fase8: material de ficha y guías Play Console; pasos de cuenta/testers/publicación los hace humano.
