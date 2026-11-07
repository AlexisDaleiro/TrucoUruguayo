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
