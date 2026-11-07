# Observabilidad opcional

Sentry11.11 y PostHog se activan solo con permiso del jugador. Sin permiso no hay envío ni carga del SDK de Sentry. No hay replay, autocaptura ni identificación con apodo/cuenta. PostHog recibe eventos tipados con modo/online/resultado y un UUID de sesión efímero, `$process_person_profile=false` y geolocalización desactivada. Los proveedores reciben conexiones técnicas; el aviso de privacidad no promete invisibilidad de IP en transporte.

Sentry usa imports concretos bajo demanda, defaultIntegrationsfalse y dataCollection desactivando usuario, cookies, headers, cuerpos, queries, contexto de código/variables y datos de integraciones. El mensaje original del error se sustituye; se conserva tipo permitido y traza depurada. beforeSend vuelve a comprobar consentimiento y borra request/user/extra/contexts/breadcrumbs. Retirar permiso cierra el cliente y rota la sesión.

Variables públicas de build: VITE_SENTRY_DSN, VITE_POSTHOG_KEY (project token, no personal API key), VITE_POSTHOG_HOST. Valores administrativos nunca van a VITE. Configurar y reconstruir según pendientes humanos. No se declara recepción de eventos reales sin cuentas.

`tests/telemetry.spec.ts` usa `.invalid` y claves ficticias: intercepta todas las solicitudes a proveedores, prueba silencio sin permiso, payload depurado y silencio tras retirarlo. Playwright fuerza esas variables para no contaminar proyectos reales. La primera fixture de DSN fue rechazada por el SDK y se corrigió a una clave pública hexadecimal válida; el test detectó la integración incorrecta antes de marcarla verde.

Métricas de beta: tasa de sesiones con error, duración/abandono y finalización de tutorial entre quienes consientan. Los datos de esta muestra no describen automáticamente a toda la población. No afirmar «errores<1%» con cero sesiones o solo pruebas automáticas.

Fuentes primarias consultadas: [PostHog Capture API](https://posthog.com/docs/api/capture), [Sentry options](https://docs.sentry.io/platforms/javascript/configuration/options/), tipos y código del SDK11 instalado. Sentry11 usa `dataCollection`; `sendDefaultPii` ya no es una opción de BrowserOptions de esta versión.

En beta, `session_error` cuenta una vez por sesión de página cuando se permite el diagnóstico. El ID anónimo coincide con `app_open` y se reinicia si se revoca el permiso. `feedback_submit` registra solo el éxito del envío. El texto del formulario queda en el almacenamiento privado del Worker.
