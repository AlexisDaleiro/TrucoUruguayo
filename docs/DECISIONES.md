# Decisiones

## 2026-11-06 — Referencias de composición [REVISAR]
Contexto: los archivos solicitados como 02-1v1 y 03-2v2 contienen respectivamente cuatro y dos personas. Se conservan nombres exactos y se implementa la composición escrita en 6.2. Alternativa descartada: intercambiar archivos o invertir escenas sin dejar registro.

## 2026-11-06 — Desarrollo y publicación
Se respeta Cloudflare/Wrangler del maestro en el repositorio existente, sin registrar un sitio alternativo ni cambiar hosting a Sites. Falta verificar credenciales externas. CI se prepara localmente y solo se declara ejecutada en remoto al tener evidencia.

## 2026-11-06 — Herramientas
Se agregan tsx para ejecutar herramientas TypeScript, ESLint/typescript-eslint para el requisito de lint y tipos oficiales de Node/React/Workers. Son herramientas de desarrollo justificadas por el maestro. Dependencias con versiones exactas y lockfile.

TypeScript fijado a 6 tras fallo real: typescript-eslint 8.72.1 rechaza TS7. No se silenció el chequeo. Documentación oficial Cloudflare consultada: https://developers.cloudflare.com/workers/wrangler/configuration/ . Supabase changelog y guía RLS consultados el 2026-11-06; CLI3 genera el archivo inicial localmente; no se aplica a una base remota sin vincular proyecto.

Despliegue inicial: la revisión automática lo bloqueó hasta verificar el destino. `wrangler deployments list --name truco-de-boliche` devolvió 10007 (no existe). Con esa evidencia se autorizó crear el Worker nuevo; no se reemplazó servicio previo.

## 2026-11-06 — Flags y señas [REVISAR]
Se agregan `pardaLead` (opener por defecto, alternativa mano) y `florBothMode` (comparison) para identificar las variantes [VALIDAR]. `florEnvido` y `echarLosPerros` se rechazan explícitamente al activarlos, porque el maestro los excluye de v1. Señas provisionales: 1B = tocar mentón; 7O = levantar solo ceja izquierda. Alternativa descartada: reutilizar gestos de otras cartas.

Turnos internos avanzan +1: índices ordenados antihorario; el mapeo de pantalla respeta este orden. El motor recibe el orden de mazo como entrada; el servidor conserva el orden completo en su registro privado y usa Fisher-Yates criptográfico sin sesgo de módulo. No se envía ninguna fuente aleatoria a `viewFor`.

## 2026-11-06 — Práctica local gratuita [REVISAR]
La vertical slice expone práctica sin costo en el menú y `?local=1`. Se distingue de partidas con entrada del servidor (Fase 3/5); no permite inventar fichas ni acreditar progreso competitivo. Los gráficos actuales son placeholders vectoriales originales con rig cutout, según 6.3. Alternativa descartada: fotos de referencia como fondo del producto.

Las cartas de la mano propia se dibujan en SVG dentro de botones DOM alineados a las manos del primer plano, para accesibilidad/teclado. Cartas jugadas, muestra y mazo están en Pixi. Ninguna carta interactiva se duplica en una barra desconectada del escenario.

CI fijada en Ubuntu 24.04 para evitar cambios de imagen durante la migración ubuntu-latest a 26.04. Las fuentes se alojan con licencias OFL; no se agrega una dependencia de tipografía.

## 2026-11-06 — Renderer adaptativo [REVISAR]
Perfil real: Chromium usa ANGLE/SwiftShader por software. Con CPU4x la primera escena dio7FPS; cachear fondo/mesa dio16, quitar MSAA23, Canvas nativo43 y cachear el rig por piezas60. Se selecciona Canvas de Pixi8.22 cuando WebGL es software o no hay aceleración identificable; WebGL en hardware. No se reduce ni se finge la medición del test. Texturas estáticas a1x y piezas a2x; expresiones invalidan su caché al cambiar, respiración transforma las piezas ya cacheadas. Tele y efectos siguen en capas dinámicas.

## 2026-11-06 — Autoridad y cuentas locales
Sin claves, Accounts (Durable Object SQLite) conserva perfiles y sesiones opacas en cookie HttpOnly/SameSiteStrict. MatchRoom conserva mazo/auditoría y emite exclusivamente `viewFor`. La reserva de entrada de todos los humanos sucede en una sola transacción antes del reparto y usa matchId único; un reintento no duplica la entrada. Las intenciones tienen UUID y secuencia; las mutaciones de sala se serializan para conservar primera respuesta válida. Chat y señas no reinician el tiempo de turno.

Con claves, el SDK oficial Supabase verifica `getClaims` (JWKS), issuer y audience; la vinculación usa `linkIdentity` sobre el invitado. No se usa metadata editable como autorización. Un UID ya vinculado a otro perfil se rechaza antes de unir saldos; alternativa descartada: acreditar varias bienvenidas al enlazar invitados repetidos. Producción contra Supabase requiere proyecto y migraciones aplicadas; no se declara probada con credenciales ausentes.

Fuentes técnicas consultadas: https://developers.cloudflare.com/durable-objects/best-practices/websockets/ ; https://supabase.com/docs/guides/auth/auth-anonymous ; https://supabase.com/docs/guides/auth/jwts .

## 2026-11-06 — Arte generado y pipeline
Se usó ImageGen nativo para arte original del proyecto, sin copiar personajes, logo, assets ni composición de la referencia de estilo. Archivos originales en assets-src; prompts y mapas de celdas en docs/arte/PROMPTS_IMAGENES.md. Los outputs se copiaron al repo conservando originales de Codex.
Sharp se declara como herramienta de desarrollo para recorte, limpieza de alpha, alineado y versiones1x/2x; complementa AssetPack, que ya lo usa internamente. No llega al runtime del juego. El script opcional cpu-features, transitivo del soporteSSH de AssetPack, se desactiva: no se usa SSH para producir atlas.
## Fase4: alcance de arte y audio
Se usó ImageGen nativo disponible para producir arte original sin esperar generación humana. Fondos y objetos combinan textura original con dibujo por código; no se convierten dibujos vectoriales terminados en placeholders por no provenir de un generador. Dos bases + cuatro hojas de expresiones y pared se conservan en assets-src. Las fuentes entregadas fueron1254px/1672px; el pipeline alinea @1x/@2x sin prometer detalle2048 inexistente.

[REVISAR] La música y ambiente son composición/síntesis original procedural, no pistas descargadas. Se prioriza mezcla ligera y presupuesto. El shader de humo se omite por ahora; polvo, luz y CRT conservan el ambiente. Azure S0 requiere cuenta/facturación/key del humano; el pipeline no usa F0 ni otra API paga como sustituto. Se continúa con Fase5–8 sin declarar cumplida la aceptación «cero placeholders/voces finales».

## Fase5: economía y verificación SQL
[REVISAR] Las salas privadas entre humanos se califican igual que matchmaking: el maestro solo excluye bots iniciales, no privados. Reemplazos posteriores conservan elegibilidad. Abandono explícito da derrota/XP20; no se penaliza como abandono la desconexión recuperable. Bonos de XP limitados a10 por partida; ninguna recompensa de resultado añade fichas. Las horas de regeneración no se guardan por encima del tope5, incluida la bienvenida10. La semana usa lunes00:00 America/Montevideo.

Se agrega PGlite solo como dependencia de desarrollo para ejecutar migraciones, funciones, triggers y pruebas RLS con PostgreSQL real en WASM, porque no hay Docker/psql local. No llega al navegador ni sustituye Supabase en producción. Autenticación remota sigue pendiente de proyecto/claves. No se declara cobertura de los servicios auth de Supabase por probar SQL aislado.

La CI Linux reveló @ffmpeg-installer/linux-x64 transitivo de la funcionalidad de video no usada de AssetPack. Su script se desactiva explícitamente (igual que cpu-features), sin aprobar scripts globalmente. El generador de voces usa ffmpeg/ffprobe del sistema, ya disponibles localmente.

[REVISAR] El entorno inicial sigue la composición de la mesa (1vs1día/2vs2noche) hasta que el jugador equipa uno explícitamente. La elección queda en loadout con variante base y puede forzarse por anfitrión en privados, respetando desbloqueos. La práctica no acredita XP. Diagnóstico Sentry/PostHog exige consentimiento opcional; sin replay/autocaptura, con IDsesión efímero y filtrado de datos. Sentry11 usa dataCollection y se carga bajo demanda; PostHog usa su API pública nativa para evitar un SDK innecesario. No se aprovisiona otro hosting ni proveedor de comercio: el usuario fijó Cloudflare y compras solo Android y autorizó seguir sin cuentas.

## Fase 6

- La práctica offline guarda la declaración 13+ en el dispositivo y usa el mazo visual de baja resolución. El alta de una cuenta y las fichas requieren red.
- El feedback pide un perfil habilitado, guarda el comentario 90 días y limita frecuencia por cuenta y en total. La consulta de mensajes requiere una clave operativa.
- El matchmaking persiste los participantes y el código de sala antes del reparto. Repite la misma operación si pierde la respuesta. La pestaña conserva el ticket al recargar y los tickets simultáneos del mismo perfil comparten asiento.
- Para abrir el WebSocket el cliente pide un permiso de 20 segundos de un solo uso. Así se conserva la verificación del usuario de Supabase en HTTP aunque el WebSocket del navegador no permita adjuntar el JWT.
- Los bots ponderan las señas recibidas como evidencia parcial. Las declaraciones públicas de tantos, las flores anunciadas y las cartas conocidas son restricciones. La práctica calcula la decisión fuera del hilo de dibujo.
- El menú conserva la tele animada, el personaje en reposo y el ambiente con una escena DOM/SVG. Pixi se carga al abrir la mesa, donde se necesitan las interacciones y el rig completo. Las fuentes conservan todos sus caracteres en WOFF2.

## Fase 7

- Identificador de paquete `uy.trucodeboliche.app`. El build de prueba conserva IDs de demostración de AdMob aunque el Worker se configure más tarde. La unidad real requiere habilitarla en el build.
- Los anuncios requieren declaración 18+ solo al pedir un anuncio, sin guardar fecha de nacimiento. No se solicitan anuncios en una mesa activa.
- El cosmético mensual del Pase es un sello coleccionable en el perfil. La suscripción no modifica el saldo y la entrada se registra con valor cero mientras esté vigente.
- El webhook de compras deduplica consumibles por transacción de Play y el Pase por evento de RevenueCat. El servidor reconoce exclusivamente los productos y el entorno configurados.

## Pulido de escena y Google

- La última baza permanece sobre la mesa hasta que empieza la siguiente o se reparte otra mano. Esto mantiene visible la carta de cierre y permite animarla aunque el motor ya haya vaciado la baza activa.
- La portada conserva el acceso de invitado. El alta muestra Google cuando la configuración del servidor habilita Supabase. Opciones explica su ausencia en el modo local. El retorno cancelado muestra un aviso y permite seguir desde la portada.
