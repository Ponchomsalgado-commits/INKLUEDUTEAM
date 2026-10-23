# InkluEdu — Plataforma educativa de apoyo a alumnos con TDAH

Monorepo con tres aplicaciones que comparten un solo backend:

| Carpeta    | Qué es                                   | Usuario                 | Tecnología                     |
| ---------- | ---------------------------------------- | ----------------------- | ------------------------------ |
| `backend/` | API REST `/api/v1`                       | —                       | NestJS 12 + Prisma + PostgreSQL |
| `web/`     | Aplicación web                           | usuarioP (profesor)     | React 19 + Vite                |
| `mobile/`  | Aplicación móvil                         | usuarioA (estudiante)   | Flutter                        |

El documento técnico completo (cómo funciona, por qué se decidió cada cosa y el plan de sprints) está en [`docs/`](docs/README.md).

## Estado actual: Sprint 1 cerrado

| Sprint | Alcance                                        | Estado                                                     |
| ------ | ---------------------------------------------- | ---------------------------------------------------------- |
| 0      | Repo, Docker, health check                     | ✅ Hecho                                                   |
| 1      | Registro, login, roles, refresh de tokens      | ✅ Hecho en backend, web y móvil                           |
| 2      | Salones y códigos únicos                       | 🟡 Backend: crear salón y unirse. Pantallas en sus ramas   |
| 3–9    | Plantillas, minijuegos, asignaciones, badges…  | ⏳ Pendiente (carpetas vacías en `backend/src` reservadas) |

**Qué funciona hoy, de extremo a extremo:**

- Un profesor se registra e inicia sesión en la **web**; la web rechaza cuentas de estudiante.
- Un estudiante se registra e inicia sesión en la **app móvil**; la app rechaza cuentas de profesor y recuerda la sesión al reabrirla.
- En los dos clientes, cuando el access token caduca se renueva solo con el refresh token, sin pedir login.
- La API protege rutas por token y por rol (`401` sin token, `403` con el rol equivocado).
- Un profesor crea un salón (`GRUPO`, código de 6 caracteres) o tutoría (`INDIVIDUAL`, 5 caracteres) y un estudiante se une con el código.

## Estructura

```
.
├── backend/
│   ├── prisma/              # schema.prisma + migraciones (se aplican solas al arrancar)
│   ├── src/
│   │   ├── auth/            # registro, login, refresh, guards de JWT y de rol
│   │   ├── users/           # acceso a la tabla users
│   │   ├── classrooms/      # salones/tutorías y códigos de acceso
│   │   ├── prisma/          # PrismaService (conexión a la base)
│   │   └── templates/ activities/ assignments/ progress/ badges/   # reservadas, sprints 3–6
│   └── Dockerfile           # etapas: development (hot reload) y production
├── web/
│   ├── src/
│   │   ├── auth/            # authService (login/registro) y tokenStore (dónde viven los tokens)
│   │   ├── services/        # apiClient: axios + renovación automática del token
│   │   └── Pages/           # Login, Register
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
| Unitarias del backend        | `cd backend && npm test`                  |
| Prueba de humo de la API     | `./scripts/smoke-test.sh` (con la API en marcha; en Windows usa Git Bash) |
| Lint y build de la web       | `cd web && npm run lint && npm run build` |
| Análisis estático del móvil  | `cd mobile && flutter analyze`            |
| Manual (Bruno)               | Abre `docs/bruno-collection` en [Bruno](https://www.usebruno.com/) |

Antes de abrir un Pull Request, corre al menos las unitarias y la prueba de humo.

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

Reglas: `role` es `PROFESOR` o `ESTUDIANTE`; la contraseña lleva mínimo 8 caracteres; los códigos de salón no usan caracteres ambiguos (0/O, 1/I/L) y no distinguen mayúsculas.

> Nota: el documento técnico usa `/auth/register` y `/auth/refresh`; la API implementada usa `/auth/registro` y `/auth/refrescar`. La tabla de arriba es la fuente de verdad.

## Pendientes conocidos (decisiones para los próximos sprints)

- **Registro de profesores abierto:** la API acepta `role: "PROFESOR"` de cualquier cliente. Falta decidir cómo se dan de alta los profesores (código de invitación, alta por administrador…).
- **Sesión web al recargar:** el access token vive en memoria y se pierde al recargar; falta usar el refresh token guardado para restaurar la sesión, y redirigir después del login.
- **Endpoints de listado de salones:** `GET /classrooms` (profesor) y `GET /classrooms/mine` (estudiante). Acordar la forma de la respuesta antes de hacer las pantallas.
- **Tutoría individual:** todavía no se limita a un solo estudiante (regla del Sprint 7).
- **Formato único de errores** (documento técnico, sección 3.12): aún no implementado.
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
