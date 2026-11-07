# Truco de Boliche

Fuente de verdad: docs/PROMPT_MAESTRO.md completo. Pedido del usuario: fases 0–8 autónomas, sin pedir aprobación entre fases; fase 9 excluida. Leer docs/REPORTES.md y docs/PENDIENTES_HUMANO.md para retomar. No declarar cumplidos criterios sin evidencia.

## Estado
Fases 0/1 integradas; Fase2 lista para merge con pnpmcheck/cobertura/4e2e verdes y capturas revisadas. 40tests, cobertura100% líneas/99,59% ramas, CPU4x60,20FPS/p9516,7ms,272,2KiB gzip. Corregidos eventosSonbuenas que filtraban valor oculto y revelado de cartas innecesarias. Escena Pixi original/rigvectorial, menúReact, SVG/DOMpropias, WebAudio y galerías. Siguiente Fase3: Worker/DOs autoritativos MatchRoom/Matchmaker, identidad localpersistida sin claves, WebSockets, reconexión/timers, salasprivadas y chat/señas, pruebas2/4contextos. Fase4 pendientes arte/voces finales y pulido. No declarar criterios externos sin evidencia.

Servidor persistente `pnpm dev` sesión51067 (si sigue activa), Vite5173/Wrangler8787. Evitar e2e simultáneos: uno puede cerrar el servidor de otro; uno a la vez. Hay herramientas perfil: `tools/frame-baseline.mjs`, `profile.mjs`, `render-counts.mjs` (Chromium, localhost5173). SwiftShader se detecta y usa CanvasdePixi; HW usaWebGL. No volver al dibujo de cientos deGraphics por cuadro: caché fondo/mesa/TV/cartas y rigporpiezas, tanteador separado. Composición/reglas y limitaciones en decisiones/reportes.

## Stack y comandos
pnpm workspaces; TypeScript strict; Vite/React 19, PixiJS 8, GSAP 3, Zustand, CSS Modules y Web Audio; motor puro sin dependencias; zod; Cloudflare Worker y Durable Objects SQLite; Supabase Auth/Postgres/RLS con adaptador local sin claves; Capacitor Android.
Node 24; pnpm i; pnpm dev (Vite 5173 y Wrangler local 8787); pnpm test; pnpm test:coverage; pnpm test:e2e; pnpm lint; pnpm typecheck; pnpm build; pnpm sim --hands 100000; pnpm deploy; pnpm android:sync.

## Convenciones
Una rama codex/fase-N por fase, Conventional Commits pequeños, merge a main con checks verdes. Capturas revisadas en docs/capturas/fase-N, reporte y decisiones actualizados antes del merge. Bloqueos externos no impiden seguir con trabajo independiente. Registrar pendientes humanos con instrucciones exactas. Decisiones visibles marcadas [REVISAR]. No delegar a agentes salvo autorización explícita aplicable.

## Restricciones
Servidor autoritativo; viewFor filtra manos/mazo/semilla. Ficha solo entrada al reparto, nunca transferencia entre jugadores ni premios de valor real. Tutorial gratis; compras solo Android; web vitrina; chat predefinido. No marcas reales ni copiar referencias. Todo texto del producto en locales/es-UY.json. Assets originales o comerciales con créditos. No secretos: .env.local, .dev.vars y keystores ignorados.

## Budgets
60 fps (piso 30 con calidad automática), menú JS+CSS <400 KB gzip, interactivo <4 s en 4G, texturas <256 MB; DPR máximo 2. Pausar audio/render oculto. Controles ≥48 px, texto ≥14 px, foco visible, reduced motion. Matriz: 360x640,390x844,412x915,844x390,768x1024,1024x768,1280x720,1366x768,1920x1080,2560x1440,3440x1440.
