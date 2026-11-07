# Beta web

La beta se publica en el Worker del proyecto, en https://truco-de-boliche.alexisdaleiro.workers.dev. La práctica es gratis y está disponible sin conexión después de que el navegador haya preparado los recursos en la primera visita. La instalación usa el botón del navegador o «Instalar el juego» en Opciones, cuando el navegador ofrece esa acción. En iOS se puede agregar desde el menú Compartir de Safari.

La caché de la PWA contiene la portada, los recursos gráficos necesarios para jugar y los documentos públicos. Cada compilación tiene una caché identificada por el contenido. Las sesiones, las salas, las fichas y la telemetría viajan por red. La confirmación 13+ para práctica offline es local y no crea una cuenta. El vínculo de una mesa privada abre el código de sala y requiere conexión para tomar un asiento.

En Soporte se puede enviar un comentario desde un perfil que haya completado el alta. Se guarda el texto, el tema, un identificador aleatorio y la fecha durante 90 días. El identificador de perfil se usa temporalmente para limitar el envío. Para leer los últimos 100 mensajes, configurar el secreto Worker `FEEDBACK_READ_KEY` con una clave aleatoria guardada en un gestor de contraseñas y usar `GET /api/feedback` con `Authorization: Bearer <clave>`. Mantener la clave fuera del repositorio y del cliente.

## Medición

`node tools/beta-smoke.mjs https://truco-de-boliche.alexisdaleiro.workers.dev` abre el alta desde tres contextos móviles fríos con red 4G emulada. Lighthouse 13.6 mide el menú con el estado de entrada activo en `/?local=1` sobre el build de producción. El mismo build no arranca una práctica por esa URL. El reporte guarda la configuración, métricas y puntuaciones de Lighthouse. La medición sintética se interpreta por separado de las sesiones reales.

Con PostHog configurado, medir en 7 días las sesiones únicas con `session_error` sobre las sesiones únicas con `app_open`, usando `distinct_id` anónimo y filtrando tráfico de pruebas. El cliente emite como máximo un `session_error` por sesión con consentimiento. Observar también tasa de reconexión y finalización y, al calibrar economía, medir saldo disponible e intentos de entrada rechazados con métricas agregadas del Worker. Para interpretar un objetivo menor a 1%, incluir el tamaño de la muestra y los límites del consentimiento. No modificar la economía de producción hasta tener datos.

Referencias primarias de [instalación PWA](https://web.dev/articles/install-criteria) y [auditorías Lighthouse](https://developer.chrome.com/docs/devtools/lighthouse/).
