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


