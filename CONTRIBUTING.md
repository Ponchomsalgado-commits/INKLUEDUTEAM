# Guía de contribución

## Ramas

- `main`: siempre estable. No se hace push directo.(Magaña se encarga de hacer pull request ó merge al final de cada sprint)
- `feat/backend`: trabajo de backend.
- `feat/web`: trabajo de la app web.
- `feat/mobile`: trabajo de la app móvil.

Cada rama se integra a `main` al cierre de su sprint correspondiente, vía Pull Request.

## Commits

Formato sugerido: `"ID tarea:"+"que se trabajo en ese commit"`
Ejemplo de formato de commit: `"T0101: agrege una base de datos en mySQL"`


## Variables de entorno

- Nunca subir `.env` real al repositorio.
- Cualquier variable nueva que agregues debe reflejarse también en `.env.example`, con un valor de ejemplo (no la credencial real).

## Pull Requests

- Descripción corta de qué cambia y por qué.
- Si el cambio afecta a otra rama (por ejemplo, un nuevo endpoint que web o móvil van a consumir), avisar en el canal de equipo antes de mergear.
