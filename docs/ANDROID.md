# Android

Capacitor 8.6, paquete `uy.trucodeboliche.app`, target y compile SDK 36. La WebView usa los archivos empaquetados y pide la API por HTTPS. En Android, la sesión opaca pertenece al almacenamiento privado de la app y el permiso para cada conexión WebSocket sigue durando 20 segundos. La práctica y el reglamento están incluidos en la app.

El botón atrás cierra el diálogo activo, abre el menú de la mesa o vuelve desde un documento. En la portada minimiza la app. En segundo plano se suspenden el audio y el dibujo. La vibración al jugar cartas sigue la opción del perfil. Las invitaciones abren la hoja de compartir y usan la URL pública. Los App Links se limitan a invitaciones y al retorno de Google. El Worker publica la asociación cuando el operador carga los certificados.

## Compilar y firmar

1. Instalar JDK 21 y Android Studio. En SDK Manager instalar Android 16, API 36, Platform Tools y Build Tools. Configurar `ANDROID_HOME` o dejar que Android Studio escriba `android/local.properties`.
2. Ejecutar `pnpm install --frozen-lockfile` y `pnpm android:sync`.
3. En `android`, ejecutar `./gradlew.bat :app:assembleDebug :app:bundleRelease` en Windows, o `./gradlew :app:assembleDebug :app:bundleRelease` en macOS/Linux. El workflow **android bundle** produce los mismos artefactos sin claves. Para instalar el APK de depuración en un teléfono con depuración USB usar `adb install -r app/build/outputs/apk/debug/app-debug.apk`.
4. En un directorio privado, crear la clave de subida con `keytool -genkeypair -v -keystore truco-upload.jks -alias truco-upload -keyalg RSA -keysize 2048 -validity 10000`. Guardar clave y contraseña en copias controladas. La contraseña se ingresa cuando la herramienta la pide. Activar Play App Signing en Play Console.
5. Firmar el AAB de la compilación de release con `jarsigner -keystore RUTA/PRIVADA/truco-upload.jks -sigalg SHA256withRSA -digestalg SHA-256 -signedjar truco-release.aab android/app/build/outputs/bundle/release/app-release.aab truco-upload`. Verificar con `jarsigner -verify -verbose -certs truco-release.aab`. Subir ese archivo a la pista de prueba y aumentar versionCode en cada nueva subida.
6. Copiar SHA-256 del **certificado de firma de la app de Google Play** desde Play Console → Integridad de la app. Cargarlo en `ANDROID_SHA256` mediante `pnpm exec wrangler secret put ANDROID_SHA256`. Se pueden cargar varios certificados separados por comas para pruebas controladas. Verificar `/.well-known/assetlinks.json`, luego `adb shell pm verify-app-links --re-verify uy.trucodeboliche.app` y `adb shell pm get-app-links uy.trucodeboliche.app`. Usar el SHA-256 de la firma de debug para un APK de prueba instalado por USB. Retirarlo de producción al terminar.

## AdMob

El AAB de prueba usa el ID de aplicación y la unidad recompensada de demostración de Google. La pantalla identifica esa modalidad. Para activar la unidad real, crear una app Android y una unidad **Rewarded** en AdMob. Configurar recompensa de cantidad 2 y nombre `fichas`. En la unidad, activar SSV con `https://truco-de-boliche.alexisdaleiro.workers.dev/api/hooks/admob`. Bloquear las categorías de juego con dinero y configurar los mensajes de privacidad aplicables en AdMob. Mantener anuncios en modo prueba durante QA.

Cargar la unidad real `ADMOB_REWARDED_ID` en el Worker. Al compilar un release autorizado para anuncios reales, fijar `BOLICHE_ADMOB_APP_ID` al ID de aplicación real para Gradle y `VITE_ANDROID_REAL_ADS=1` al ejecutar `pnpm android:sync`. Registrar los dispositivos de prueba en AdMob y probar el callback de consola. La pantalla pide una declaración 18+ para los anuncios opcionales. Usa UMP cuando corresponde, solicita anuncios sin personalización y muestra el acceso a privacidad si UMP lo exige. La declaración de anuncios dura lo que dure la pantalla.

El SDK recibe un nonce aleatorio de la cuenta, sin apodo ni ID de perfil. El Worker verifica firma ECDSA, unidad, recompensa, hora y nonce. Solo el callback válido puede acreditar +2, con máximo 5 por día de Montevideo. En prueba con unidad de demostración no se entregan fichas. Usar una unidad propia de prueba con SSV para verificar el acreditado de extremo a extremo.

## RevenueCat y Play Billing

1. En Play Console crear productos consumibles `fichas_20`, `fichas_60`, `fichas_150` y suscripción `pase_boliche` con plan mensual `mensual`. Definir precios y países en Play Console. En RevenueCat conectar Google Play con su cuenta de servicio. Importar esos productos, agregarlos como paquetes a la oferta actual y asociar el Pase al entitlement del proyecto. En restauración, mantener las transacciones con el App User ID original.
2. En RevenueCat configurar el webhook `https://truco-de-boliche.alexisdaleiro.workers.dev/api/hooks/revenuecat` con el header `Authorization: Bearer <clave>`. Cargar por separado `REVENUECAT_WEBHOOK_KEY`, `REVENUECAT_APP_ID` (ID de app en RevenueCat) y `REVENUECAT_PUBLIC_KEY` (clave SDK Android `goog_…`) con Wrangler. El Worker devuelve únicamente la clave pública del SDK. Si se borró el perfil, solicita también el borrado en RevenueCat. Para pista de prueba usar `REVENUECAT_ENVIRONMENT=SANDBOX`. Cambiar a `PRODUCTION` al habilitar compras reales. Si el plan de RevenueCat del proyecto requiere habilitar webhooks, hacerlo antes de probar.
3. Inscribir testers de licencia y publicar el AAB firmado en pista interna. Instalar desde el enlace de Play con el mismo usuario registrado. Verificar cada compra, una recompra del mismo consumible, duplicado de callback, renovación/expiración de Pase y restauración. Revisar la tienda, el perfil y el libro de fichas después del callback. Cancelar renovaciones de prueba desde Play Store al terminar.
4. Verificar compra y restauración en la misma cuenta de juego. Usar vinculación a Google para conservar acceso entre dispositivos. Para consumibles reembolsados, revisar el caso desde Play Console y el libro antes de aplicar un ajuste por soporte. El sistema acredita transacciones confirmadas y conserva recibos de idempotencia.

El Pase vigente cubre la entrada y concede un sello cosmético por mes de compra/renovación. Las promos futuras de la tele quedarán fuera para el Pase. La escena actual solo muestra contenido propio.

Fuentes de [target SDK vigente](https://support.google.com/googleplay/android-developer/answer/11926878), [App Links](https://developer.android.com/training/app-links/about), [AdMob SSV](https://developers.google.com/admob/android/ssv) y [RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks).
