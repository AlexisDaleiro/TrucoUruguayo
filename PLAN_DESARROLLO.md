# Plan de desarrollo y negocio — Truco de Boliche (nombre provisorio)

Este documento es **para vos**. El archivo `PROMPT_MAESTRO_CODEX.md` es para Codex.
Acá está qué hace cada uno, cuánto cuesta, qué trámites hay y cómo se llega a generar plata.

---

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Juego | Truco uruguayo 1vs1 y 2vs2, con muestra, piezas, flor y señas. Partida a 30 |
| Estilo | Cartoon 2D estilo bar de los 2000, ambientado en Uruguay. Composición de tus fotos: vos de espaldas, rivales enfrente, tele al fondo |
| Monetización | Fichas = entrada: 1 por partida, sin importar el resultado. Se consiguen gratis (regeneración + anuncios) o comprando packs y el "Pase Boliche". Cosméticos a precio directo |
| Lo legal | El ganador **no** se lleva fichas. Sin cobro en dinero, sin cajas sorpresa, sin vocabulario de apuestas |
| Bots | Completan la mesa si no hay humanos en 12 s. Se avisan en los Términos y no cuentan para el ranking |
| Arte | Etapa 1: IA (ChatGPT) + animación por código. Etapa 2, con ingresos: ilustrador |
| Voces | IA desde el día 1: Azure con voces uruguayas y argentinas. A futuro, voces humanas |
| Tecnología | Cloudflare (web + servidor de partidas) + Supabase (cuentas y datos) + Capacitor (Android) |
| Pantalla | 100 % responsive: celular vertical u horizontal, tablet y escritorio |
| Presupuesto | Cero hasta que genere. Único gasto inevitable: USD 25 de Google Play al publicar |

---

## 2. Hoja de ruta

Las duraciones son orientativas y suponen que trabajás con Codex unas horas por día.
Lo que más tiempo lleva es **tu revisión** y **la generación de imágenes**.

| Fase | Qué hace Codex | Qué hacés vos | Duración aprox. |
|---|---|---|---|
| 0. Base | Repo, documentación, CI, primer deploy | Crear cuentas: GitHub, Cloudflare, Supabase. Aprobar | 1–2 días |
| 1. Motor + bots | Reglas completas, tests, bots, simulador | Revisar la lista [VALIDAR]. Buscar 2–3 truqueros que te confirmen esas reglas | 3–7 días |
| 2. Prototipo jugable | Escena 1vs1 contra bot, animaciones, sonido provisorio, responsive | Jugar mucho y revisar `/dev/animaciones`. Pedir cambios | 1–2 semanas |
| 3. Online | Partidas online, salas con código, 2vs2, señas, login | Probar con amigos en distintos celulares | 1–2 semanas |
| 4. Arte y audio | Prompts de imágenes, integración, voces, música, pulido | **Generar las imágenes en ChatGPT** con los prompts de Codex. Crear la cuenta de Azure y pasarle la clave a Codex como variable de entorno | 2–4 semanas |
| 5. Meta y economía | Fichas, tienda, perfil, niveles, tutorial, ranking, páginas legales | Revisar los textos legales con un abogado | 1–2 semanas |
| 6. Beta web | Versión pública en Cloudflare, feedback, ajustes | Difundir en grupos de WhatsApp y redes. Juntar opiniones | 2–4 semanas |
| 7. Android | App con Capacitor, anuncios, compras, firma | Instalar Android Studio, crear AdMob y RevenueCat, probar en tu celular | 1–2 semanas |
| 8. Play Store | Ficha de la tienda, capturas, textos, guía | Pagar los USD 25, verificar identidad, prueba cerrada, publicar | 3–4 semanas (incluye 14 días de prueba) |
| 9. En vivo | Analítica, cosméticos nuevos, eventos | Decidir precios, buscar sponsors para la tele | Continuo |

**Total estimado hasta la Play Store: 3 a 5 meses.**

---

## 3. Costos

| Ítem | Hoy | Cuando haya ingresos |
|---|---|---|
| Cloudflare (web + partidas online) | Gratis | Workers Paid USD 5/mes, si se superan los límites |
| Supabase (cuentas, fichas, datos) | Gratis (500 MB, 50.000 usuarios/mes). **Ojo:** el plan gratis pausa el proyecto tras 7 días sin actividad | Pro USD 25/mes |
| Voces Azure | Centavos de dólar por todo el guion (pide tarjeta para verificar). Usar el plan **pago por uso** para tener derechos comerciales | Igual |
| Google Play | **USD 25, un solo pago**, al publicar | — |
| RevenueCat (compras) | Gratis hasta USD 2.500/mes de facturación | 1 % de lo que exceda |
| Sentry / PostHog | Gratis | Planes pagos si se superan los límites |
| Dominio propio | Opcional, ~USD 10–15/año | Recomendado |
| Ilustrador | — | USD 300–1.500 (personajes + boliche) |
| Voces humanas | — | A cotizar con locutores uruguayos |

**Comisión de Google:** 15 % de lo que vendas (hasta USD 1 millón por año). Las suscripciones también pagan 15 %.

---

## 4. Trámites legales y administrativos

> No soy abogado ni contador. Esta lista es para que llegues a ellos con las preguntas correctas.

**Antes de cobrar el primer peso:**
- [ ] **Abogado uruguayo:** validar el modelo de fichas. Llevale la sección 3 del prompt maestro, que dice qué existe y qué no existe en el juego, y preguntale si es necesario hacer una consulta formal a la DNLQ.
- [ ] **Términos y política de privacidad:** Codex hace un borrador y el abogado lo revisa. Ley 18.331 de protección de datos.
- [ ] **URCDP** (Unidad Reguladora y de Control de Datos Personales): consultar si corresponde inscribir la base de datos de usuarios.
- [ ] **Contador:** cómo facturar los pagos que hace Google desde el exterior. Puntos a consultar: forma jurídica (unipersonal, SAS), DGI/BPS y si aplica IVA a la exportación de servicios.

**Cuenta de Google Play — elegí el tipo:**

| | Cuenta personal | Cuenta de organización |
|---|---|---|
| Requisito | Verificar tu identidad | Empresa formal + número D-U-N-S (gratis) |
| Prueba antes de publicar | **12 testers durante 14 días seguidos** (prueba cerrada) | No se exige |
| Recomendación | Más fácil para arrancar | Conviene cuando formalices la empresa |

- [ ] **Perfil de pagos:** Uruguay está admitido como país de comerciante en Google Play. Verificalo al crear la cuenta. Necesitás una cuenta bancaria para recibir los pagos.
- [ ] **12 testers:** empezá ya a juntar 12+ personas con Android (amigos, familia, grupos de truco) dispuestas a instalar la app de prueba durante 2 semanas.

---

## 5. Cómo se gana plata

**Fuentes de ingreso, de la más rápida a la más grande:**
1. **Anuncios recompensados:** "Mirá un video y ganá 2 fichas". Empiezan a generar desde el primer día en Android.
2. **Packs de fichas:** para quien no quiere esperar la regeneración.
3. **Pase Boliche (suscripción mensual):** fichas ilimitadas + un cosmético exclusivo por mes. Es el ingreso más estable.
4. **Cosméticos:** personajes, entornos y cartas nuevas. Más contenido significa más ventas.
5. **La tele como espacio publicitario:** sponsors locales (bares, almacenes, marcas uruguayas) con acuerdos directos. Pagan más que AdMob y encajan con la estética. **Evitá sponsors de alcohol y de apuestas**: suben la clasificación por edad y chocan con las políticas.

**La palanca más grande — Argentina:**
Uruguay tiene 3,4 millones de habitantes. En Argentina el truco es masivo y el mercado tiene más de 45 millones de personas. El motor queda preparado con flags para agregar la variante **Truco argentino** (sin muestra, con las reglas argentinas). Es una expansión natural apenas el juego funcione bien en Uruguay.

**Métricas para saber si vas bien** (las mide PostHog):
- **Retención D1** (vuelve al día siguiente): ≥ 35 %
- **Retención D7:** ≥ 12 %
- **Retención D30:** ≥ 5 %
- **Partidas por usuario por día:** ≥ 3
- **Anuncios vistos por usuario por día:** 1–3
- **Conversión a pago:** 1–3 % es normal en juegos casuales

Si la retención es baja, no gastes en marketing: mejorá el juego primero.

---

## 6. Cómo trabajar con Codex

- **Una fase por sesión.** Arrancá cada sesión con: *"Leé `docs/PROMPT_MAESTRO.md` y `AGENTS.md`. Estamos en la Fase N."*
- **Adjuntá las 3 imágenes** de referencia en la primera sesión y dejalas en `docs/referencias/`.
- **Revisá las capturas** que te entrega en cada fase. Si algo no te gusta, decilo concreto: *"en 390×844 la barra de acciones tapa la carta del rival"*.
- **Usá las galerías** `/dev/animaciones` y `/dev/sonidos` para revisar el pulido. Pedí cambios del tipo: *"la carta al jugarse tiene que pegar más fuerte, más squash y más sonido"*.
- **Si Codex se desvía,** señalale la sección: *"esto contradice la sección 3, regla 2"*.
- **Nunca le pegues claves en el chat.** Ponelas en los archivos de variables de entorno que te indique.
- **Guardá todo en GitHub.** Cada fase termina en un PR que podés revisar y aprobar.

---

## 7. Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| El arte con IA sale inconsistente | Bloque de estilo fijo en todos los prompts + sistema de piezas. Etapa 2 con ilustrador |
| Reglas mal implementadas | Tests con ejemplos reales + validación con truqueros + flags para corregir sin reescribir |
| Matchmaking vacío al principio | Bots que completan la mesa en 12 s |
| Problema legal | Modelo sin premios + abogado antes de cobrar |
| Rechazo de Google Play | Sin vocabulario de apuestas, borrado de cuenta, privacidad, clasificación correcta |
| Supabase pausa el proyecto | Durante la beta hay actividad diaria. En producción, pasar a Pro con los primeros ingresos |
| Voces de IA poco expresivas | SSML + post-procesado. Alternativas: Chatterbox y OpenAI. Después, locutores |
| Celulares viejos van lentos | Calidad automática y budgets de rendimiento desde la Fase 2 |

---

## 8. Próximos pasos (esta semana)

1. Crear una cuenta de **GitHub** y un repositorio vacío.
2. Crear cuentas gratis en **Cloudflare** y **Supabase**.
3. Copiar `PROMPT_MAESTRO_CODEX.md` a `docs/PROMPT_MAESTRO.md` y las 3 imágenes a `docs/referencias/`.
4. Abrir Codex y pedirle la **Fase 0**.
5. Pensar el **nombre definitivo** del juego. Codex lo deja configurable en un solo lugar.
6. Empezar a juntar a los **12 testers** y a 2–3 **truqueros** para validar reglas.
