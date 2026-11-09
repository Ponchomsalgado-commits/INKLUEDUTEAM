# InkluEdu — Plataforma educativa de apoyo a alumnos con TDAH

Monorepo con tres aplicaciones que comparten un solo backend:

| Carpeta    | Qué es                                   | Usuario                 | Tecnología                     |
| ---------- | ---------------------------------------- | ----------------------- | ------------------------------ |
| `backend/` | API REST `/api/v1`                       | —                       | NestJS 12 + Prisma + PostgreSQL |
| `web/`     | Aplicación web                           | usuarioP (profesor)     | React 19 + Vite                |
| `mobile/`  | Aplicación móvil                         | usuarioA (estudiante)   | Flutter                        |

El documento técnico completo (cómo funciona, por qué se decidió cada cosa y el plan de sprints) está en [`docs/`](docs/README.md).

## Estado actual: Sprint 3 cerrado (web y backend)

| Sprint | Alcance                                        | Estado                                                     |
| ------ | ---------------------------------------------- | ---------------------------------------------------------- |
| 0      | Repo, Docker, health check                     | ✅ Hecho                                                   |
| 1      | Registro, login, roles, refresh de tokens      | ✅ Hecho en backend, web y móvil                           |
| 2      | Salones y códigos únicos                       | ✅ Backend y web. Móvil: pantallas de su rama              |
| 3      | Plantillas, actividades y material (web)       | ✅ Backend y web. Móvil sin trabajo en este sprint         |
| 4–9    | Minijuegos, asignaciones, badges…              | ⏳ Pendiente (carpetas `backend/src` reservadas)           |

**Qué funciona hoy, de extremo a extremo:**

- Un profesor se registra e inicia sesión en la **web**; la web rechaza cuentas de estudiante.
- Un estudiante se registra e inicia sesión en la **app móvil**; la app rechaza cuentas de profesor y recuerda la sesión al reabrirla.
- En los dos clientes, cuando el access token caduca se renueva solo con el refresh token, sin pedir login.
- La API protege rutas por token y por rol (`401` sin token, `403` con el rol equivocado) y responde errores con un único formato `{ statusCode, error, message, field? }`.
- Un profesor crea un salón (`GRUPO`, código de 6 caracteres) o tutoría (`INDIVIDUAL`, 5 caracteres), ve sus salones y sus miembros, y un estudiante se une con el código.
- Un profesor elige una plantilla del catálogo, edita su copia (preguntas y opciones con una correcta por pregunta), sube material (PDF, TXT, video o audio) y la guarda en **Mis actividades**, donde puede editarla o previsualizarla. La plantilla original nunca se modifica.

**Lo que aún no funciona en la web:** el botón "Guardar y publicar" en un salón. Publicar (`POST /assignments`) es del Sprint 5; hasta entonces la actividad se guarda, pero la publicación muestra "Esta función aún no está disponible en el servidor".

## Estructura

```
.
├── backend/
│   ├── prisma/              # schema.prisma + migraciones (se aplican solas al arrancar)
│   ├── src/
│   │   ├── auth/            # registro, login, refresh, guards de JWT y de rol
│   │   ├── users/           # acceso a la tabla users
│   │   ├── classrooms/      # salones/tutorías, códigos de acceso y miembros
│   │   ├── templates/       # catálogo de plantillas (templates.catalog.ts) sincronizado al arrancar
│   │   ├── activities/      # actividades propias y validación de su contenido contra el schema
│   │   ├── media/           # subida de material a MinIO y URLs firmadas
│   │   ├── common/errors/   # formato único de errores
│   │   ├── prisma/          # PrismaService (conexión a la base)
│   │   ├── progress/        # intentos de los estudiantes y su corrección
│   │   └── assignments/ badges/   # reservadas, sprints 5–6
│   └── Dockerfile           # etapas: development (hot reload) y production
├── web/
│   ├── src/
│   │   ├── auth/            # authService (login/registro) y tokenStore (dónde viven los tokens)
│   │   ├── services/        # apiClient (axios + renovación del token), activityService, mediaService, classroomService
│   │   ├── components/      # editor de plantillas, subida de material, vista previa
│   │   └── Pages/           # Login, Register, Mis salones, Tutorías, Crear actividad, Mis actividades
│   ├── Dockerfile           # build de producción servido por Nginx
│   └── nginx.conf           # sirve la web y reenvía /api al backend
├── mobile/
│   └── lib/
│       ├── api_client.dart  # dio + renovación automática del token
│       ├── core/            # TokenStorage (almacenamiento cifrado)
│       ├── auth/            # AuthService, AuthGate, pantallas de login y registro
│       └── home/            # pantalla principal (provisional)
├── docs/                    # documento técnico, guía de despliegue, colección de Bruno
├── scripts/smoke-test.sh    # prueba de humo de la API
├── docker-compose.yml       # desarrollo
├── docker-compose.prod.yml  # servidor
└── .env.example             # plantilla del ÚNICO .env del proyecto
```

## Cómo levantar el proyecto (desarrollo)

**Requisitos:** Docker Desktop, Node.js 20+, Flutter (solo para móvil).

### 1. Variables de entorno (una sola vez)

Hay **un solo `.env`, en la raíz**. Lo usan Docker, el backend y la web.

```bash
cp .env.example .env
```

### 2. Backend + base de datos

```bash
docker compose up --build
```

- API en `http://localhost:3000/api/v1` (recarga sola al guardar cambios en `backend/src`).
- Las migraciones de Prisma se aplican solas al arrancar.
- Comprobar: `curl http://localhost:3000/api/v1/health` → `{"status":"ok","database":"connected"}`.
- Consola de MinIO: `http://localhost:9002`.

### 3. Web

```bash
cd web
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite reenvía `/api` al backend, así que no hace falta configurar CORS. Si cambias el `.env`, reinicia `npm run dev`.

### 4. Móvil

```bash
cd mobile
flutter pub get
flutter run                                                        # emulador Android (usa 10.0.2.2:3000)
flutter run -d chrome --dart-define=API_URL=http://localhost:3000   # Chrome
flutter run --dart-define=API_URL=http://192.168.X.X:3000           # celular físico (IP de tu PC)
```

Con celular físico: misma red Wi-Fi que la PC y el puerto 3000 permitido en el firewall de Windows. Más detalles en [`mobile/README.md`](mobile/README.md).

## Pruebas

| Qué                          | Comando                                   |
| ---------------------------- | ----------------------------------------- |
| Unitarias del backend (61 pruebas, 8 suites) | `cd backend && npm test`                  |
| Solo una suite (ej. actividades) | `cd backend && npm test -- activities`    |
| Chequeo de tipos del backend | `cd backend && npx tsc --noEmit`          |
| Prueba de humo de la API     | `bash scripts/smoke-test.sh` (con la API en marcha; ver abajo) |
| Lint y build de la web       | `cd web && npm run lint && npm run build` |
| Análisis estático del móvil  | `cd mobile && flutter analyze`            |
| Manual (Bruno)               | Abre `docs/bruno-collection` en [Bruno](https://www.usebruno.com/) |

Antes de abrir un Pull Request, corre al menos las unitarias y la prueba de humo.

**Prueba de humo (Sprints 1–3).** Requiere `docker compose up --build` (API, PostgreSQL y MinIO). Usa Git Bash en Windows.

```bash
bash scripts/smoke-test.sh                      # contra http://localhost:3000
bash scripts/smoke-test.sh http://mi-servidor   # contra un servidor
```

- Usa `bash scripts/...`, no `./scripts/...`: el archivo no tiene permiso de ejecución en git.
- Crea usuarios y datos con correos `smoke-*@test.local`; cada corrida usa datos nuevos, así que se puede repetir sin limpiar la base.
- La sección de material necesita que MinIO esté arriba. Si MinIO no responde, esas pruebas fallan y el resto sigue.
- Termina con `Todo correcto.` o con el número de pruebas fallidas (código de salida 1).

## API actual

Base: `/api/v1`. Las rutas con 🔒 requieren `Authorization: Bearer <access_token>`.

| Método | Ruta                  | Quién           | Qué hace                                                     |
| ------ | --------------------- | --------------- | ------------------------------------------------------------ |
| GET    | `/health`             | —               | Estado de la API y de PostgreSQL                             |
| POST   | `/auth/registro`      | —               | `{ email, password, role }` → `{ access_token, refresh_token }` |
| POST   | `/auth/login`         | —               | `{ email, password }` → `{ access_token, refresh_token }`    |
| POST   | `/auth/refrescar`     | —               | `{ refresh_token }` → par de tokens nuevo                    |
| GET    | `/auth/perfil`        | 🔒 cualquiera   | Contenido del token: `{ sub, email, role }`                  |
| POST   | `/classrooms`         | 🔒 PROFESOR     | `{ name, type: "GRUPO" \| "INDIVIDUAL" }` → salón con `joinCode` |
| POST   | `/classrooms/join`    | 🔒 ESTUDIANTE   | `{ joinCode }` → inscripción                                 |
| GET    | `/classrooms/mine`    | 🔒 cualquiera   | Profesor: sus salones. Estudiante: a los que se unió         |
| GET    | `/classrooms/:id/members` | 🔒 PROFESOR dueño | Alumnos unidos: `[{ joinedAt, student: { id, email, role, createdAt } }]` |
| GET    | `/templates`          | 🔒 PROFESOR     | Catálogo de plantillas: `[{ id, type, skin, displayName, schemaJson }]` |
| GET    | `/templates/:id`      | 🔒 PROFESOR     | Una plantilla con su `schemaJson`                            |
| POST   | `/activities`         | 🔒 PROFESOR     | `{ templateId, title, contentJson, mediaUrls? }` → copia propia |
| GET    | `/activities`         | 🔒 PROFESOR     | Mis actividades (resumen, sin preguntas)                     |
| GET    | `/activities/:id`     | 🔒 PROFESOR dueño | Detalle con `contentJson` y `media` (URLs firmadas)        |
| PATCH  | `/activities/:id`     | 🔒 PROFESOR dueño | Edita `title`, `contentJson` y/o `mediaUrls`; sube `contentVersion` si cambia el contenido |
| GET    | `/activities/:id/play` | 🔒 ESTUDIANTE  | Actividad lista para jugar: preguntas y opciones por índice, **sin** la respuesta correcta |
| POST   | `/progress`           | 🔒 ESTUDIANTE   | `{ activityId, respuestas: [{ preguntaId, opcionId }], attemptId? }` → `{ id, score, total, detalle }`. Repetir el mismo `attemptId` devuelve el intento ya guardado |
| POST   | `/media/upload`      | 🔒 PROFESOR     | Multipart con el campo `file` → `{ key, name, url, size, … }` |
| GET    | `/media/url?key=`     | 🔒 PROFESOR dueño | URL firmada nueva de un archivo propio                     |

Reglas: `role` es `PROFESOR` o `ESTUDIANTE`; la contraseña lleva mínimo 8 caracteres; los códigos de salón no usan caracteres ambiguos (0/O, 1/I/L) y no distinguen mayúsculas.

Reglas de actividades y material:

- El cuerpo de la API usa **camelCase** (`templateId`, `contentJson`, `mediaUrls`). Un campo que no existe en el DTO responde `400`.
- El `contentJson` solo lleva `preguntas`; `type` y `skin` los pone la plantilla. Cada pregunta necesita exactamente una opción `correcta`.
- En `mediaUrls` se envía la **`key`** que devuelve `/media/upload`, nunca la `url` firmada (esa caduca).
- Tipos de archivo permitidos: pdf, txt, png, jpg, webp, mp4, webm, mp3, m4a, ogg, wav. Tamaño máximo por defecto: 50 MB (`MEDIA_MAX_MB`).
- Las URLs firmadas usan `MINIO_PUBLIC_URL`. Si el navegador no abre el material, revisa que apunte a un host que el navegador pueda alcanzar (por ejemplo `http://localhost:9000`).

> Nota: el documento técnico usa `/auth/register` y `/auth/refresh`; la API implementada usa `/auth/registro` y `/auth/refrescar`. La tabla de arriba es la fuente de verdad.

## Pendientes conocidos (decisiones para los próximos sprints)

- **Registro de profesores abierto:** la API acepta `role: "PROFESOR"` de cualquier cliente. Falta decidir cómo se dan de alta los profesores (código de invitación, alta por administrador…).
- **Sesión web al recargar:** el access token vive en memoria y se pierde al recargar; falta usar el refresh token guardado para restaurar la sesión, y redirigir después del login.
- **Publicar actividades (`POST /assignments`):** es del Sprint 5. Hasta entonces, "Guardar y publicar" en la web guarda la actividad pero no la publica.
- **Tutoría individual:** todavía no se limita a un solo estudiante (regla del Sprint 7).
- **Minijuego móvil con datos reales:** la app ya renderiza `seleccionar_objetivo` con skins y envía el intento a `POST /progress` (con guardado local y reenvío al volver la conexión), pero la pantalla todavía usa preguntas de prueba; falta cargarlas desde `GET /activities/:id/play`.
- **Quién puede jugar una actividad:** `/play` y `/progress` aceptan a cualquier estudiante con el ID de la actividad. Al llegar las asignaciones (Sprint 5) hay que limitarlo a los alumnos del salón asignado.
- **HTTPS:** al tenerlo, quitar `usesCleartextTraffic` del AndroidManifest y `NSAllowsLocalNetworking` de iOS.

## Trabajo en equipo

- Ramas y commits: [`COMO_HACER COMMIT.md`](COMO_HACER%20COMMIT.md). Formato de commit: `T0101: qué se hizo`.
- Bitácora: [`COMO_RELLENAR_BITACORA.md`](COMO_RELLENAR_BITACORA.md).
- Formato de código: `npm run format` en `backend/` y `web/` (Prettier, configuración en `.prettierrc`), `dart format lib` en `mobile/`. El estilo base para cualquier editor está en `.editorconfig`.
- Toda variable nueva va también en `.env.example`.

## Desplegar en un servidor

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Guía completa (secretos, dominio, HTTPS, respaldos): [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
