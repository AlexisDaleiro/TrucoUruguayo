# PROMPT MAESTRO — Truco Uruguayo online (nombre provisorio: "Truco de Boliche")

> **Cómo usar este archivo (para el humano):**
> 1. Copiá este archivo a `docs/PROMPT_MAESTRO.md` dentro de la carpeta del proyecto.
> 2. Copiá las 3 imágenes de referencia a `docs/referencias/`:
>    `01-estilo-bartender.webp`, `02-escena-1v1.jpg`, `03-escena-2v2.jpg`.
> 3. Abrí la carpeta en Codex, adjuntá las 3 imágenes y mandá el mensaje de arranque de `PLAN_DESARROLLO.md` (sección 6).
> 4. Codex trabaja en **modo autónomo**: encadena las fases 0 a 8 sin esperar aprobación. Lo que solo vos podés hacer queda anotado en `docs/PENDIENTES_HUMANO.md`. Revisalo cada tanto.

---

## 1. Tu rol y cómo trabajás

Sos, a la vez, **lead engineer**, **director de arte técnico** y **director de audio** de un juego móvil y web de Truco uruguayo. Tu objetivo es un producto comercial que se publica en la web y en Google Play y se monetiza. La calidad de las animaciones, del sonido y de la lógica es prioridad máxima. No escatimes en pulido.

Reglas de trabajo, que no se negocian:

1. **Modo autónomo: trabajá sin parar, fase tras fase** (sección 15). No esperes aprobación entre fases. Cada fase se cierra con:
   - build verde y tests verdes. Si algo falla, lo arreglás antes de seguir;
   - capturas de las pantallas clave en la matriz de viewports (sección 8.4), guardadas en `docs/capturas/fase-N/`. Revisalas vos mismo y corregí lo que se vea mal;
   - un reporte breve en `docs/REPORTES.md`: lo hecho, lo pendiente y los riesgos;
   - el merge de la rama de la fase a `main`, y **pasás directamente a la fase siguiente**.
2. **Bloqueos humanos.** Algunas cosas solo las puede hacer el humano: crear cuentas, iniciar sesión, pasar claves, generar imágenes o pagar. Cuando llegues a una:
   - anotala en `docs/PENDIENTES_HUMANO.md` con pasos exactos: qué hacer, dónde y qué variable de entorno completar;
   - **no te detengas**: seguí con todo lo que no depende de eso, usando placeholders, modo local o adaptadores locales;
   - cuando el humano complete un pendiente, integralo.
   - **Desarrollo sin cuentas:** `wrangler dev` corre el Worker y los Durable Objects localmente, sin cuenta de Cloudflare. Mientras no haya claves de Supabase, usá un adaptador local detrás de la misma interfaz: login de invitado y datos en el almacenamiento local del Durable Object. Cuando existan las variables de entorno, activá Supabase.
   - Solo frená del todo si **todo** lo que queda depende del humano. En ese caso, decilo en un mensaje claro con la lista de pendientes.
3. En la Fase 0 creá `AGENTS.md` en la raíz, con el stack, los comandos, las convenciones, los budgets de rendimiento, las restricciones duras y el **modo autónomo** de este documento. Mantenelo actualizado: si tu contexto se reinicia, `AGENTS.md`, `docs/REPORTES.md` y `docs/PENDIENTES_HUMANO.md` te dicen dónde quedaste.
4. **Este documento es la fuente de verdad.** Si algo es ambiguo, decidí lo más sensato, registralo en `docs/DECISIONES.md` (fecha, contexto, decisión, alternativa descartada) y seguí. Si la decisión cambia el producto de forma visible para el jugador, marcala con **[REVISAR]** en `docs/REPORTES.md` para que el humano la vea, y seguí sin esperar.
5. **No agregues dependencias** fuera del stack de la sección 9 sin justificarlo en `docs/DECISIONES.md`. Preferí la plataforma nativa (Web Audio, CSS, APIs del navegador) antes que una librería.
6. Hacé commits pequeños con Conventional Commits (`feat:`, `fix:`, `chore:`...). Usá una rama por fase y mergeala a `main` al cerrarla, con los tests en verde.
7. Nunca subas secretos al repo. Las claves van en `.dev.vars`, `.env.local`, los secrets de Wrangler o los secrets de GitHub. Agregá `.env.example` con los nombres de las claves, sin valores.
8. **Propiedad intelectual:**
   - La imagen `01-estilo-bartender.webp` es **solo referencia de estilo**: trazo grueso, colores saturados, humor cartoon, proporciones exageradas. Está prohibido copiar sus personajes, composición, assets, tipografía o logo.
   - Todo personaje, escenario, carta, música y sonido es original o tiene una licencia que permite uso comercial.
   - No uses equipos, escudos, jugadores, ligas ni marcas reales (tampoco en la tele ni en las botellas).
9. Antes de declarar terminada una tarea, verificá: corré los tests, levantá el juego y sacá capturas. "Debería funcionar" no cuenta.

---

## 2. Visión del producto

- **Qué es:** Truco uruguayo online en **1vs1** y **2vs2**. Se juega en una mesa de boliche de barrio o de galpón de campo, con estilo **cartoon 2D** de mucho carácter.
- **Plataformas:**
  1. Web, en Cloudflare.
  2. Android, empaquetando la misma web con Capacitor.
  3. Google Play.
- **Idioma:** español rioplatense de Uruguay, con voseo ("Tocá", "Jugá", "¿Querés?") y modismos ("bo", "ta", "de una", "ni ahí"). Todos los textos van en `locales/es-UY.json`, listos para traducir más adelante.
- **Pilares:**
  1. **Boliche auténtico:** ambiente vivo, señas, picardía, tanteador con fósforos y mate.
  2. **Juice:** cada acción tiene animación, sonido y, en Android, vibración.
  3. **Reglas exactas:** el motor no se equivoca nunca.
  4. **Partidas ágiles:** una partida a 30 dura entre 8 y 12 minutos.
- **Anti-objetivos.** El producto fracasa si:
  - parece un casino o un juego de apuestas;
  - permite pagar para ganar (pay-to-win);
  - usa patrones engañosos: falsa urgencia, precios confusos o premios que no existen;
  - copia propiedad intelectual protegida.

---

## 3. Restricciones legales y de tiendas (DURAS)

Estas reglas existen para que el juego **no** sea un juego de azar según la ley uruguaya y para cumplir las políticas de Google Play:

- Ley 1.595, art. 1: prohíbe los juegos "de suerte o azar" y aquellos "en que intervenga envite".
- Código Penal, art. 362: define el juego de azar por la combinación de suerte y lucro.
- Ley 19.535, art. 244: extiende la prohibición al juego online.
- Política de Google Play sobre juegos con dinero real: prohíbe pagar, incluso con ítems comprados, por la chance de ganar premios con valor real.

Implementá así:

1. **Ficha = entrada.**
   - Cada jugador humano gasta **1 ficha** (constante configurable) cuando la partida **arranca de verdad**: todos los asientos ocupados y las cartas repartidas.
   - Si la partida se aborta por un error del servidor antes de terminar la primera mano, se devuelve la ficha.
   - El tutorial no cuesta fichas.
2. **El ganador nunca recibe fichas del rival.**
   - Las fichas no se cobran en dinero, no se transfieren entre jugadores, no se regalan y no tienen mercado.
   - Ganar da solo XP, nivel, puntos de ranking, logros y cosméticos que se desbloquean por nivel.
3. **Sin cajas sorpresa** ni recompensas aleatorias pagas. Los cosméticos se venden a precio directo.
4. **Vocabulario prohibido** en la interfaz, en la tienda y en la ficha de Play Store: *apostar, apuesta, pozo, ganá plata, premio en dinero, casino, jackpot, cobrar*. Usá en su lugar: *partida, ficha, entrada, jugar, desafío*.
5. **La tienda nunca usa estética de casino**: nada de monedas cayendo, tragamonedas ni luces de casino.
6. **Bots:**
   - Los Términos y la sección de Ayuda dicen: *"Si no hay rivales disponibles, podés jugar contra jugadores controlados por IA."*
   - Dentro de la partida no se marcan.
   - Las partidas con al menos un bot **no cuentan** para el ranking semanal competitivo (flag interno `hasBots`).
7. **Compras reales: solo en Android**, con Google Play Billing a través de RevenueCat. En la web, la tienda queda en **modo vitrina**: muestra los ítems con el cartel "Disponible en la app de Android".
8. **Anuncios:**
   - Solo **recompensados** (dan fichas) y siempre opcionales.
   - Nunca intersticiales en medio de una mano.
   - Categorías de juego y apuestas **bloqueadas** en AdMob.
   - La tele del escenario es un espacio de anuncio a futuro. Por ahora muestra solo contenido propio (sección 7.6).
9. **Privacidad** (Ley 18.331 de Uruguay y política de Google Play):
   - Páginas `/privacidad` y `/terminos`.
   - Recolección mínima de datos.
   - **Borrado de cuenta** desde la app y desde una URL web, ambas cosas exigidas por Google Play.
10. **Público y clasificación:**
    - Público objetivo de 13 años en adelante. Sin menores de 13, para no entrar en el programa Families.
    - Sin animaciones de consumo de alcohol. Las botellas del fondo son genéricas y sin etiqueta. El mate es el protagonista.
    - El cuestionario de clasificación debe poder responder "sin apuestas simuladas", y eso es cierto por diseño.

> La validación legal final la hace el humano con un abogado uruguayo. No es tarea tuya, pero el producto tiene que hacer posible esa validación.

---

## 4. Reglas del Truco Uruguayo — especificación del motor (fuente de verdad)

No existe un reglamento oficial único. Esta especificación consolida tres fuentes: Wikipedia ("Truco uruguayo"), ConectaGames y Ludoteka. Los puntos marcados **[VALIDAR]** van listados en `docs/REGLAS.md`, en una sección "A validar con jugadores reales". Esos puntos se implementan como dice este documento, pero detrás de flags de configuración.

### 4.1 Mazo y notación

- Baraja española de 40 cartas: palos **E**spada, **B**asto, **O**ro y **C**opa; números 1 al 7, 10 (sota), 11 (caballo) y 12 (rey).
- Notación: `4O` = 4 de oro.

### 4.2 Jugadores, asientos y turnos

- **1vs1:** 2 asientos. **2vs2:** 4 asientos con equipos alternados: asientos 0 y 2 son el equipo A, asientos 1 y 3 son el equipo B. El compañero queda **enfrente**.
- El juego avanza en **sentido antihorario**. El reparto rota antihorario en cada mano.
- **Mano:** el jugador a la derecha del que reparte, es decir, el siguiente en sentido antihorario. **Pie:** el último en jugar.
- En pantalla, el jugador local siempre está **abajo, de espaldas**. En 2vs2, el compañero va arriba y los rivales a izquierda y derecha.

### 4.3 Reparto y muestra

- El servidor baraja con un generador aleatorio criptográfico (`crypto.getRandomValues`) y el algoritmo de Fisher-Yates. La semilla y el orden se guardan para auditoría y replays, y **nunca** se envían al cliente.
- Se reparten 3 cartas a cada jugador, de a una, en sentido antihorario y empezando por el mano.
- La siguiente carta se da vuelta boca arriba: es la **muestra**. Su palo es el **palo de la muestra**.

### 4.4 Piezas y alcahuete

- **Piezas:** el 2, 4, 5, 11 y 10 del palo de la muestra, en ese orden de jerarquía.
- **Alcahuete:** si la muestra misma es una pieza (2, 4, 5, 10 u 11), el **12 del palo de la muestra** toma el lugar de esa pieza, con la misma jerarquía y el mismo valor de envido y flor.
  - Ejemplo: con muestra `4O`, el `12O` vale como el 4 de la muestra. Es la segunda carta más alta y vale 29.

### 4.5 Jerarquía para las bazas (de mayor a menor)

1. 2 de la muestra
2. 4 de la muestra
3. 5 de la muestra
4. 11 de la muestra
5. 10 de la muestra (con el alcahuete aplicado si corresponde)
6. 1 de espada
7. 1 de basto
8. 7 de espada
9. 7 de oro
10. Todos los 3 (empatan entre sí)
11. Todos los 2 que no son pieza
12. 1 de copa y 1 de oro (anchos falsos)
13. Todos los 12 (salvo el alcahuete)
14. Todos los 11 que no son pieza
15. Todos los 10 que no son pieza
16. 7 de copa y 7 de basto
17. Todos los 6
18. Todos los 5 que no son pieza
19. Todos los 4 que no son pieza

Dos cartas de la misma jerarquía empatan. Un empate entre la carta más alta de cada equipo es **parda**.

### 4.6 Bazas y ganador de la mano

- Cada mano tiene hasta 3 bazas. El mano abre la primera baza. Quien gana una baza abre la siguiente.
- **2vs2:** gana la baza el equipo de la carta más alta. Si las dos cartas más altas son de compañeros, gana ese equipo. Si son de rivales, es **parda**.
- Después de una parda, abre la siguiente baza quien abrió la baza empatada. **[VALIDAR]**
- **Ganador de la mano:**
  - Si un equipo gana 2 bazas, gana la mano y la mano termina en el acto.
  - Si la 1ª es parda, gana quien gane la 2ª. Si la 2ª también es parda, gana quien gane la 3ª. Si las tres son pardas, gana el equipo del mano.
  - Si la 1ª la gana X y la 2ª es parda, gana X.
  - Si la 1ª la gana X, la 2ª la gana Y y la 3ª es parda, gana X.

### 4.7 Truco

- **Valor de la mano:** sin canto vale 1. Truco vale 2, retruco 3 y vale cuatro 4.
- **Cuándo se canta:**
  - Solo en el turno propio, antes de tirar carta, o como respuesta a un canto.
  - Los equipos se alternan: solo el equipo que **aceptó** el último canto puede subir ("quiero retruco", "quiero vale cuatro").
- **Respuestas posibles:** *quiero*, *no quiero* o subir.
- **No quiero:** el equipo que cantó cobra el valor anterior al canto (1, 2 o 3) y la mano termina.
- **2vs2:** cualquiera de los dos rivales puede responder. Vale la **primera respuesta válida** que llega al servidor.
- **Irse al mazo:** se puede en el turno propio. El rival cobra el valor de la mano aceptado hasta ese momento (mínimo 1). Si había flor cantada, la flor sigue valiendo.

### 4.8 Envido

**Valor de cada carta para el envido:**
- Piezas: 2 = 30, 4 = 29, 5 = 28, 11 = 27, 10 = 27. El alcahuete vale lo mismo que la pieza que reemplaza.
- Cartas que no son pieza: del 1 al 7 valen su número. 10, 11 y 12 valen 0.

**Tanto de la mano** (solo si nadie tiene flor):
- Con **una pieza**: valor de la pieza + el valor más alto de las otras dos cartas, sean del palo que sean.
- **Sin pieza** y con dos cartas del mismo palo: 20 + la suma de esas dos cartas.
- **Sin pieza** y con los tres palos distintos: el valor de la carta más alta.
- El máximo posible es 37 (2 de la muestra + un 7).

**Cantos:** envido vale 2, real envido 3 y falta envido "la falta".
- Secuencias válidas: `E`, `E-E`, `E-R`, `E-E-R`, `R`, y la falta (`F`) como cierre de cualquiera de ellas (`F`, `E-F`, `E-E-F`, `E-R-F`, `E-E-R-F`, `R-F`).
- Si se acepta: se suman los valores. La falta reemplaza la suma.
- Si no se acepta: quien hizo el último canto cobra la suma de lo aceptado **antes** de ese canto, con mínimo 1. Ejemplos:
  - `E` no quiero: 1 punto.
  - `E-E` no quiero: 2.
  - `E-R` no quiero: 2.
  - `E-E-R` no quiero: 4.
  - `R` no quiero: 1.
  - `E-E-R-F` no quiero: 7.

**Falta envido:** lo que le falta al equipo que **va ganando** para llegar al objetivo. Si los puntajes están empatados, se usa cualquiera de los dos, porque da lo mismo.
- Flag `faltaEnvidoMode`: el valor por defecto es `"leaderNeeds"`. La alternativa `"malasGanaPartida"` hace que, si el líder está en malas, la falta gane la partida. **[VALIDAR]**

**Cuándo se canta:**
- Solo durante la **primera baza**, por un jugador en su turno y antes de tirar su carta.
- También como respuesta a un truco cantado en la primera baza. En ese caso **el envido va primero**: se resuelve el envido y después se contesta el truco, que queda pendiente.

**Resolución:**
- El motor calcula los tantos automáticamente.
- La animación muestra la secuencia de declaraciones: canta primero el mano y siguen los demás en sentido antihorario. Cada uno dice "Tengo 33" si supera al mejor tanto rival, o "Son buenas" si no lo supera.
- Si hay empate, gana el jugador más cercano al mano en el orden de juego.
- Los puntos se suman **en el acto**.
- Al terminar la mano se **muestran a todos** las cartas que justificaron el tanto ganador.

### 4.9 Flor (activa por defecto, flag `florEnabled = true`)

**Hay flor si se cumple cualquiera de estas condiciones** (la pieza funciona como comodín de palo):
- 2 o 3 piezas;
- 1 pieza + 2 cartas del mismo palo;
- 3 cartas del mismo palo.

**Valor de la flor:**
- **3 piezas:** valor completo de la pieza mayor + la unidad de cada una de las otras dos. Ejemplo: 2, 4 y 5 de la muestra = 30 + 9 + 8 = 47.
- **2 piezas + otra carta:** valor de la pieza mayor + la unidad de la otra pieza + el valor de la tercera carta (0 si es figura).
- **1 pieza + 2 del mismo palo:** valor de la pieza + el valor de las otras dos cartas.
- **3 del mismo palo sin pieza:** 20 + la suma de las tres cartas.
- Rango posible: de 20 a 47.

**Cuándo se canta:**
- Se canta **automáticamente** en el primer momento en que el que la tiene debe actuar: su turno o una respuesta. Suena la voz "¡Flor!" con su animación.
- Si alguien canta envido antes de ese momento, la flor se canta en el acto y **anula el envido**.
- Con una flor cantada, el envido no se juega en esa mano.

**Puntos:**
- **Solo un equipo tiene flor:** 3 puntos por cada flor de ese equipo. En 2vs2, si los dos compañeros tienen flor, son 6.
- **Los dos equipos tienen flor:** **[VALIDAR]**
  1. El equipo que cantó flor **en segundo lugar** elige *"Flor"* (comparación simple) o *"Contraflor al resto"*.
  2. Si eligió la comparación simple, el otro equipo puede aceptarla o subir a *"Contraflor al resto"*.
  3. **Comparación simple:** la flor más alta cobra 3 puntos por cada flor cantada en la mesa. En 1vs1 son 6.
  4. **Contraflor al resto:** el equipo desafiado responde.
     - *Quiero*: la flor más alta cobra la falta, con el mismo cálculo que la falta envido.
     - *No quiero* ("con flor me achico"): el equipo que desafió cobra 3 puntos por cada flor cantada, sin comparar.
  5. Si hay empate de flor, gana el jugador más cercano al mano.
- La variante "Con flor envido" queda detrás del flag `florEnvido = false`. No se implementa en la versión 1; queda documentada.

### 4.10 Puntaje y fin de partida

- La partida es **a 30** (flag `targetScore`: 30 o 40). Las **malas** van del 0 al 14 y las **buenas** del 15 al 30. En una partida a 40, la mitad es 20.
- Los puntos de envido y flor se suman en el acto. Los puntos del truco se suman al cerrar la mano.
- **Cuando un equipo llega al objetivo, la partida termina en el acto**, aunque sea en medio de una mano.
- **Tanteador visual con fósforos** sobre la mesa: cada punto es un fósforo y cada 5 puntos forman un "cuadradito" (4 lados + 1 diagonal). Una línea separa malas de buenas. Además, la interfaz muestra el número del puntaje para que sea fácil de leer.

### 4.11 Señas (solo en 2vs2)

**Tabla por defecto** (de Wikipedia; editable en `packages/engine/src/senas.ts`):

| Carta | Seña |
|---|---|
| 2 de la muestra | Levantar las cejas |
| 4 de la muestra | Beso |
| 5 de la muestra | Arrugar la nariz |
| 11 de la muestra | Guiño del ojo derecho |
| 10 de la muestra | Guiño del ojo izquierdo |
| 1 de espada | Mueca de labios hacia la derecha |
| 7 de espada | Mueca de labios hacia la izquierda |
| Cualquier 3 | Morder el labio inferior |
| Cualquier 2 (que no sea pieza) | Boca levemente abierta |
| 1 de copa o 1 de oro | Sacar la punta de la lengua |
| Nada bueno (negras o comunes) | Cerrar los dos ojos |
| Envido alto (pieza + 2 de palos distintos) | Lamer el labio superior |
| Flor de 3 piezas | Inflar los cachetes |

Las señas del 1 de basto y del 7 de oro no figuran en la fuente. **[VALIDAR]** Asignales dos gestos distintos que no choquen con los demás y registralo en `docs/DECISIONES.md`.

**Mecánica:**
- El jugador abre el panel de señas (radial en móvil, con atajo `S` en escritorio) y elige un gesto.
- **En la pantalla de su compañero**, su personaje hace el gesto facial (≈700 ms).
- En su propia pantalla aparece una confirmación sutil ("Le hiciste: beso").
- **En la pantalla de los rivales**, el personaje hace un "tic" ambiguo: rascarse, acomodarse la gorra, sorber el mate.
- Flag `senaCatchChance` (por defecto 0): es la probabilidad de que el rival vea la seña real. Queda como base para la futura mecánica de "pescar la seña".
- Límite: 1 seña cada 1,5 s, para evitar spam.
- El jugador puede mentir con las señas: es su decisión.

### 4.12 Tiempos y abandono

- **Turno: 25 s** (configurable), con un anillo de tiempo alrededor del avatar.
  - Si vence el tiempo con un canto pendiente: *no quiero*.
  - Si vence el tiempo en el turno de jugar: se tira la carta de menor jerarquía.
- **Desconexión:** 45 s de gracia. Pasado ese tiempo, un **bot toma el asiento** y la partida sigue. Si el humano vuelve, recupera el asiento en el siguiente punto de decisión.
- Abandonar a propósito cuenta como derrota y no devuelve la ficha.

### 4.13 Configuración del motor

```ts
type RulesConfig = {
  targetScore: 30 | 40;            // por defecto 30
  florEnabled: boolean;            // true
  florEnvido: boolean;             // false (variante futura)
  faltaEnvidoMode: 'leaderNeeds' | 'malasGanaPartida'; // 'leaderNeeds'
  echarLosPerros: boolean;         // false (variante futura, no implementar en la v1)
  turnSeconds: number;             // 25
  senaCatchChance: number;         // 0
};
```

Las salas privadas pueden elegir `targetScore` y `florEnabled`. El matchmaking usa los valores por defecto.

### 4.14 Vectores de prueba obligatorios (deben pasar tal cual)

| Muestra | Mano | Esperado |
|---|---|---|
| 7O | 4O, 1B, 1O | Envido 30 (29 + 1). Sin flor. |
| 6C | 4C, 3E, 6B | Envido 35 (29 + 6) |
| 3B | 7C, 6C, 1E | Envido 33 (20 + 7 + 6) |
| 7O | 10E, 11B, 12C | Envido 0 |
| 4O | 12O, 7E, 3B | El 12O es alcahuete: envido 36 (29 + 7) y el 12O le gana al 1E |
| 1E | 2E, 4E, 5E | Flor 47 |
| 7O | 2O, 7C, 6C | Flor 43 (30 + 7 + 6) |
| 7O | 7E, 6E, 5E | Flor 38 (20 + 18) |
| 3C | 2C, 10C, 1E | Flor 38 (30 + 7 + 1) |
| 7O | 12E, 5E, 4E | Flor 29 (20 + 0 + 5 + 4) |

**Bazas:**
- X, X: gana X y no se juega la 3ª.
- X, Y, X: gana X.
- Parda, Y: gana Y.
- Parda, parda, X: gana X.
- Parda, parda, parda: gana el mano.
- X, parda: gana X.
- X, Y, parda: gana X.

**Truco:**
- Sin canto: 1 punto.
- Truco querido: 2.
- Truco no querido: 1 para quien cantó.
- Truco querido, retruco no querido: 2 para quien cantó el retruco.
- Vale cuatro no querido: 3.

**Falta envido:** con A = 22 y B = 10, la falta vale 8.

---

## 5. Bots (IA)

- **Paquete `packages/bots`.** Usa el motor directamente, sin copiar reglas.
- **Algoritmo:**
  1. Muestreo Monte Carlo por *determinización*: genera manos posibles para las cartas ocultas que sean coherentes con lo que se sabe (cartas jugadas, tantos declarados, flor cantada, señas recibidas del compañero).
  2. Simula jugadas con una política heurística.
  3. Elige la acción con mayor valor esperado en puntos, teniendo en cuenta el puntaje de la partida (malas o buenas, cercanía a 30).
- **Dificultad (3 niveles):**
  - Cantidad de simulaciones.
  - Ruido en la elección.
  - Tasa de *mentira*: cantar truco con mano mala.
  - Tasa de errores leves.
  - Lectura de la posición: ventaja de ser pie en el envido.
- **Comportamiento humano:**
  - Tiempo de pensar con distribución lognormal: 1,2–6 s, más largo en decisiones grandes.
  - Animación de "pensando".
  - Frases rápidas ocasionales.
  - Nombre uruguayo (de una lista de apodos), avatar del catálogo y nivel cercano al del jugador.
- **2vs2:** el bot compañero hace **señas verdaderas** al inicio de la mano y usa las señas del compañero humano.
- **Uso de los bots:**
  - Completan el matchmaking (sección 10.3).
  - Reemplazan a un desconectado.
  - Son el rival del tutorial.
  - Se enfrentan entre sí en el simulador.
- **Dificultad en matchmaking:** se ajusta al MMR del jugador.

---

## 6. Dirección de arte (Art Bible)

### 6.1 Estilo

- **Cartoon 2D con aspecto dibujado a mano:**
  - Contorno oscuro grueso: 3–6 px a 1080p.
  - Colores saturados y cálidos: rojo, dorado, ámbar y marrones de madera.
  - Sombreado *cel* de 2 tonos + luz de borde (rim light).
  - Proporciones exageradas: cabezas y manos grandes, cejas muy expresivas, bigotes.
  - Humor de historieta.
- **Sensación buscada:** la de los juegos web de bar de los 2000 (ver `01-estilo-bartender.webp`), pero con identidad propia y **ambientada en Uruguay**:
  - ladrillo visto, bombita colgante, tele de tubo, mate con bombilla;
  - fósforos, vasos de vidrio grueso, madera gastada;
  - en el entorno de día, campo y luz de siesta.

### 6.2 Composición de escena (de las fotos de referencia)

**1vs1** (referencia `02-escena-1v1.jpg`, entorno "Galpón de campo — día"):
- **Jugador local de espaldas** en primer plano, abajo a la izquierda: hombro y nuca, un poco oscurecido. Sus manos sostienen sus 3 cartas en abanico, y esas cartas **son las cartas interactivas**.
- **Mesa redonda** de madera rústica en el centro y la parte baja. Sobre la mesa:
  - mate con bombilla y un vaso;
  - el mazo con la muestra asomada;
  - los fósforos del tanteador;
  - cartas jugadas.
- **Rival** sentado enfrente, arriba al centro, con los codos en la mesa y la cara expresiva.
- **Tele de tubo** en un estante, arriba a la izquierda.
- Pared de ladrillo, ventana con luz de día y bombita encendida.

**2vs2** (referencia `03-escena-2v2.jpg`, entorno "Boliche — noche"):
- Ambiente oscuro, con un **cono de luz** de lámpara colgante y humo.
- Mesa rectangular larga.
- **Compañero enfrente**, arriba al centro (con gorra).
- **Rivales** a los costados, izquierda y derecha.
- Jugador local de espaldas, abajo al centro.
- Tele a la derecha y al fondo, sobre un mueble. Estantes con botellas genéricas.

**Capas de render (de atrás hacia adelante):**
1. Fondo: pared, ventana y tele.
2. Personajes medios.
3. Mesa.
4. Objetos sobre la mesa.
5. Cartas.
6. Primer plano: espalda y manos del jugador local.
7. Iluminación: brillo aditivo, viñeta, cono de luz, polvo en suspensión y humo.
8. Interfaz.

### 6.3 Personajes: sistema de marioneta (*cutout rig*)

Cada personaje se arma con **piezas PNG con transparencia**. Todas las piezas comparten el mismo lienzo de referencia, y un archivo `rig.json` define los pivotes y la jerarquía.

**Piezas requeridas:**
- **Torso**, **cabeza** y **pelo o sombrero**.
- **Cejas izquierda y derecha:** neutra, levantada, fruncida.
- **Ojos:** abiertos, entrecerrados, cerrados, guiño izquierdo, guiño derecho, mirando a la izquierda y mirando a la derecha.
- **Bocas:** neutra, sonrisa, sonrisa amplia, grito ("¡Truco!"), "O", beso, mordiendo el labio, punta de la lengua, lamiendo el labio superior, mueca a la izquierda, mueca a la derecha, boca entreabierta y enojada.
- **Nariz:** normal y arrugada. **Cachetes inflados**.
- **Brazos:** parte superior y antebrazo.
- **Manos:** apoyada, sosteniendo cartas, golpeando la carta, mano en el mentón y señalando.
- **Versión de espaldas** (para el jugador local): nuca, hombros, brazos y manos con variantes.

**Animación por código** (sección 7):
- Respiración con una onda seno suave.
- Parpadeo aleatorio cada 2–6 s.
- Miradas a las cartas y a la tele.
- Sorbo de mate.
- Reacciones y señas.

**Variantes de color** (camisa, pelo, gorra sí o no) por personaje, para que en 2vs2 no se repitan personajes idénticos.

**Hasta que exista el arte final:**
- Construí **placeholders vectoriales con buen estilo**, nunca cajas grises.
- Usá la misma estructura de rig, para que reemplazar los PNG no implique cambiar código.

### 6.4 Producción del arte con IA (presupuesto cero)

1. Escribí `docs/arte/PROMPTS_IMAGENES.md` con prompts listos para copiar y pegar en un generador de imágenes (ChatGPT u otro). Si tu entorno tiene generación de imágenes propia, podés usarla. Incluí:
   - un **bloque de estilo fijo** que se repite en todos los prompts;
   - una **hoja de personaje** por personaje (de frente y de espaldas, con expresiones);
   - las **piezas sueltas** en 2048 px sobre fondo transparente, con la misma pose y escala de referencia;
   - los **fondos** de cada entorno en capas: pared, ventana, tele, estantes, mesa y objetos;
   - las **figuras de las cartas**.
2. El humano genera las imágenes y las deja en `assets-src/`.
3. Un script `tools/art/` recorta, alinea con el rig, genera la versión `@1x`/`@2x` y arma los atlas con **AssetPack** (`@assetpack/core`).
4. Mantené `docs/arte/CHECKLIST.md` con cada pieza y su estado: pendiente, placeholder o final.

### 6.5 Cartas

- **Diseño original de baraja española** (el diseño tradicional es de dominio público, pero el dibujo es nuestro), en **SVG**.
  - Las cartas numéricas se generan por código, con los símbolos distribuidos de forma tradicional.
  - Las figuras (10, 11 y 12 de cada palo) son ilustraciones cartoon.
- **Skins de la versión 1:**
  - **"Clásica":** papel crema con rojo, azul y dorado.
  - **"Celeste"** (identidad uruguaya): celeste y dorado, con bordes gastados.
  - Cada skin trae su propio dorso.
- Para rendimiento, los SVG se rasterizan a atlas en el build.
- **Legibilidad:** el número y el palo se leen bien a 40 px de ancho. Las piezas se destacan con un brillo sutil que depende de la muestra.

### 6.6 Tipografía

- Display, para cantos y títulos: **Lilita One** o **Luckiest Guy** (licencias OFL/Apache).
- Interfaz: **Nunito** (OFL).
- Las fuentes se alojan en el propio proyecto (sin CDN externo).

---

## 7. Animación y "juice"

### 7.1 Principios

- Anticipación, *squash & stretch*, continuidad del movimiento y curvas de aceleración con carácter (`back.out`, `expo.out`).
- Las animaciones son **interrumpibles** y nunca bloquean la entrada más de lo necesario.
- **Tokens de duración:** `fast` 120 ms, `base` 220 ms, `slow` 400 ms, `dramatic` 700 ms.
- Opción **"Velocidad de juego"** (normal o rápida), que multiplica las duraciones.
- Opción **"Animaciones reducidas"**, que además respeta `prefers-reduced-motion`: reemplaza los movimientos grandes por fundidos, sin perder información.

### 7.2 Lista obligatoria (todas a 60 fps, con sonido asociado)

| Momento | Animación |
|---|---|
| Barajar | Mezcla tipo *riffle* + puente en el centro de la mesa |
| Repartir | Cartas que vuelan en arco desde el mazo, con rotación, escalonadas y con sombra suave |
| Muestra | Volteo "3D" (escala en X + sesgo + destello). Si sale una pieza, brillan las piezas de la mano |
| Seleccionar carta | Elevar, inclinar y brillo de borde (hover en escritorio, toque en móvil) |
| Jugar carta | Arrastrar o tocar. Viaja en arco al centro, aterriza con *squash* y una nube de polvo. Si es pieza, golpe fuerte, sacudida leve de cámara y destello |
| Ganar baza | Las cartas se deslizan hacia el lado del ganador |
| Parda | Las cartas chocan y aparece el sello "¡PARDA!" |
| Cantos | Globo de historieta gigante con forma de explosión, texto con golpe tipográfico, zoom leve sobre quien canta y la reacción de los demás |
| Envido | Secuencia de globos "Tengo 33" / "Son buenas" |
| Flor | Estallido de pétalos + sello de flor |
| Fin de mano | Recoger las cartas y rearmar el mazo |
| Puntos | Los fósforos caen y se acomodan en el tanteador |
| Fin de partida | Victoria: festejo y confeti de papelitos. Derrota: bronca cómica. Pantalla de XP y nivel |
| Inactividad | Respiración, parpadeo, mirar cartas, sorbo de mate. La tele parpadea con luz de color sobre las caras |
| Esperar turno | Tamborilear los dedos, mano en el mentón |
| Señas | Gestos faciales (sección 4.11) |
| Desconexión | El personaje se congela con la nube "Reconectando…" |

### 7.3 Iluminación y efectos

- Brillo aditivo de la bombita y viñeta.
- Cono de luz con partículas de polvo.
- Humo con un shader de ruido que se desplaza.
- Luz de color de la tele sobre las caras cercanas (modulación de tinte).
- Desenfoque leve del fondo, preferentemente horneado en la imagen.
- **Calidad automática:** si los fps bajan de 50 durante 3 s, se reducen partículas y filtros. También hay un ajuste manual de calidad (Alta, Media, Baja).

### 7.4 Galería de animaciones (solo en desarrollo)

Ruta `/dev/animaciones`:
- Cada animación se dispara sola, con controles de velocidad (0,25×, 0,5× y 1×) y de repetición.
- Sirve para que el humano revise el pulido.

Ruta `/dev/sonidos`: escuchar cada sonido y probar la mezcla.

### 7.5 Implementación

- PixiJS v8 para la escena, con GSAP para las líneas de tiempo.
- *Pools* de objetos para partículas y cartas.
- Cero asignaciones de memoria en el loop de render.

### 7.6 La tele

- Componente `TvScreen` con **proveedores de contenido**:
  - `matchLoop`: partido de fútbol cartoon original y procedural, con jugadores chiquitos, pelota e hinchada, sin equipos reales. A veces hay un **gol**: la tribuna grita apagada en el ambiente y los personajes miran la tele.
  - `houseAd`: promos propias, por ejemplo "Pase Boliche".
  - `sponsorAd`: imagen o video desde configuración remota, con frecuencia limitada. Se deja implementado pero **desactivado**.
- Estética CRT: líneas de barrido, curvatura y brillo que se derrama sobre la pared.

---

## 8. Diseño responsive (OBLIGATORIO: móvil y escritorio)

### 8.1 Objetivo

- Se ve **excelente** en cualquier viewport, de 320 px a 4K, vertical u horizontal: teléfonos, tablets y escritorio.
- Sin scroll horizontal.
- Respeta las áreas seguras del dispositivo (`env(safe-area-inset-*)`).

### 8.2 Perfiles de layout de la escena

Según la relación de aspecto:
- `portrait` (< 0,8)
- `square` (0,8–1,3)
- `landscape` (> 1,3)

Cada perfil define la posición de:
- los rivales y el compañero;
- la mesa;
- el mazo y la muestra;
- la mano local;
- la tele;
- el tanteador;
- la barra de acciones;
- el chat.

Al rotar el dispositivo o cambiar el tamaño de la ventana, la escena **reacomoda los elementos con una animación** (sin saltos).

### 8.3 Reglas por perfil

- **Arte con margen extra:** los fondos se pintan más grandes que la vista y en capas separadas (pared, tele, estantes, lámpara), para poder reubicarlos según el perfil.
- **Escritorio (landscape):**
  - Se ve más boliche: estantes, tele más grande al costado del rival.
  - El ancho sobrante se usa para paneles laterales: tanteador detallado, historial de cantos y chat.
  - Estados *hover* y cursor propio.
- **Atajos de teclado en escritorio:**

| Tecla | Acción |
|---|---|
| `1` `2` `3` | Jugar carta |
| `T` | Truco, retruco o vale cuatro |
| `E` | Envido |
| `R` | Real envido |
| `F` | Falta envido |
| `Q` | Quiero |
| `N` | No quiero |
| `M` | Mazo |
| `S` | Señas |
| `C` | Chat |
| `Esc` | Menú |

- **Teléfono horizontal** (alto bajo, ~360 px): interfaz compacta y barra de acciones lateral.
- **Tamaños mínimos:** zonas táctiles de al menos 48 dp y textos de al menos 14 px equivalentes. La interfaz escala con `clamp()` sobre el mínimo entre ancho y alto de la vista.
- **Menús en DOM:** usan container queries y funcionan con táctil, mouse y teclado.

### 8.4 Matriz de capturas (Playwright, en cada fase con interfaz)

`360×640`, `390×844`, `412×915`, `844×390` (teléfono horizontal), `768×1024`, `1024×768`, `1280×720`, `1366×768`, `1920×1080`, `2560×1440`, `3440×1440`.

### 8.5 Resolución

- Resolución del renderer = mínimo entre `devicePixelRatio` y 2.
- Atlas `@1x`/`@2x` elegidos según el dispositivo.
- Atlas de 2048² como máximo en equipos de gama baja y 4096² en gama alta.

---

## 9. Stack técnico (decidido)

Monorepo con **pnpm workspaces** y **TypeScript strict** en todos los paquetes.

| Paquete | Tecnología | Responsabilidad |
|---|---|---|
| `apps/client` | Vite + React 19 + PixiJS v8 + GSAP 3 + Zustand + Web Audio nativo + CSS Modules | React maneja menús, HUD y overlays en DOM. Pixi maneja la escena en canvas |
| `packages/engine` | TypeScript puro, **cero dependencias**, determinista | Reglas, estado y acciones legales. Se comparte con el servidor, el cliente, los bots y los tests |
| `packages/protocol` | TypeScript + zod | Mensajes cliente↔servidor. Se validan en el servidor, que es la frontera de confianza |
| `packages/bots` | TypeScript (usa el motor) | IA y simulador |
| `packages/shared` | TypeScript + JSON | Catálogo de cosméticos, configuración de marca y constantes |
| `apps/server` | Cloudflare Worker + Durable Objects (Wrangler) | Sirve el cliente estático, la API y los WebSockets. `MatchRoom` (una por partida) y `Matchmaker` (uno por modo) |
| Datos y cuentas | **Supabase** (Auth + Postgres + RLS) | Login invitado (anónimo) y con Google, perfiles, fichas, inventario, compras, partidas y ranking |
| Android | **Capacitor** (última versión estable) | AdMob (`@capacitor-community/admob`), RevenueCat (`@revenuecat/purchases-capacitor`), Haptics, App, Share, SplashScreen y StatusBar |
| Calidad | Vitest, fast-check, Playwright | Tests unitarios, tests de propiedades, e2e multijugador y capturas |
| CI/CD | GitHub Actions | Lint, chequeo de tipos, tests y build. Despliegue a Cloudflare al hacer merge en `main` |
| Observabilidad (Fase 5) | Sentry (plan gratis) + PostHog (plan gratis) | Errores y analítica del juego |

**Por qué este stack:**
- **Pixi + React** combina una escena con animación de alto rendimiento con menús responsive y accesibles en DOM.
- **Durable Objects** da salas autoritativas con WebSockets en el plan gratis de Cloudflare, en el mismo proyecto que sirve la web. Vercel no sirve para esto porque no mantiene conexiones persistentes.
- **Capacitor** reutiliza el 100 % del cliente para Android.
- **Motor compartido:** las reglas se escriben una sola vez.

**Comandos esperados** (documentalos en `AGENTS.md`): `pnpm dev`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm sim --hands 100000`, `pnpm deploy`, `pnpm android:sync`.

---

## 10. Red, servidor y seguridad

### 10.1 Servidor autoritativo

- El cliente envía **intenciones** (`{type:'PLAY_CARD', cardId, seq}`).
- `MatchRoom` las valida con el motor y emite **eventos filtrados por asiento**, usando `viewFor(state, seat)`.
- Las cartas ajenas, el orden del mazo y la semilla **nunca** salen del servidor hasta que las reglas las revelan.

### 10.2 Durable Objects

- **API de WebSocket Hibernation.**
- **Alarms** para:
  - los timers de turno;
  - la gracia por desconexión;
  - los tiempos de pensar de los bots.
- El estado se persiste en el almacenamiento del Durable Object en cada acción, para recuperarse si el objeto se reinicia.

### 10.3 Matchmaking

- Una cola por modo (1vs1 y 2vs2).
- Ventana de MMR de ±100 que se amplía ±50 cada 3 s.
- **Relleno con bots a los 12 s** (configurable). Los humanos siempre tienen prioridad. En 2vs2 se puede completar parcialmente, por ejemplo con 2 humanos y 2 bots.
- El jugador ve una pantalla de búsqueda animada y la transición a la mesa es igual haya bots o no.

### 10.4 Salas privadas

- **Código de 6 caracteres** con el alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin caracteres ambiguos). Se resuelve con `idFromName(código)`.
- El anfitrión elige:
  - el modo (1vs1 o 2vs2);
  - los asientos y equipos (en 2vs2);
  - las reglas (30 o 40, con o sin flor).
- Invitación por link (`/sala/ABC123`, con App Links en Android) y botón de compartir (Web Share API o `@capacitor/share`).
- El anfitrión puede **completar los asientos vacíos con bots**, por ejemplo 2 amigos contra 2 bots.
- La sala expira tras 10 minutos sin actividad.

### 10.5 Reconexión

- Token de sesión.
- Al reconectar, el cliente recibe una foto completa del estado.
- Eventos con número de secuencia.
- Intenciones idempotentes.

### 10.6 Defensas

- Validación con zod de cada mensaje.
- Tamaño máximo de mensaje.
- Límite de mensajes por conexión.
- Verificación del JWT de Supabase (JWKS) en el Worker.
- Tests que mandan intenciones ilegales y comprueban que se rechazan.

---

## 11. Economía de fichas (valores por defecto, ajustables en `economy_config`)

| Parámetro | Valor por defecto |
|---|---|
| Fichas de bienvenida | 10 |
| Regeneración gratis | +1 ficha cada 2 h, hasta un tope de 5. Se calcula al leer el saldo, sin cron |
| Anuncio recompensado | +2 fichas, máximo 5 por día, verificado en el servidor (AdMob SSV, idempotente) |
| Packs (Android) | Pequeño, mediano y grande (por ejemplo 20, 60 y 150 fichas). Los precios se definen en Play Console |
| "Pase Boliche" (suscripción mensual) | Fichas ilimitadas + tele sin promos + 1 cosmético exclusivo por mes |
| Costo por partida | 1 ficha por jugador humano: matchmaking, sala privada y revancha |

- **Libro contable append-only:** `wallet_tx(user_id, delta, reason, ref UNIQUE)`, con `ref` como clave de idempotencia. El saldo se mantiene con un trigger.
- Solo el servidor (`service_role` desde el Worker o RPC `SECURITY DEFINER`) puede escribir fichas, inventario y compras.
- La interfaz muestra "Entrada: 1 ficha" antes de jugar. **Nunca** muestra "perdiste X fichas".
- **Web (versión 1):** sin anuncios ni compras. Las fichas salen solo de la bienvenida y la regeneración.
- **Sin fichas:** se abre un modal con el tiempo que falta para la próxima ficha. En Android suma "Ver anuncio (+2)" y "Comprar".
- **Si un bot reemplaza a alguien que abandonó**, la partida sigue siendo calificada para los humanos que quedan. El que abandonó suma una derrota.

---

## 12. Personalización (base escalable)

- El catálogo vive en `packages/shared/catalog.json` y lo usan tanto el cliente como el Worker:

```json
{ "id": "char_don_washington", "category": "character", "name": "Don Washington",
  "unlock": { "type": "default" }, "assets": "characters/don_washington/manifest.json",
  "variants": ["base", "camisa_roja", "sin_boina"], "iapProductId": null }
```

- **Categorías de la versión 1:**
  - `character` (2)
  - `environment` (2)
  - `cardSkin` (2, cada una con su dorso)
- **Categorías preparadas para el futuro** (el tipo existe, sin contenido): `table`, `quickPhrases`, `voicePack`.
- **Tipos de desbloqueo:** `default` (por defecto), `level` (por nivel) e `iap` (compra en la app).
- **Loadout por usuario:** lo que tiene equipado. El servidor verifica que el usuario tenga el ítem antes de equiparlo.
- **Quién ve qué:**
  - Los **rivales y el compañero ven tu personaje**: es lo que hace atractivo comprarlo.
  - Las **cartas y el entorno** se ven con tu propia elección y son solo locales.
  - En las salas privadas, el anfitrión puede forzar un entorno.
- **Agregar un ítem nuevo** = agregar su carpeta de assets + una entrada en el catálogo. Cero cambios de código. Los assets de cada ítem se cargan cuando se necesitan.

**Contenido de la versión 1 (todo original):**
- **Personajes:**
  - **"Don Washington":** veterano de bigote canoso, boina, chaleco sobre camisa a cuadros. Pícaro y tranquilo.
  - **"Marta":** mujer de unos 50 años, pelo recogido y cárdigan. Mirada filosa, se ríe fuerte.
- **Entornos:**
  - **"Galpón de campo — día"** (referencia: foto 2).
  - **"Boliche — noche"** (referencia: foto 3, con lluvia opcional).
- **Cartas:** "Clásica" y "Celeste".

---

## 13. Audio (Audio Bible) — prioridad alta

### 13.1 Motor de audio

**Web Audio API nativa**, con un `AudioManager` liviano:

- **Buses de mezcla** (`GainNode`): `master`, `music`, `ambience`, `sfx`, `voice` y `ui`.
- **Ducking** con rampas de ganancia:
  - Una voz baja la música 6 dB y el ambiente 4 dB.
  - Los cantos grandes (truco, vale cuatro, contraflor) agregan un *stinger* y bajan más.
- **Paneo por asiento** (`StereoPannerNode`): en 2vs2, los rivales suenan a izquierda y derecha.
- **Reverb de sala chica** (`ConvolverNode` con una respuesta de impulso CC0) en las voces, para que suenen "dentro" del boliche.
- **Desbloqueo del audio** con el primer gesto del usuario, en la pantalla "Tocá para entrar".
- **Pausa** cuando la página se oculta (`visibilitychange`) y cuando la app pasa a segundo plano en Android.
- **Formatos:** OGG/Opus como principal y AAC/M4A como alternativa, detectando con `canPlayType`. Los loops tienen puntos de loop definidos, sin clics.

### 13.2 Música adaptativa

- Milonga y candombe **instrumental**:
  - tema de menú;
  - loop de partida en **capas** (base de guitarra, percusión de candombe y una capa de tensión);
  - stingers de victoria y derrota.
- **Intensidad:** las capas se funden según:
  - qué tan cerca de 30 están los equipos;
  - el nivel del truco (retruco o más);
  - si hay una contraflor en juego.
- Si no hay capas separadas disponibles, se hace un fundido entre dos pistas: calma y tensión.

### 13.3 Ambiente por entorno (loops + sonidos sueltos con variación aleatoria)

- **Boliche — noche:**
  - murmullo de gente y vasos;
  - tele con relato de fútbol lejano e ininteligible;
  - zumbido de heladera;
  - lluvia sobre chapa (opcional).
- **Galpón — día:**
  - pájaros y viento;
  - un perro a lo lejos;
  - la tele;
  - una chapa que cruje.

### 13.4 Efectos (cada uno con al menos 3 variantes + pitch aleatorio ±3 % y volumen ±2 dB)

- **Cartas:** barajar (*riffle* y puente), repartir, deslizar, apoyar suave, **golpe fuerte de pieza**, volteo de la muestra y recoger cartas.
- **Tanteador:** fósforo que cae y se acomoda.
- **Interfaz:** botón, hover en escritorio, interruptor, abrir panel, compra (un "sello" cálido, **nunca** monedas de casino).
- **Momentos del juego:**
  - subir de nivel (rasgueo corto);
  - jingle de victoria y de derrota;
  - tic de los últimos 5 s del turno;
  - sonido de chat;
  - susurro de la seña;
  - brillo de la flor;
  - grito de gol apagado de la tele.
- Si una licencia no da garantías, sintetizá los sonidos de interfaz con Web Audio y exportalos.

### 13.5 Voces con IA (OBLIGATORIAS desde la versión 1)

**Manifest** `assets-src/voices/voice-lines.json`:
- Un perfil de voz por personaje: voz, pitch, velocidad y estilo.
- Cada línea tiene 2–3 variantes.

**Líneas mínimas:**
- **Cantos:**
  - ¡Truco!, ¡Quiero retruco!, ¡Quiero vale cuatro!
  - ¡Quiero!, ¡No quiero!
  - ¡Envido!, ¡Real envido!, ¡Falta envido!
  - ¡Flor!, ¡Contraflor al resto!, Con flor me achico
  - Me voy al mazo, Paso, Son buenas
- **Tantos:** "Tengo {n}" y "{n} son mejores", para n de 0 a 37 (envido) y de 20 a 47 (flor).
- **Reacciones y frases rápidas:**
  - ¡Uh!, una risa corta
  - ¡Qué suerte, bo!, ¡Tomá!
  - Bien jugado, Dale que va, ¡Esa es!
  - Mirá vos…, No te la puedo creer, ¡Ta!, De una

**Pipeline** `tools/voices/generate.ts`, idempotente, con caché por hash: solo regenera las líneas que cambiaron.
1. Lee el manifest.
2. Sintetiza con **Azure AI Speech**, en el plan pago por uso S0. La salida del plan gratis F0 no tiene garantizado el uso comercial, y el guion entero cuesta centavos de dólar.
   - Voces neuronales **es-UY** (`es-UY-MateoNeural`, `es-UY-ValentinaNeural`) y **es-AR** (`es-AR-TomasNeural`, `es-AR-ElenaNeural`), para tener cuatro timbres rioplatenses.
   - Verificá en la galería de Azure que las voces sigan disponibles.
   - Usá SSML con `prosody` (velocidad, tono y volumen) según la emoción: los cantos van fuertes y rápidos, los tantos en tono confidente.
3. Post-procesa con ffmpeg:
   - recorta silencios;
   - normaliza a -16 LUFS con pico máximo de -1 dBTP;
   - aplica pitch y ecualización por personaje;
   - exporta OGG y M4A;
   - arma los sprites de audio con su JSON.
4. La clave se lee de la variable de entorno `AZURE_SPEECH_KEY` y nunca se sube al repo.

**Alternativas** (documentalas en `docs/AUDIO.md`):
- Chatterbox Multilingual (licencia MIT, corre local).
- OpenAI `gpt-4o-mini-tts`.

**A futuro:** voces humanas grabadas que **reemplazan los archivos con las mismas claves** del manifest, sin tocar código.

**Sincronía:** cuando una voz canta, la boca del personaje alterna entre las formas "grito", "O" y "neutra", siguiendo la envolvente de amplitud del audio. Es un *lip-flap* simple.

### 13.6 Fuentes de audio y licencias (presupuesto cero)

- **Primero CC0:** Freesound (filtro CC0), packs de audio de Kenney y los bundles Sonniss GDC (libres de regalías).
- **Después:** licencia de Pixabay, verificando archivo por archivo.
- **Prohibido:** licencias NC (no comerciales) o dudosas.
- Registrá todo en `CREDITS.md`: archivo, URL, autor y licencia.

### 13.7 Vibración (haptics)

- **Android** (Capacitor Haptics): leve al jugar una carta, media en el golpe de pieza y fuerte en un canto o una victoria.
- **Web:** `navigator.vibrate` donde exista, desactivado por defecto en escritorio.
- Se puede desactivar en Opciones.

---

## 14. Pantallas y flujo

1. **Splash:** logo animado y "Tocá para entrar" (desbloquea el audio).
2. **Primera vez:**
   - elegir apodo (validado y con filtro de malas palabras en español rioplatense);
   - elegir personaje;
   - ofrecer el tutorial.
3. **Tutorial interactivo**, contra un bot con mazo armado. Enseña:
   - la muestra y las piezas;
   - jugar una carta;
   - el truco, el envido y la flor;
   - las señas (2vs2, versión corta);
   - el tanteador con fósforos.

   Se puede saltear. Además, hay una pantalla **"Reglamento"** accesible desde Opciones y desde el menú de partida.
4. **Menú principal:**
   - Fondo: la escena viva, con la tele, los personajes en reposo y el ambiente sonando.
   - Botones grandes: **JUGAR**, **TIENDA**, **OPCIONES**.
   - Barra superior: avatar, nivel con barra de XP, saldo de fichas con botón "+" (conseguir más) y engranaje de opciones.
5. **JUGAR:**
   - **Buscar partida:** elegir 1vs1 o 2vs2, mostrar "Entrada: 1 ficha" y pasar a la búsqueda animada (con cancelar y el tiempo transcurrido).
   - **Jugar con un amigo:**
     - **Crear sala:** modo, reglas, código grande con botones de copiar y compartir, asientos con avatares y "Listo".
     - **Unirse:** código en 6 casillas, con soporte para pegar.
6. **Partida (HUD):**
   - Tanteador (fósforos + número), mazo y muestra.
   - **Barra de acciones contextual** que muestra **solo las acciones legales en ese momento**: Truco/Retruco/Vale 4, Envido/Real/Falta, Quiero/No quiero, Mazo, Señas (2vs2) y Chat rápido.
   - Anillo de tiempo del jugador activo.
   - Menú con opciones y abandonar (advierte que pierde la ficha y cuenta como derrota).
7. **Fin de partida:**
   - ganador y estadísticas: bazas, trucos y tantos ganados;
   - XP y subida de nivel;
   - **Revancha** (salas privadas) o volver al menú.
8. **Tienda:**
   - Pestañas: Fichas | Personajes | Entornos | Cartas.
   - Vista previa: el personaje animado, el entorno en miniatura y el abanico de cartas.
   - Botones de equipar y precio. En la web, modo vitrina.
9. **Opciones:**
   - Volumen de cada bus (5), vibración, animaciones reducidas, velocidad de juego y calidad gráfica.
   - Cuenta: vincular Google, cerrar sesión y **borrar cuenta**.
   - Reglamento, Créditos, Términos, Privacidad y Soporte.
10. **Accesibilidad:**
    - Contraste AA.
    - Textos escalables.
    - Etiquetas para lectores de pantalla en la interfaz DOM.
    - Foco visible con teclado.
    - Los palos se distinguen por forma y nunca solo por color.

**Chat:** solo **frases rápidas predefinidas**, sin texto libre. Así no hace falta moderación.

**Perfil y progreso:**
- **XP:** victoria 50, derrota 20. Bonos chicos por flor y por truco ganado.
- Curva de niveles en `economy_config`.
- **MMR Elo** (K = 32).
- **Ranking semanal:** solo partidas entre humanos y calificadas. Se reinicia los lunes a las 00:00, hora de `America/Montevideo`.

---

## 15. Fases (roadmap de ejecución, en orden y sin paradas)

Ejecutá las fases 0 a 8 una detrás de otra (regla 1 de la sección 1). La Fase 9 empieza recién después del lanzamiento: no la ejecutes en modo autónomo.

**Fase 0 — Base del proyecto**
- Monorepo, `AGENTS.md`, `docs/` (`REGLAS.md` basado en la sección 4, `ARTE.md`, `AUDIO.md`, `DECISIONES.md`) y `CREDITS.md`.
- CI y despliegue de un Worker "hola" a `*.workers.dev`.
- Migraciones iniciales de Supabase (estructura vacía).
- **Criterios de aceptación:** `pnpm i && pnpm dev` funciona, CI en verde y la URL pública responde.

**Fase 1 — Motor + bots (sin gráficos)**
- Motor completo con todos los flags.
- Tests de la sección 4.14 + tests de propiedades:
  - el mazo siempre tiene 40 cartas únicas;
  - los puntos nunca son negativos;
  - toda partida termina;
  - `viewFor` nunca filtra información oculta.
- Bots de 3 niveles y simulador por línea de comandos.
- **Criterios de aceptación:**
  - cobertura del motor ≥ 95 %;
  - `pnpm sim --hands 100000` sin errores ni estados ilegales;
  - reporte de tasa de victorias entre niveles de bot (el nivel alto le gana al bajo con claridad);
  - lista de puntos [VALIDAR] en `docs/REGLAS.md`.

**Fase 2 — Vertical slice local**
- Escena 1vs1 jugable contra un bot, en modo de desarrollo `?local=1`, con placeholders con estilo.
- Todas las animaciones de la sección 7.2, audio con efectos provisorios y los 3 perfiles responsive.
- Galerías `/dev/animaciones` y `/dev/sonidos`.
- **Criterios de aceptación:**
  - matriz de capturas completa;
  - 60 fps estables en Chrome DevTools con perfil móvil (CPU 4× más lenta);
  - una partida completa a 30 jugable de principio a fin.

**Fase 3 — Multijugador online**
- `MatchRoom` y `Matchmaker`, 1vs1 y 2vs2, relleno con bots, salas privadas con código y link.
- Reconexión, timers, señas y chat rápido.
- Auth de Supabase: invitado y Google, con vinculación de la cuenta invitado a Google sin perder el progreso.
- Escena 2vs2.
- **Criterios de aceptación:**
  - Playwright con 2 y 4 contextos de navegador completa partidas;
  - cortar la conexión en medio de una mano y reconectar funciona;
  - las intenciones ilegales se rechazan;
  - el bot toma el asiento a los 45 s.

**Fase 4 — Producción de arte y audio**
- `docs/arte/PROMPTS_IMAGENES.md`, más un pendiente en `docs/PENDIENTES_HUMANO.md` para que el humano genere las imágenes. No esperes: seguí puliendo con placeholders e integrá cada imagen a medida que aparezca en `assets-src/`.
- Integración del rig de personajes, entornos y skins de cartas.
- Pipeline de voces e integración, música y ambiente.
- **Pasada de pulido** sobre cada animación, con checklist.
- **Criterios de aceptación:** cero placeholders, `CREDITS.md` completo, mezcla revisada en `/dev/sonidos` y capturas.

**Fase 5 — Meta y economía**
- Perfiles, XP y niveles, libro de fichas con regeneración, tienda (vitrina en la web), loadout, tutorial y ranking semanal.
- Opciones, Reglamento, `/terminos`, `/privacidad` (con el aviso de bots) y borrado de cuenta.
- Sentry y PostHog.
- **Criterios de aceptación:** tests de la economía y de idempotencia del libro, y flujo completo de usuario nuevo con capturas.

**Fase 6 — Beta web pública**
- PWA instalable, links para compartir y formulario de feedback.
- Ajuste fino de bots y economía con datos reales.
- **Criterios de aceptación:** Lighthouse ≥ 85 en el menú, tasa de errores < 1 % de las sesiones y build de producción en Cloudflare.

**Fase 7 — Android**
- Proyecto Capacitor: ícono, splash, botón atrás, ciclo de vida (pausa de audio), vibración y App Links.
- AdMob recompensado (primero con IDs de prueba) con SSV.
- RevenueCat + Play Billing: packs y Pase Boliche, con webhook al Worker para acreditar.
- Firma del release (instrucciones del keystore, **nunca** subirlo al repo) y AAB.
- `targetSdk` según el mínimo vigente que exige Google Play.
- **Criterios de aceptación:** funciona en un dispositivo físico, compras en la pista de prueba con testers de licencia y anuncios en modo prueba.

**Fase 8 — Publicación en Play Store**
- Material de la ficha:
  - ícono de 512 px;
  - imagen destacada de 1024×500;
  - capturas de teléfono y tablet;
  - descripción corta y larga en español de Uruguay, sin vocabulario prohibido.
- Borradores de las respuestas al cuestionario de clasificación (IARC) y al formulario de Seguridad de los datos.
- URL de la política de privacidad.
- Guía paso a paso para la prueba cerrada (12 testers durante 14 días, si la cuenta es personal) y el lanzamiento escalonado.
- El humano ejecuta los pasos en Play Console.

**Fase 9 — Operación en vivo**
- Tableros: retención D1/D7/D30, ARPDAU, anuncios vistos por usuario y conversión del pase.
- Pipeline de nuevos cosméticos.
- Eventos semanales gratuitos con premios **solo cosméticos**.
- Activación gradual del espacio publicitario de la tele.
- Voces humanas y arte del ilustrador.
- Variante "Truco argentino" (nuevos flags del motor) para expandirse a Argentina.

---

## 16. Budgets de rendimiento y calidad

- **60 fps** en un Android de gama media (Moto G / Galaxy A de 2021 en adelante), con un piso de 30 fps gracias a la calidad automática.
- **Carga inicial web:** JS + CSS < 400 KB gzip para el menú. Los assets de cada entorno se cargan cuando se necesitan. Interactivo en menos de 4 s en 4G.
- **Memoria de texturas** < 256 MB en móvil.
- El render y el audio se pausan cuando la pestaña o la app pasan a segundo plano.
- **Cero errores de consola** en producción. TypeScript sin `any` implícito. ESLint sin advertencias.

## 17. Definición de "terminado" (para cada funcionalidad)

- [ ] Funciona en táctil, mouse y teclado.
- [ ] Se ve bien en toda la matriz de capturas.
- [ ] Tiene animación y sonido pulidos, o justificación escrita de por qué no los necesita.
- [ ] Tests nuevos y existentes en verde.
- [ ] Sin vocabulario prohibido.
- [ ] Sin secretos en el repo.
- [ ] `docs/` actualizado si cambió una regla o una decisión.

## 18. Lo que NO debés hacer

- No copiar arte, nombres ni diseños de otros juegos. No usar marcas ni equipos reales.
- No implementar apuestas de fichas entre jugadores, cajas sorpresa ni premios con valor real.
- No mostrar anuncios intersticiales en medio de una mano ni anuncios de apuestas.
- No confiar en el cliente: toda regla y todo movimiento de fichas se valida en el servidor.
- No cerrar una fase con tests en rojo o sin revisar las capturas.
- No quedarte esperando al humano si todavía hay trabajo que no depende de él.
- No inventar reglas: lo que no está en la sección 4 se registra como [VALIDAR].
