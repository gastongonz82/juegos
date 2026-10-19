# Pruebas del prototipo VLADYERIK ARCADE

## Entorno
Ejecutar desde servidor HTTP en la raíz del repositorio (no abrir index.html como file://):

```sh
python3 -m http.server 8000
```

Abrir `http://localhost:8000/arcade-cabinet/`.

## Casos manuales obligatorios
1. Cargar el catálogo y verificar imágenes y cantidad de juegos.
2. Moverse por el menú con flechas y Enter.
3. Conectar un joystick USB y comprobar navegación, selección y retorno.
4. Abrir Space Invaders, iniciar con Start y comprobar desplazamiento/disparo.
5. Abrir Arkanoid y comprobar movimiento, lanzamiento y pausa.
6. Abrir Tetris y comprobar desplazamiento, giro y caída de piezas.
7. Salir y entrar varias veces sin controles bloqueados.
8. Probar resolución 1920×1080 y 1280×1024.
9. Confirmar que la rama main y la web pública no cambiaron.

## Límites conocidos
- No hay prueba física del mando realizada todavía.
- El puente Gamepad API → KeyboardEvent es experimental: algunos juegos pueden ignorar eventos sintéticos.
- El mapeo de botones varía entre controladores USB.
- El teclado y Escape pueden comportarse distinto cuando el iframe tiene foco.
- No hay soporte probado para dos jugadores locales.
- El prototipo depende del servidor web y de los recursos del repositorio.

No fusionar a main ni publicar hasta completar la verificación.
