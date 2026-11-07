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



## A validar con jugadores reales
- Apertura tras parda: quien abrió la baza empatada.
- Falta: leaderNeeds por defecto; malasGanaPartida opcional.
- Flor de ambos equipos: secuencia y comparación de 4.9.
- Señas de 1B y 7O: por definir gestos distintos.
- Implementación provisional: 1B tocar mentón; 7O levantar solo ceja izquierda. Ver decisiones. Flags adicionales `pardaLead` y `florBothMode` identifican la variante implementada.

