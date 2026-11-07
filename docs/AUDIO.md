## 13. Audio (Audio Bible) — prioridad alta

Estado Fase 2: efectos de síntesis Web Audio provisoria, sin licencias externas. Unlock por gesto, seis buses (incluye master), paneo, controles, ducking y pausa por visibilidad. No confundir estos tonos de prueba con voces/música/ambientes finales: se producen en Fase 4 con manifest y claves externas. La galería `/dev/sonidos` permite disparar efectos individualmente.

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


