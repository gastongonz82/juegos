# VLADYERIK Online — backend de prueba

Servidor Node.js + WebSocket para presencia, salas públicas, salas privadas por enlace o invitación, y partidas de Batalla Naval entre dos jugadores. El servidor genera y conserva las flotas, valida turnos y tiros, y sólo revela los barcos rivales cuando reciben un impacto.

## Ejecutar en local

```sh
npm install
ALLOWED_ORIGINS=http://localhost:5500,http://localhost:8787 npm start
```

Serví la raíz del repositorio en `http://localhost:5500`, abrí `/online/` y establecé `window.VLADI_ONLINE_WS = 'ws://localhost:8787'` en `online/config.js` para pruebas locales. No uses ese endpoint en una página HTTPS; la web publicada necesita `wss://`.

## Comprobaciones

```sh
npm run check
npm test
```

La prueba de integración crea clientes WebSocket separados en el mismo proceso de prueba y comprueba presencia, una sala pública, una sala privada con código, invitación, inicio de partida, secreto de flota, tiros y turnos. Es una prueba local de protocolo; no sustituye una partida desde dos celulares conectados por Internet.

## Estado y requisitos antes de publicar

- Sólo Batalla Naval implementa partidas online. Damas, Ludo Matic, Tutti Frutti, ¡Basta! y Estanciero se muestran como próximos y no permiten crear partidas.
- El servidor mantiene jugadores, invitaciones y partidas en memoria. Se pierden al reiniciar; si un jugador se desconecta, la partida termina.
- No incluye cuentas, moderación, persistencia, reanudación, protección contra abuso, límites por IP ni métricas.
- `online/config.js` queda vacío hasta que el servidor se despliegue y se verifique con WSS.
- No conectar desde la web publicada ni enlazar el Arcade hasta probar el endpoint WSS y una partida real desde dos dispositivos distintos.
