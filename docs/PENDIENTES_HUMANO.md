# Pendientes humanos

No pegar secretos en el chat ni en archivos versionados.

## Cloudflare y CI
1. Resuelto: sesión existente válida y Worker nuevo publicado en https://truco-de-boliche.alexisdaleiro.workers.dev (HTTP 200 verificado).
2. Para futuras operaciones que exijan más permisos: ejecutar `pnpm exec wrangler login` y completar el navegador. El Worker público actual ya está desplegado.
3. Para activar despliegue automático, GitHub → repositorio → Settings → Secrets and variables → Actions: secrets CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (Worker edit y Durable Objects); variable CLOUDFLARE_DEPLOY_ENABLED=true.
4. Verificar URL y `/api/health`. El desarrollo local no necesita cuenta.

## Supabase
Crear proyecto; activar login anónimo y proveedor Google. Copiar SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y SUPABASE_SERVICE_ROLE_KEY en `.dev.vars` (solo servidor); aplicar migraciones con CLI tras vincular proyecto. Configurar URLs autorizadas y callback de OAuth. No activar producción hasta probar RLS y vinculación sin pérdida de progreso.

Pasos de Auth: Supabase Dashboard → Authentication → Sign In/Providers → habilitar Anonymous Sign-Ins y Google. En Google Cloud crear cliente OAuth web y autorizar la URL de callback que muestra Supabase. En Supabase URL Configuration, registrar el origen público y `https://TU_DOMINIO/auth/callback`; para desarrollo `http://127.0.0.1:5173/auth/callback`. La app llama `linkIdentity({provider:'google'})` desde el invitado. Probar que el userId, fichas e inventario se conservan. No usar signInWithOAuth para sustituir al invitado en ese paso.

## Validación humana
Revisar reglas [VALIDAR] en docs/REGLAS.md y validar diseño legal/textos con abogado uruguayo antes de publicar. No se declara clasificación legal por implementación técnica.

## Voces Azure y revisión de audio (Fase4)
1. Azure Portal → crear recurso Speech → seleccionar región y plan S0 pago por uso. No usar F0 para este guion comercial.
2. En «Keys and Endpoint», copiar key y región a variables de entorno del equipo: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION y AZURE_SPEECH_TIER=S0. No pegarlas en el chat ni versionarlas. Habilitar facturación/límite de gasto según tu cuenta.
3. Con ffmpeg y ffprobe en PATH ejecutar `pnpm voices:plan` (sin consumo), luego `pnpm voices:generate` (sí consume Azure). El generador consulta las voces disponibles y conserva caché por hash.
4. Levantar `pnpm dev`, abrir /dev/sonidos y escuchar voces en la mesa; verificar pronunciación rioplatense, volúmenes, silencios y lip-flap. Archivos públicos en apps/client/public/assets/voices. Revisar antes de publicar.
5. Arte: las tres referencias y los siete originales de ImageGen ya están copiados. No tenés que copiarlos ni generar las hojas base. Podés revisar diseño/movimientos y pedir cambios; los prompts para reemplazos están en docs/arte/PROMPTS_IMAGENES.md.

## Observabilidad y datos legales (Fase5)
1. Crear proyecto JavaScript en Sentry (plan gratuito) y copiar el DSN público en `VITE_SENTRY_DSN` del entorno de build. No subir tokens administrativos ni claves privadas al cliente.
2. Crear proyecto en PostHog; copiar el project token público en `VITE_POSTHOG_KEY` y el host de ingesta US/EU en `VITE_POSTHOG_HOST` (por ejemplo https://eu.i.posthog.com). No usar personal API key. Reconstruir/publicar el cliente tras cambiar variables VITE.
3. En Opciones activar voluntariamente «Compartir errores y uso anónimo». Probar un error y eventos de prueba; revisar en ambos paneles que no haya apodos, cartas, tokens ni datos de cuenta. Sin consentimiento no se envía nada. No se declara recepción real sin estas cuentas.
4. Antes de lanzamiento comercial, proporcionar nombre/razón social responsable, contacto privado de soporte, domicilio/jurisdicción y plazos de retención de proveedores. Completar/revisar `/privacidad` y `/terminos` con el abogado. Por ahora identifican al equipo del proyecto y enlazan soporte público sin pedir información personal allí; no son una validación legal final.
5. Aplicar las migraciones Supabase con `pnpm dlx supabase@latest link --project-ref TU_REF` y `pnpm dlx supabase@latest db push`, después de revisar destino y backup. Probar dos usuarios reales: cada uno solo lee su perfil/libro y no puede escribir saldos ni ejecutar `meta_command`. Probar Google, recuperación de cuenta y borrado. Las pruebas PGlite verifican SQL/RLS, no la configuración de Auth y del proyecto remoto.

## Beta web (Fase 6)

1. Configurar Sentry y PostHog como en Fase 5. Invitar jugadores para medir sesiones reales con consentimiento. En PostHog, revisar `session_error / app_open` por ID anónimo único, con una ventana de siete días y tráfico de prueba excluido. Registrar tamaño de la muestra y ajustar bots o economía solo si los datos lo justifican.
2. Para leer feedback privado, generar una clave aleatoria de 32 bytes, guardarla en el gestor de secretos del proyecto y cargarla con `pnpm exec wrangler secret put FEEDBACK_READ_KEY`. En la máquina del operador configurar esa misma clave en la variable `BOLICHE_FEEDBACK_READ_KEY`. Ejecutar `Invoke-RestMethod 'https://truco-de-boliche.alexisdaleiro.workers.dev/api/feedback' -Headers @{Authorization=('Bearer '+$env:BOLICHE_FEEDBACK_READ_KEY)}`. Los comentarios se reciben aunque la lectura esté desactivada.

## Android y proveedores (Fase 7)

- Generar y resguardar la clave de subida. Firmar el AAB y habilitar Play App Signing. Cargar el certificado SHA-256 para App Links y verificar con un teléfono. Los comandos exactos están en `docs/ANDROID.md`.
- Crear app y unidad en AdMob. Configurar bloqueos, consentimiento, recompensa y URL SSV. Cargar los IDs para el Worker y para el build en el momento de habilitar anuncios reales. Primero probar con ID de demostración y luego unidad propia en modo de prueba.
- Crear los cuatro productos en Play, configurar oferta y webhook de RevenueCat, cargar las claves y registrar testers de licencia. Probar créditos, restauración y renovación en pista interna con un dispositivo físico. Completar Android API 36 en CI o con el SDK de Android instalado.
- Aplicar además la migración Supabase `20261107222100_mobile_commerce.sql` antes de usar pagos/anuncios con el adaptador remoto. Los callbacks se verifican de extremo a extremo en el código local con firmas de fixture y se prueban con los proveedores una vez configurados.
- Al configurar RevenueCat, cargar también `REVENUECAT_SECRET_KEY` para que el borrado solicite la eliminación de cliente en RevenueCat. Verificar el flujo con una cuenta de pruebas con compras y confirmar la operación en el panel. Gestionar renovaciones en Google Play.


## Play Console y cierre de validación (Fase 8)

1. Definir titular, correo privado de soporte y condiciones de retención. Completar la política y el canal de solicitud de borrado desde web para invitados Android que ya no tienen acceso a su dispositivo. Verificar con una cuenta vinculada y una de invitado. Revisar los borradores legales con un abogado uruguayo.
2. Descargar el AAB y APK desde `docs/entregas/android/` o GitHub Actions. Firmar con la clave de subida, cargar en prueba interna y ejecutar la lista de QA en un teléfono físico y una tablet. Probar anuncios y compras con las cuentas de prueba de los proveedores. Verificar App Links con la firma definitiva.
3. Copiar ficha, recursos y textos desde `docs/entregas/play-store/FICHA.md`. Confirmar IARC y Seguridad de los datos según el AAB definitivo. Abrir prueba cerrada y pedir acceso a producción cuando Play Console confirme el criterio de testers. El recorrido completo está en `docs/entregas/play-store/PUBLICACION.md`.
4. Completar las voces Azure y la escucha final, y medir la tasa de errores de sesiones reales consentidas antes del lanzamiento general.
