# Truco de Boliche — continuidad del trabajo

## Fuente de verdad y autorización
Leer docs/PROMPT_MAESTRO.md. El usuario autorizó ejecutar fases 0 a 8 autónomamente y reemplazó cualquier pedido de aprobación entre fases. No ejecutar fase 9. No detenerse por cuentas, claves, imágenes o pagos: registrar pasos exactos en docs/PENDIENTES_HUMANO.md y seguir con adaptadores locales/placeholders. Detenerse solo cuando TODO el trabajo restante dependa del humano. No declarar cumplidos criterios sin evidencia. No delegar a agentes salvo autorización explícita aplicable.

## Estado actual

Fases 0–7 implementadas y verificadas. Beta pública en Cloudflare con versión f019d7a2-bb5c-426a-97d1-9fc03ffb1393. Fase 6 Lighthouse 100, 4G 1,47–1,95 s. Fase 7 AAB y APK de GitHub Actions 42421740690, SDK 36, 89 tests y comprobación local de Android y reconexión. Regresión de carga de Pixi contenida por SceneBoundary y prueba de gracia espera el asiento. Continuar Fase 8, material Play Store y guía de lanzamiento. Ver docs/REPORTES.md, docs/ANDROID.md y docs/PENDIENTES_HUMANO.md.

## Comandos
Node24; pnpm11.25.0; pnpm i; pnpm dev (Vite5173 y Wrangler8787); pnpm check; pnpm test; pnpm test:coverage; pnpm test:e2e; pnpm build; pnpm sim --hands 100000; pnpm deploy; pnpm android:sync; pnpm art:build; node tools/art/verify.mjs; pnpm voices:plan (sin síntesis); pnpm voices:generate (requiere Azure S0/key y pago humano).
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

## Próximas tareas

La tasa de errores de beta con tráfico real depende del consentimiento, claves y participantes. La evidencia sintética está en docs/evidencia/.

Fase 7: Capacitor Android API 36, ciclo de vida/App Links/haptics, callbacks AdMob SSV y RevenueCat idempotentes, AAB e instrucciones de firma. Fase 8: arte/capturas y textos de ficha, borradores IARC/Seguridad, prueba cerrada y lanzamiento. El humano configura cuentas y publica.

No probar providers con datos reales sin claves y cuenta del proyecto. No alterar archivos ajenos en `.unlighthouse`. Las capturas originales se guardan por fase. Subir rama y merge a main con --no-ff tras checks verdes. En Windows el sandbox puede requerir escalación para locks Git y symlinks pnpm.
