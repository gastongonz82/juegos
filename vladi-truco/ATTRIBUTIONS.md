# Recursos y atribuciones — VLADI TRUCO

## Baraja española (40 cartas y reverso)

Arte original: **Basquetteur**, Wikimedia Commons. Vectorización: **gjenkins20**.

- Colección: https://github.com/gjenkins20/spanish-playing-cards-svg
- Autor original: https://commons.wikimedia.org/wiki/User:Basquetteur
- Originales: https://commons.wikimedia.org/wiki/Category:Spanish_playing_cards
- Licencia: **Creative Commons Attribution-ShareAlike 3.0 Unported**.
- Texto de la licencia: https://creativecommons.org/licenses/by-sa/3.0/legalcode
- Commit del recurso utilizado: 907391d14b2b2d2fe41ec61207186ed64a838886

Se incluyen 1–7, 10–12 de espadas, bastos, oros y copas; los ochos y nueves se excluyen. Se rasterizaron los SVG a 360 × 555 y se convirtieron a WebP. La transparencia se compuso sobre papel blanco y se aplicó un tono marfil uniforme. Las ilustraciones no se redibujaron. Los recursos de `assets/cards/` y estas adaptaciones se distribuyen bajo la misma licencia CC BY-SA 3.0. La licencia de estos naipes no se extiende automáticamente al motor ni a los demás recursos del juego.

Los créditos y enlace a licencia están disponibles dentro de «Ver reglas».

## Ambientación y Don Truco

`pulperia.webp`, `pulperia-mobile.webp`, sus dos variantes premium y `don-truco.webp`: imágenes generadas específicamente para este proyecto con la herramienta de generación de imágenes de OpenAI. No son fotografías de personas reales. Dirección visual basada en la referencia aportada por Gastón. Las mesas son fondos vacíos; cartas, marcador, respuestas y controles son elementos funcionales independientes. Descripciones y variantes: `assets/ART-NOTES.md`.

## Música y efectos

`tango-pulperia.mp3`: composición instrumental original para este juego, en re menor, 2/4, 112 BPM; melodía, armonía y síntesis de lengüetas, piano y contrabajo propias. No es una grabación ni una adaptación de un tango comercial. Código reproducible: `tools/compose-audio.py` (Python, NumPy y FFmpeg).

`card.wav`, `shuffle.wav`, `win.wav`: efectos sintetizados específicamente para este juego mediante ruido filtrado, envolventes y notas originales; semilla reproducible. Sin samples externos.

## Voces

Cantos y números escritos para este proyecto, sintetizados con la voz **es-AR-TomasNeural** del servicio de lectura de Microsoft Edge, mediante `edge-tts` 7.2.8. Voz sintética; no es la voz de Vladi ni de una persona contratada. Biblioteca utilizada durante la producción: https://github.com/rany2/edge-tts (LGPL-3.0). La biblioteca no se distribuye ni se ejecuta en el juego. Se preserva esta identificación del proveedor y la voz; no se atribuye a esos recursos una licencia Creative Commons.

El juego reproduce archivos MP3 locales. La síntesis del navegador sólo actúa como respaldo ante un error de carga. No se envía información del jugador a un servicio de voces durante la partida.

## Fuentes de reglas

- John McLeod / Enric Capo, Pagat: https://www.pagat.com/put/truco_ar.html
- Reglamento Truco, XXI Encuentro Nacional de Empleados de Rentas: https://dgrentas.arcat.gob.ar/olimpiadas/reglamentos/truco.pdf
- Reglamento del juego Truco Argentino, escrito por su autor: https://www.trucoargentino.com.ar/reglas/

No se reproduce el texto de estos reglamentos. Se implementan y explican reglas de juego. Dado que existen variantes regionales, esta mesa ofrece dos reglas para falta envido y explica antes de jugar el límite de envidos y la puntuación de flor (3 por flor, 6 si ambas se comparan, 4 al achicarse).
