# Evidencia por flujo

## Fase 0 — Página → Worker → respuesta
Historia: abrir el cliente y consultar salud del Worker.
- UI y responsive: e2e verde, 11 viewports, capturas revisadas.
- Cliente → API: proxy Vite `/api` a Wrangler 8787; petición del test HTTP200.
- Worker → respuesta: test unitario del handler y GET público con `{ok:true,name:"Truco de Boliche",storage:"local"}`.
- Publicación: Worker nuevo comprobado ausente antes de crearlo; página y health públicos HTTP200.

## Fase 1 — Motor → decisiones de bot → nuevo estado
Historia: determinización de un bot desde su vista filtrada, intención legal y avance de partida.
- Motor unitario y propiedades: 39 pruebas verdes, 250 partidas generativas.
- Bots usan `PlayerView`; no reciben el estado del servidor ni el mazo oculto.
- Simulador: 100000 manos y 8241 partidas completas, 720542 intenciones sin estados ilegales.
- Cobertura V8: 100% líneas, 99,57% ramas. La cobertura no reemplaza validar las variantes con jugadores reales.

## Fase 2 — Flujo verificado localmente
Historia: tocar una carta en la mano visual → validar con el motor local → bot responde → puntaje actualizado → fin a 30. Los datos de la práctica no se consideran progreso del servidor.
- Entrada: `?local=1` y menú → Práctica. Cartas propias son botones SVG, con mouse/táctil y atajos1/2/3.
- Validación: el store rechaza acciones fuera de `legalActions`; reducer compartido calcula y proyecta `viewFor`.
- Respuesta: bot usa su vista privada; timers propios avanzan sin conexiones externas. Prueba Playwright completa partida a30 con clicks reales y verifica ganador/puntaje.
- Responsive: menú y mesa, 11 tamaños; capturas revisadas. E2e sin `pageerror`.
- Rendimiento: con CPU4x, 181 cuadros/3015ms, 60,03FPS, p9516,7ms. Backend detectado SwiftShader: se usa Canvas de Pixi, con caché por piezas; hardware mantiene WebGL.
- Build: todos los chunksJS+CSS ≈271,6KiB gzip. Esto no mide tiempo interactivo en una red4G física ni rendimiento de un Android real; esos checks siguen en beta/Android.
