# Pendientes humanos

No pegar secretos en el chat ni en archivos versionados.

## Cloudflare y CI
1. Resuelto: sesión existente válida y Worker nuevo publicado en https://truco-de-boliche.alexisdaleiro.workers.dev (HTTP 200 verificado).
2. Para futuras operaciones que exijan más permisos: ejecutar `pnpm exec wrangler login` y completar el navegador. El token actual avisa scopes faltantes; no renovarlo es necesario para el Worker inicial.
3. GitHub → repositorio → Settings → Secrets and variables → Actions: secrets CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (Worker edit y Durable Objects); variable CLOUDFLARE_DEPLOY_ENABLED=true.
4. Verificar URL y `/api/health`. El desarrollo local no necesita cuenta.

## Supabase
Crear proyecto; activar login anónimo y proveedor Google. Copiar SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y SUPABASE_SERVICE_ROLE_KEY en `.dev.vars` (solo servidor); aplicar migraciones con CLI tras vincular proyecto. Configurar URLs autorizadas y callback de OAuth. No activar producción hasta probar RLS y vinculación sin pérdida de progreso.

Pasos de Auth: Supabase Dashboard → Authentication → Sign In/Providers → habilitar Anonymous Sign-Ins y Google. En Google Cloud crear cliente OAuth web y autorizar la URL de callback que muestra Supabase. En Supabase URL Configuration, registrar el origen público y `https://TU_DOMINIO/auth/callback`; para desarrollo `http://127.0.0.1:5173/auth/callback`. La app llama `linkIdentity({provider:'google'})` desde el invitado. Probar que el userId, fichas e inventario se conservan. No usar signInWithOAuth para sustituir al invitado en ese paso.

## Validación humana
Revisar reglas [VALIDAR] en docs/REGLAS.md y validar diseño legal/textos con abogado uruguayo antes de publicar. No se declara clasificación legal por implementación técnica.
