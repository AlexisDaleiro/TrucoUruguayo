# Reportes

## Fase 0 — Cerrada (2026-11-06)
Prompt leído completo y movido; referencias copiadas. Monorepo pnpm/TS strict, Vite/React, Wrangler, esquema inicial Supabase con RLS, CI y documentación listos.

Verificado: `pnpm check` verde (lint sin warnings, tipos, 1 test, build); `pnpm test:e2e` verde; 11 capturas revisadas en `docs/capturas/fase-0/` (contacto `revision.jpg`): sin desbordes ni recortes. Menú inicial JS+CSS ≈69,3 KB gzip.

CI remota verde: https://github.com/AlexisDaleiro/TrucoUruguayo/actions/runs/42315839548 . Worker nuevo publicado: https://truco-de-boliche.alexisdaleiro.workers.dev ; página y `/api/health` verificados HTTP 200. Migración generada localmente, aplicación a Supabase pendiente de proyecto/credenciales. Deploy automático pendiente de secrets; deploy manual verificado.

[REVISAR] Composición según sección 6.2 ante referencias con nombres invertidos. Riesgo: UI inicial de infraestructura, todavía no es el juego. La CI avisa acciones Node20 deprecadas y artefacto vacío (capturas sí están versionadas); corregir workflow en siguiente fase.

## Fase 1 — Cerrada con verificación local (2026-11-06)
Motor puro determinista 1v1/2v2: piezas, alcahuete, envido/flor, secuencias de cantos, parda, puntuación inmediata, rotación, tiempos, reglas configurables y proyección privada por asiento. Nuevas manos exigen mazo explícito del servidor. Bots de tres niveles con determinización desde la vista privada y simulador reproducible.

Pruebas: 39 verdes; todos los vectores 4.14 y 250 ejecuciones generativas con partidas completas. Cobertura: líneas/funciones/statements 100%, ramas 99,57%; evidencia en `docs/evidencia/cobertura-motor.json`. `pnpm sim --hands 100000`: 100000 manos, 8241 partidas, 720542 acciones, cero estados ilegales, alto 7380 victorias vs bajo 861 (89,55%), 98,4 s; `docs/evidencia/simulacion.json`.

Capturas fase-1 revisadas: la UI base no cambia en esta fase sin gráficos; matriz completa sin desbordes. `pnpm check`, cobertura y e2e locales verdes; empaquetado Wrangler dry-run verde. CI remota 42316757113 terminó verde, incluido e2e (9 min por instalación de navegador). [REVISAR] Señas provisionales de 1B/7O y flags documentados en decisiones. Riesgo: reglas [VALIDAR] requieren jugadores reales; la fuerza medida es entre estos bots, no contra humanos.

## Fase 2 — Cerrada localmente (2026-11-06)
Vertical slice 1v1 local contra bot, también práctica2v2 preparada; escena original Pixi, rig cutout vectorial, mesa/objetos/tele procedural, cartas propiasSVG/DOM accesibles y cartas de mesa en canvas. Menú, HUD legal, tanteador de fósforos, fin de partida, atajos, opciones, audio nativo provisorio y galeríasdev. Fuentes localesOFL con créditos.

Verificado al cierre: `pnpm check`, cobertura y 4 e2e verdes (matriz, partida completa a30, galerías y CPU4x). 40 tests; cobertura motor100% líneas/99,59% ramas; último pase60,20FPS/p9516,7ms; build272,2KiB gzip. Matriz completa de menú/mesa, splash, galerías y resultado revisadas en `docs/capturas/fase-2/`. Se corrigieron solapes del menú, brazos ocultos, backendsoftware lento y redibujado completo al puntuar. Privacidad adicional: "Son buenas" no entrega el tanto oculto; se revelan solo cartas que justifican al ganador. Declaraciones en globo secuencial.

[REVISAR] Práctica gratuita y rendererCanvas cuando no hay GPU real. Riesgos: arte/audio son provisorios; animaciones de ambiente, recolección y puntos requieren pasada fina de Fase4. Android físico y carga4G no medidos; producción final y pulido se siguen en Fase4/6/7. El XP mostrado en práctica es una vista previa y aún no se persiste. CI remota de esta rama se sigue durante el próximo trabajo; no se declara completada antes de su resultado.

## Fase 3 — Cerrada localmente; Auth externa pendiente (2026-11-06)
Servidor autoritativo en tres Durable Objects SQLite: Accounts, MatchRoom y Matchmaker. WebSockets hibernables, snapshots por asiento, registro privado de reparto/semilla, secuencias, UUID idempotentes, límites, turno25s, gracia45s, relleno12s/MMR, privados con código/link, equipos elegibles por el anfitrión, chat, señas privadas, bots con señas verdaderas y dificultad por MMR. Invitados persistidos sin cuentas externas; SDK Supabase opcional verifica getClaims/JWKS y vincula Google sobre el invitado.

Verificado: `pnpm check` verde, 59 tests, cobertura100% líneas/99,63% ramas. Pase completo10e2e verde; pruebas posteriores de lobby/equipos, cancelación y búsqueda también verdes (12 casos únicos). Dos y cuatro contextos terminaron partidas a30. Se probó corte/reconexión y una gracia REAL de45s, rechazo de cartas ajenas y acceso de terceros, privacidad de señas, una sola entrada y cancelación antes de un reintento. `wrangler deploy --dry-run` empaqueta los3DOs sin tocar producción.

Capturas revisadas en `docs/capturas/fase-3/`: splash, menú, mesa local, mesas online1v1/2v2 y lobby en11tamaños, búsqueda, reconexión y resultados. Hojas de contacto por grupo. Se corrigió la altura de los rivales laterales y la mesa de noche. Último rendimiento CPU4x60,29FPS/p9516,8ms; todos los chunks332,1KiB gzip.

Riesgos/pendientes: loginGoogle, vinculación y baseSupabase no se declaran probados sin proyecto/claves (pasos en pendientes humanos). Backend de datos sigue local hasta Fase5. Meta/XP, regeneración y reembolso robusto se completan allí. Arte/audio y pequeños ajustes de presentación siguen en Fase4. El proxyVite registra ECONNABORTED al cerrar navegadores de las pruebas; no son errores JavaScript del juego. CI remota de esta rama se sigue tras el push.

CI Fase3 42326065769 completada en verde.

## Fase4 — Integración cerrada; voces externas pendientes (2026-11-06)
Arte original producido con ImageGen nativo: seis hojas Washington/Marta y pared. Rigs PNG alineados, expresiones/señas, brazos por encima de mesa, parpadeo2–6s; barajas Clásica/Celeste originalesSVG y atlasAssetPack1x/2x. Prompts, rig.json, checklist y créditos incluidos. Galerías, animaciones interrumpibles con limpieza de objetos, encuadre y tipografía pulidos. Se revisaron hojas de expresiones y capturas de menú/mesa/local/online/lobby/resultado/galerías en docs/capturas/fase-4.

Audio WebAudio original con seis buses, música procedural adaptativa, ambientes/SFX, paneo y niveles persistidos. Pipeline AzureS0/SSML idempotente por hash, ffmpeg−16LUFS/−1dBTP, spritesOpus/AAC y RMS para lip-flap. Dry-run sin síntesis:968clips pendientes. La galería permite selección de voz/frase y mezcla, indica honestamente que los archivos faltan.

Checks:59tests, lint/typecheck/build verdes; cobertura motor100% líneas/99,63% ramas. Suite12e2e verde4,2min con partidas2/4contextos, privacidad, idempotencia, búsqueda y gracia45s; tras los últimos ajustes de encuadre/recortes, matriz y galerías2e2e nuevamente verdes. CPU4x60,18FPS/p9516,7ms. JS+CSS351,9KiB gzip contando todos los chunks. Atlas alta19,1MiBRGBA (sin pared/caché/renderer), validación automática de bounds/alpha/integridad incluida en build.

[REVISAR] Música y ambientes por síntesis original; humo ruidoso omitido por presupuesto, se conserva luz/polvo/CRT. El arte vectorial original de objetos y figuras permanece como arte del producto. No se declara cumplido «cero placeholders/voces finales»: falta AzureS0/key/facturación y revisión de escucha humana. No se bloquea la siguiente fase por eso, conforme al modo autónomo. Android físico y mezcla final siguen pendientes de validación externa.

CI remota Fase4 42329204153 detectó un script opcional de @ffmpeg-installer/linux-x64 transitivo de AssetPack que no aparecía en Windows. Se desactiva explícitamente: solo se usa AssetPack para imágenes y el pipeline de voces usa ffmpeg del PATH. No se autoriza descarga/ejecución de ese binario. La corrección se verifica en una rama puntual basada en Fase4; no se atribuye verde remoto hasta que termine.

Corrección de CI Fase4 confirmada: ejecución42330529791 de codex/fase-4-ci finalizó en verde, también mergeada en main(a5f9de3).

## Fase 5 — Meta y economía (2026-11-07)

Alta 13+, tutorial de seis pasos gratis, perfil y XP, ranking semanal, fichas con regeneración, tienda de cosméticos y opciones persistidas. El servidor debita la entrada de todos los participantes de forma atómica. Los resultados se acreditan una vez y no dan fichas. El SQL de Supabase se ejecutó en Postgres local con pruebas de RLS, atomicidad, migración e idempotencia; producción puede seguir con el adaptador Durable Objects. Se agregaron documentos, borrado reintentable y telemetría opcional sin datos de cuenta en el cliente.

Verificación: 81 pruebas de código, motor con 100% líneas y 99,63% ramas. De 16 escenarios Playwright, 15 pasaron en la suite y el restante pasó al reejecutarlo con el alta que ahora requiere la UI. También se volvió a probar el borrado por API. Matrices y pasos del tutorial revisados visualmente en `docs/capturas/fase-5/`. CPU 4×: 60,22 FPS, p95 16,7 ms; build base 363,4 KiB gzip de JS/CSS contando todos los chunks.

[REVISAR] Variantes elegibles de Washington/Marta, entorno por defecto según la mesa y cosméticos por nivel; la web queda como vitrina. Diagnóstico desactivado de origen; se verificaron consentimiento, anonimización y baja con destinos simulados. Supabase remoto, Google, proveedores de observabilidad y la identificación del responsable de privacidad quedan en pendientes humanos.

CI de Fase 5 en main: 42335303695, verde.

## Fase 6 — Beta web pública (2026-11-07)

Beta desplegada en el Worker del proyecto. Versión Cloudflare `48c3f96a-8b3f-4812-86b2-63252d09c9e7`. Se verificó salud y una sala pública de prueba con dos cuentas temporales, una entrada por cuenta y cero errores de navegador. PWA instalable con práctica en frío sin red. El formulario de soporte guarda comentarios por 90 días. Búsqueda reanudable tras recargar y recuperable si se pierde la respuesta del reparto.

`pnpm check` verde con 84 tests. Cobertura del motor 100% líneas y 99,64% ramas. Los 18 escenarios Playwright pasaron en la suite completa. Se volvieron a correr y pasaron los escenarios afectados por el menú liviano, WOFF2 y el alta. Matrices de menú, mesa, lobby, offline, soporte y cuenta revisadas en `docs/capturas/fase-6/`.

Lighthouse móvil sobre producción dio 100 en rendimiento, accesibilidad, prácticas y SEO, con LCP 786 ms y TBT 21 ms. En 4G emulada con caché fría, las tres aperturas del alta tardaron 1,95 s, 1,47 s y 1,61 s, sin errores. Menú 158,4 KiB gzip incluyendo Auth opcional. En mesa con CPU 4× se midieron 59,76 FPS y p95 16,7 ms. Simuladas 100.000 manos, 844.672 acciones válidas y 14.083 partidas completas. Nivel alto ganó 64,1% contra el bajo. Evidencia en `docs/evidencia/`.

[REVISAR] El menú anima la tele y el personaje con una escena liviana. Pixi carga al entrar a la mesa. En modo offline las fichas muestran «—» y solo se habilita la práctica. El balance y el umbral de errores menor a 1% se evaluarán con sesiones reales consentidas. El ajuste actual de bots proviene de simulación.

## Fase 7 — Android (2026-11-07)

Capacitor 8.6, API 36, ícono y pantalla de inicio propios. Ciclo de vida para pausa de audio/dibujo, botón atrás, compartir, vibración y App Links. La tienda Android usa AdMob recompensado y RevenueCat con Play Billing. Se verifica firma SSV en el Worker. El máximo diario es cinco anuncios de dos fichas. Consumibles y Pase usan créditos idempotentes y una migración con permisos de servicio.

Validación local con 89 tests, 100% de líneas del motor y 99,64% de ramas. La suite de navegador pasó 19 de 20 en la primera pasada. La última prueba reprodujo un corte durante la carga del dibujo. Se aisló el fallo con una barrera para que se mantenga el estado de la mesa y se verificaron las cuatro regresiones de Android y reconexión. Se revisaron la matriz de la tienda Android, menú, privacidad y mesas en `docs/capturas/fase-7/`. Medición de mesa 60,22 FPS, p95 16,7 ms con CPU 4× en Chromium.

Worker público `f019d7a2-bb5c-426a-97d1-9fc03ffb1393`. Probados sesión Android con una cuenta temporal, saldo inicial 10, borrado, asociación HTTP 200 y rechazo 401 del webhook sin credencial. La respuesta de App Links queda vacía hasta cargar los certificados. Se generaron AAB sin firma y APK debug en el workflow Android 42421740690.

[REVISAR] Los anuncios de prueba quedan separados del build con unidades reales. La declaración 18+ se usa solo para mostrar anuncios. El cosmético mensual del Pase es un sello del perfil. Las pruebas de dispositivo físico, la firma, los anuncios de una unidad propia, las compras de licencia y el enlace certificado quedan en `docs/PENDIENTES_HUMANO.md`.
