# Truco de Boliche

Juego web y Android de Truco uruguayo. Fuente de verdad: [prompt maestro](docs/PROMPT_MAESTRO.md). Estado real de implementación: [reportes](docs/REPORTES.md); tareas externas: [pendientes humanos](docs/PENDIENTES_HUMANO.md).

## Desarrollo local

Requisitos: Node 24 y pnpm 11.25.0. En Windows, permitir enlaces simbólicos para pnpm (Modo desarrollador) o instalar desde una terminal con permisos adecuados.

```sh
pnpm i
pnpm dev
```

Cliente: http://127.0.0.1:5173 ; Worker: http://127.0.0.1:8787/api/health . No necesita cuentas para desarrollo. Wrangler persiste datos locales en `.wrangler/`, que no se versiona.

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:coverage
pnpm sim --hands 100000
```

`pnpm deploy` compila y despliega usando la sesión de Wrangler. No incluir claves ni sesiones en Git. CI ejecuta checks en cada push; el despliegue automático requiere secrets y variable indicados en pendientes humanos.

Web de desarrollo inicial: https://truco-de-boliche.alexisdaleiro.workers.dev . Su disponibilidad no implica que todas las fases estén completas.
