# VLADI TRUCO — entrega y auditoría

Fecha: 11 de octubre de 2026. Sitio: https://vladyerik.com/vladi-truco/
Alcance: exclusivamente `vladi-truco/`. No se modificaron otros juegos, Arcade, CNAME ni configuración global. Publicación mediante el flujo existente de GitHub Pages.

## Versión jugable

Truco argentino mano a mano, 15/30 tantos, tres dificultades, truco/retruco/vale cuatro, envido/real/falta, flor configurable con contraflor y al resto. Dos ambientes: clásica argentina y VLADYERIK premium. Cartas individuales seleccionables y animadas al repartir, jugar y recoger. Marcador con tantos tradicionales, pausa, reglas, voces argentinas grabadas, tango original y tres controles independientes de volumen.

Mesa y personaje creados para este proyecto; 28 naipes tradicionales y reverso con licencia conservada, y 12 figuras originales detalladas. Las imágenes de ambiente son fondos vacíos: no contienen botones, manos ni marcador. Todos estos elementos se dibujan y actualizan según la partida. Créditos: `ATTRIBUTIONS.md`.

## Problemas encontrados en la implementación anterior y correcciones

- El envido se cerraba cuando el rival ya había jugado su primera carta. Ahora cada jugador conserva la posibilidad antes de jugar su propia primera carta, con restricciones de canto propias.
- No se podía priorizar envido/flor ante un truco pendiente. Se suspende el truco, se resuelven los tantos y se retoma la respuesta.
- El envido utilizaba la mano restante: ahora se conservan las tres cartas originales para evitar perder el valor después de jugar.
- Falta envido aplicaba la división de malas/buenas también a partidos de 15. Se separaron las reglas de 15/30 y se ofrece una variante regional explícita.
- Flor comparada siempre concedía tres tantos y carecía de contraflor. Se implementaron flor simple, comparación, achicarse, contraflor y al resto; puntuación explicada en las reglas.
- La mano no se bloqueaba inmediatamente al ganar dos bazas: ahora los estados terminales impiden nuevas jugadas y doble anotación.
- Se revisaron pardas, mano, derecho de subir el truco, rechazo de cadenas y fin de partido durante el envido.
- Se reemplazaron la presentación plana y figuras básicas por ambientación cinematográfica, figuras detalladas y controles dorados funcionales.
- Se corrigieron título oscuro, controles móviles superpuestos, cartas cercanas a botones en horizontal y un archivo vacío de sota de oros detectado en la revisión publicada. Todas las imágenes WebP se decodificaron después de la corrección.

## Pruebas automáticas

`cd vladi-truco && npm test` — 32 pruebas, 32 aprobadas, cero fallos.
`npm run test:syntax` — comprobación sintáctica de motor e interfaz.

Cobertura: 40 cartas únicas y jerarquía completa; 9.880 combinaciones de envido/flor; 54 combinaciones de pardas; 1.000 mezclas reproducibles; cadenas de tantos, prioridad del envido, subidas, rechazos, puntuación de flor, estados terminales e IA sin acceso a cartas ocultas. 300 partidas completas simuladas cubren las tres dificultades, 15/30 y flor activada/desactivada.

## Navegador y responsive

Prueba sobre el sitio publicado en Chrome. Se verificaron reparto, selección y juego, resultado de baza, envido querido, truco no querido, ir al mazo, nueva mano, cambio de mesa, pausa/reanudación y volúmenes independientes (música 0 manteniendo voces 85 y efectos 75).

Viewport de PC observado: 1363 × 936. Verificador de iframe con viewport real: 320 × 568, 360 × 640, 390 × 844, 430 × 932, 844 × 390, 1024 × 768, 1366 × 768, 1920 × 1080. Dimensiones de documento y mesa coinciden; no hay scroll de la mesa. Resultados: `tests/responsive-results.json`. Capturas del juego publicado: `tests/captures/pc.jpg` y `tests/captures/mobile.jpg` (390 × 844; recorte del viewport de juego, sin alterar contenido).

## Pendientes y límites

- Falta comprobar en dispositivos físicos Android/iPhone y Safari; la prueba móvil realizada usa un viewport de iframe en Chrome, no hardware móvil.
- La salida de audio de este navegador remoto no permite certificar la escucha perceptual final. Los 61 MP3 de voces y el instrumental se validaron con decodificación y señal no silenciosa; quedan por comprobar balance y timbre con parlantes/auriculares reales.
- La música es un tango instrumental original sintetizado, no una grabación de orquesta. Las voces son sintéticas argentinas; su proveedor y origen están identificados.
- Los criterios regionales de falta envido/flor se explican en el selector y las reglas; no se pretende imponer una única variante a todas las mesas argentinas.
- No se detectaron fallos críticos en el motor bajo las pruebas ejecutadas. La validación no sustituye una revisión humana de experiencia, audio y fidelidad artística sobre dispositivos reales.
