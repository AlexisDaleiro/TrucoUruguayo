# Meta y economía

El cliente solicita intenciones; Accounts y SQL deciden saldo, propiedad y progreso. Una ficha es una entrada al repartir, nunca premio, transferencia ni salida de dinero. Práctica y tutorial no acreditan XP ni consumen fichas.

## Persistencia
- Sin URL+publishable+service_role, perfiles/libro/resultados/opciones/inventario en Accounts (Durable Object SQLite), con sesiones opacas HttpOnly. Las operaciones se serializan y los cambios económicos de un grupo son una transacción.
- Con las tres variables, RemoteMeta llama `meta_command` mediante SDK oficial y service_role únicamente en Worker. Un fallo remoto se muestra/reintenta: no crea una segunda economía local silenciosa.
- PostgreSQL: profiles, wallet_tx, match_results, weekly_stats y economy_config. RLS permite lecturas propias; clientes no escriben saldos, inventario o XP ni ejecutan RPC de meta. La función es SECURITY INVOKER y solo service_role tiene EXECUTE. Helpers en schema privado. Trigger mantiene saldo y rechaza editar el libro; borrado de cuenta permite la cascada.
- Un invitado local se importa una vez al enlazar UID: perfil, libro completo y referencias de resultados para no acreditar XP repetido. Se conserva appId. UID ya ligado a otra identidad se rechaza. Antes de activar Supabase en un servicio con usuarios: terminar mesas activas, aplicar migraciones y pedir recarga del cliente; validar con dos cuentas de prueba y backup.

## Reglas y reintentos
Bienvenida10. Regeneración+1/2h hasta5, calculada al leer: no se acumulan horas cuando el saldo está en5o más. Reserva−1 por humano con refmatchId; todas las entradas del grupo se aceptan o ninguna. Un pase vigente registra entrada delta0.

MatchRoom persiste intención de reserva antes de solicitarla. Si falla guardar el reparto, conserva reembolso pendiente. Un reinicio con reserva sin reparto recupera ese reembolso, con refúnica. Una mesa abortada no reutiliza la entrada reembolsada. Tras la primera mano no hay reembolso por abandono. El cierre registra fecha de fin, resultado y outbox; si se pierde una respuesta o falla confirmar el guardado, el reintento no duplica XP/Elo ni cambia de semana.

Victoria50XP/derrota20; bonos pequeños de flor/truco hasta10 extra. Abandono explícito cuenta como derrota aunque el equipo termine ganando. Ranking/MMR solo si no hubo relleno inicial. Un reemplazo posterior conserva elegibilidad. Privados humanos también cuentan. EloK32; ranking3puntos por victoria,0 por derrota. Semana: lunes00:00 America/Montevideo, sin cron. La configuración pública se carga en cliente; SQL usa economy_config para costos, recarga, XP/Elo y curva de niveles.

Catálogo único en packages/shared/catalog.json, con categorías futuras tipadas. Equipar valida categoría, nivel/inventario y variante en servidor; SQL vuelve a comprobar la propiedad. Personaje/variante se ven por asiento; cartas y entorno son elección local. El anfitrión puede forzar un entorno que tenga desbloqueado. En web los packs y pase son vitrina, sin pagos ni anuncios.

## Cuenta y opciones
Alta con apodo filtrado y declaración13+ sin guardar fecha de nacimiento. Tutorial usa seis mazos deterministas y acciones del motor, nunca una economía paralela. Google: linkIdentity conserva invitado; acceso a cuenta existente usa inicioGoogle explícito con cookie anterior cerrada. Se verifican getClaims y getUser; una cookie ligada a UID requiere ese mismo UID en modo remoto. Configuración/Auth reales requieren claves y prueba externa.

Fast/reduced/quality/haptics/telemetry se guardan en perfil y dispositivo. Volúmenes se conservan por dispositivo. Los cambios rápidos se encolan y el servidor mezcla campos bajo su exclusión mutua. La preferencia de movimiento del sistema también se respeta. El modo40ms para bots existe solo en el helperDEV de pruebas; la opción rápida del jugador no hace instantánea la IA.

Borrado: `/borrar-cuenta` u Opciones. Worker inicia tombstone, desconecta/anonimiza salas fuera del bloqueo de Accounts, revoca sesiones Auth, elimina Authuser/perfil/libro/inventario/ranking y anonimiza resultados. Invalida todas las cookies locales. Las marcas mínimas de invalidación evitan resucitar una sesión eliminada. No se prometen plazos de borrado de backups de proveedores sin revisar su retención.

## Verificación
Contratos de economía local y SQL con PGlite (PostgreSQLWASM), incluyendo roles reales, RLS, transacciones, libro inmutable, migración y borrado. Pruebas de sala inyectan fallo tras débito, pérdida de confirmación de resultado y reinicio con intención pendiente. Playwright cubre alta/tutorial gratis, equipamiento, opciones, borrado, resultados online y capturas. La captura `fichas-contador-visual.png` simula saldo0 en una respuestaGET solo para revisar el estado visual; no se presenta como débito real.

Pendientes externos y pasos están en docs/PENDIENTES_HUMANO.md. Las pruebas SQL no equivalen a verificar Google, Auth y permisos del proyecto Supabase real.
