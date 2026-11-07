# Pendientes humanos

No pegar secretos en el chat ni en archivos versionados.

## Cloudflare y CI
1. Crear o entrar en Cloudflare; habilitar subdominio workers.dev.
2. Ejecutar `pnpm exec wrangler login` en la raíz y completar el navegador; luego `pnpm deploy`.
3. GitHub → repositorio → Settings → Secrets and variables → Actions: secrets CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (Worker edit y Durable Objects); variable CLOUDFLARE_DEPLOY_ENABLED=true.
4. Verificar URL y `/api/health`. El desarrollo local no necesita cuenta.

## Supabase
Crear proyecto; activar login anónimo y proveedor Google. Copiar SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y SUPABASE_SERVICE_ROLE_KEY en `.dev.vars` (solo servidor); aplicar migraciones con CLI tras vincular proyecto. Configurar URLs autorizadas y callback de OAuth. No activar producción hasta probar RLS y vinculación sin pérdida de progreso.

## Validación humana
Revisar reglas [VALIDAR] en docs/REGLAS.md y validar diseño legal/textos con abogado uruguayo antes de publicar. No se declara clasificación legal por implementación técnica.
