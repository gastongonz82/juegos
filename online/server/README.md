# VLADYERIK Online — servidor de pruebas

Backend Node.js + WebSocket para presencia, invitaciones y Batalla Naval entre dos personas. Las flotas y disparos se gestionan en el servidor: el cliente no recibe la ubicación de los barcos enemigos hasta que los acierta.

## Arranque local

```sh
npm install
ALLOWED_ORIGINS=http://localhost:5500,http://localhost:8787 npm start
```

Servir la carpeta raíz del repositorio en localhost:5500 y abrir `/online/`. Configurar la dirección WebSocket mediante `online/config.js`.

## Antes de producción

- Desplegar en un servidor Node con HTTPS y WebSocket seguro (`wss://`), configurar `ALLOWED_ORIGINS=https://vladyerik.com`.
- Configurar `online/config.js` con el endpoint público.
- Añadir autenticación, límites por IP, protección antiabuso, persistencia y recuperación de partidas antes de abrir a todo público.
- La implementación actual pierde las partidas al reiniciar el proceso; las desconexiones terminan la partida.
- Solo Batalla Naval tiene protocolo multijugador. Los otros cinco juegos siguen pendientes.
- No publicar la sala ni enlazarla desde Arcade hasta completar pruebas entre dos dispositivos reales.
