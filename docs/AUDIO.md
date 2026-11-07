# Producción y mezcla

AudioManager usa Web Audio nativo: seis buses, niveles persistidos, paneo, ducking de música−6dB/ambiente−4dB que respeta el volumen elegido, reverb corta de impulso original, desbloqueo por gesto y suspensión al ocultar. Música original procedural con bajo/guitarra, patrón de percusión y capa de tensión según puntaje, retruco y resto. Ambiente día/viento/pájaros y noche/lluvia/heladera. Efectos originales con tres variantes y variación ±3%/±2dB. Ningún sample de terceros ni música comercial.

Las voces todavía no están sintetizadas. El manifest incluye Washington/Marta/Raúl/Elena, voces es-UY y es-AR, 121 claves y dos variantes (968 clips). Se verificaron las voces uruguayas en la lista oficial de Microsoft. El ejecutor además consulta voices/list en la región elegida antes de generar: no presupone disponibilidad ni estilos expresivos soportados. Usa prosody SSML, no estilos no documentados para esas voces.

## Ejecución reproducible
1. Crear Speech S0 pago por uso en Azure, copiar KEY y REGION a variables de entorno locales, nunca Git. Definir AZURE_SPEECH_TIER=S0.
2. `pnpm voices:plan` enumera faltantes sin síntesis ni cargos.
3. `pnpm voices:generate` sintetiza solo hashes ausentes. Caché ignorada en assets-src/voices/cache. ffmpeg y ffprobe deben estar en PATH.
4. Hash incluye SSML, EQ y versión de postprocesado. Pitch/ritmo por perfil se aplican por prosody antes de EQ, trim, −16LUFS/−1dBTP. Exporta un sprite OGG/Opus y AAC/M4A por voz, JSON de offsets y RMS cada40ms para lip-flap. Cambiar de voz a grabación humana conserva las claves.
5. Revisar pronunciación, silencios, pico y mezcla en /dev/sonidos y mesa real; solo después marcar voces finales. No se validó escucha humana ni archivos inexistentes.

Fuentes: [voces y regiones](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts), [SSML prosody](https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup-voice), [REST TTS](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech).

Alternativas previstas por el maestro: Chatterbox Multilingual local (verificar licencia MIT y requisitos del modelo concreto antes de distribuir) u OpenAI gpt-4o-mini-tts (requiere clave/pago y nueva revisión de precio y derechos al elegirlo). Ninguna se activó silenciosamente. No se usó Azure F0.
