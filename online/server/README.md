# VLADYERIK Online — prototipo local anterior

Este directorio conserva el primer prototipo Node.js/WebSocket y sus pruebas de protocolo. No es el servidor publicado ni lo usa ChatGPT Sites.

La integración de prueba para Sites está en `../site/`: un Worker HTTP de Sites con D1, presencia temporal, salas públicas y privadas, invitaciones y Batalla Naval. Sigue el patrón recuperado en los cinco juegos publicados. No desplegar este servidor Node por separado ni conectar `config.js` a un servicio externo.

Validá el proyecto de Sites desde su checkout con `npm run build`, `npm run validate` y `npm test`. Estas pruebas de lógica no sustituyen la partida solicitada entre dos celulares reales.
