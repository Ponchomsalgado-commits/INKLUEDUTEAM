# Plataforma educativa de apoyo a UsuarioAs con TDAH

Monorepo del proyecto: aplicación web (UsuarioP), aplicación móvil (UsuarioA) y backend compartido.

## Estructura

```
proyecto-tdah/
├── backend/          # NestJS + PostgreSQL + integración MinIO
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── templates/
│   │   ├── activities/
│   │   ├── classrooms/
│   │   ├── assignments/
│   │   ├── progress/
│   │   └── badges/
│   └── test/
├── web/              # React (Vite)
│   └── src/
├── mobile/           # Flutter
│   ├── lib/
│   └── assets/minigames/   # una carpeta por skin
├── docker-compose.yml
├── .env.example
└── docs/             # documentación técnica del proyecto
```

## Cómo levantar el entorno

1. Copia `.env.example` a `.env` y ajusta si hace falta.
2. `docker compose up` — levanta `api`, `postgres` y `minio`.
3. Backend disponible en `http://localhost:3000`.
4. Consola de MinIO en `http://localhost:9001`.

## Ramas de trabajo

- `main` — rama protegida, integración al cierre de cada sprint.
- `feat/backend` — rama de trabajo del backend.
- `feat/web` — rama de trabajo de la app web.
- `feat/mobile` — rama de trabajo de la app móvil.

## Documentación

La documentación técnica completa (cómo funciona el sistema, por qué se tomó cada decisión, y el plan de sprints) vive en `docs/`.
