# Borrador de Seguridad de los datos

Esta propuesta contempla el release con los proveedores de Android activos. Confirmar la configuración del AAB, las versiones de los SDK y los destinos efectivos antes de enviar. Completar también la identidad del responsable, el correo privado de soporte y la retención de cada proveedor.

| Tipo de dato | Captura y finalidad | Destino y control |
|---|---|---|
| Apodo, ID de usuario y estado de cuenta | Necesarios para crear el perfil, sentarse y guardar progreso. La declaración 13+ es un valor booleano. | Cloudflare y Supabase cuando se configure. Los apodos son visibles en mesas y ranking. |
| Correo y datos de identidad de Google | Opcionales al iniciar o vincular Google. Se usan para autenticación y recuperar la cuenta. | Google y Supabase Auth. El juego no solicita contraseña de Google ni almacena correo en su tabla de perfiles. |
| Interacciones, manos, puntaje, inventario y fichas | Necesarios para juego online, reconexión, ranking y prevención de fraude. Los demás jugadores reciben vistas filtradas. | Worker y base del juego. La práctica local no cobra entrada. |
| Otros mensajes y contenido de usuario | Comentario opcional enviado a Soporte. Las frases de mesa son predefinidas. | Comentario privado en el Worker con retención de hasta 90 días. |
| Historial de compras y suscripciones | Opcional cuando se compra o restaura. Producto, ID del perfil, transacción, estado, vigencia y acreditación. | Google Play y RevenueCat para procesar la operación. El Worker recibe confirmaciones de proveedor. El juego no pide tarjeta ni dirección de facturación. |
| Datos publicitarios, ID del dispositivo, IP/ubicación aproximada e interacciones | El SDK de Google puede recopilar y compartir identificadores, datos de vistas y clics, diagnósticos y ubicación aproximada derivada de IP para anuncios, analítica y fraude. | AdMob y UMP. Se piden anuncios sin personalización. El juego envía un código temporal aleatorio para validar la recompensa. Considerar estos datos aunque el anuncio sea opcional. |
| Diagnósticos y uso anónimo | Opcionales por consentimiento de Opciones, si los servicios se configuran. Errores saneados, tipo de pantalla/partida y sesión anónima. | Sentry y PostHog. Revisar recepción real y retención antes de declarar el formulario. |

**Cifrado en tránsito.** La app de producción usa HTTPS/WSS y los SDK usan sus conexiones TLS. Verificar proveedores y entornos efectivos.

**Borrado.** Dentro de la app, Opciones → Borrar mi cuenta → confirmar. Fuera, usar [Borrar mi cuenta](https://truco-de-boliche.alexisdaleiro.workers.dev/borrar-cuenta) desde una sesión web o tras recuperar la cuenta vinculada a Google. Antes de publicar, completar el canal privado para solicitudes de un invitado Android que ya no tiene el dispositivo y verificar el recorrido. El servidor borra cuenta, saldo y ranking, anonimiza el asiento y solicita borrado a RevenueCat cuando la integración está activa. Confirmar con el responsable qué recibos técnicos o legales se conservan y durante cuánto tiempo. El jugador gestiona la renovación del Pase en Google Play.

**Permisos.** Internet y vibración forman parte del juego. Revisar en Play Console los permisos añadidos por los SDK, incluido el identificador publicitario cuando corresponda. El juego no pide cámara, micrófono, contactos, ubicación precisa, fotos ni archivos del teléfono.

Fuentes de [Seguridad de los datos](https://support.google.com/googleplay/answer/11416267), [borrado de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111), [declaración de AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure) y [declaración de RevenueCat](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety).
