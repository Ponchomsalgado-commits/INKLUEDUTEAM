# Guía de contribución

## Ramas

- `main`: siempre estable. No se hace push directo.
- `feature/backend-<descripcion>`: trabajo de backend (ej. `feature/backend-auth`).
- `feature/web-<descripcion>`: trabajo de la app web.
- `feature/mobile-<descripcion>`: trabajo de la app móvil.

Cada rama se integra a `main` al cierre de su sprint correspondiente, vía Pull Request.

## Commits

Formato sugerido: `tipo: descripción corta`

Tipos comunes: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

Ejemplos:
- `feat: endpoint de health check`
- `fix: corrige validación de password_hash`
- `docs: actualiza .env.example con variables de MinIO`

## Variables de entorno

- Nunca subir `.env` real al repositorio.
- Cualquier variable nueva que agregues debe reflejarse también en `.env.example`, con un valor de ejemplo (no la credencial real).

## Pull Requests

- Descripción corta de qué cambia y por qué.
- Si el cambio afecta a otra rama (por ejemplo, un nuevo endpoint que web o móvil van a consumir), avisar en el canal de equipo antes de mergear.
