# Despliegue en un servidor

`docker-compose.prod.yml` levanta el sistema completo en cualquier servidor con Docker (VPS, máquina de la escuela, Railway/Render con Docker, etc.):

```
Internet ──► web (Nginx, puerto 80)
               ├── /          → aplicación web compilada
               └── /api/...   → api (NestJS compilado) ──► postgres
                                                       └─► minio
```

Solo Nginx queda expuesto. La API, PostgreSQL y MinIO viven en la red interna de Docker.

## 1. Requisitos del servidor

- Docker Engine 24+ con el plugin `docker compose`.
- Puerto 80 abierto (y 443 si se agrega HTTPS).
- ~2 GB de RAM es suficiente para esta etapa.

## 2. Preparar el `.env`

```bash
git clone <url-del-repo> inkluedu && cd inkluedu
cp .env.example .env
```

Edita `.env` y **cambia todo lo que sea credencial**:

| Variable                                   | Qué poner                                                       |
| ------------------------------------------ | --------------------------------------------------------------- |
| `NODE_ENV`                                 | `production`                                                    |
| `DB_PASSWORD`                              | contraseña larga; repítela dentro de `DATABASE_URL`             |
| `DATABASE_URL`                             | `postgresql://<DB_USER>:<DB_PASSWORD>@postgres:5432/<DB_NAME>`  |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`  | dos valores distintos, largos y aleatorios (ver abajo)          |
| `MINIO_ROOT_PASSWORD`                      | contraseña larga                                                |
| `CORS_ORIGINS`                             | dominio(s) de la web, p. ej. `https://inkluedu.mx`             |
| `WEB_PORT`                                 | `80` (o el puerto que se vaya a publicar)                       |

Generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# o, sin Node:
openssl rand -hex 48
```

> Si la contraseña de la base lleva caracteres especiales (`@`, `:`, `/`…), codifícalos en `DATABASE_URL` (por ejemplo `@` → `%40`).

## 3. Levantar

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # api y postgres deben verse "healthy"
```

Al arrancar, la API aplica sola las migraciones pendientes (`prisma migrate deploy`).

## 4. Verificar

```bash
./scripts/smoke-test.sh http://<ip-o-dominio-del-servidor>
```

Debe terminar con `Todo correcto.` La prueba crea usuarios con correos `smoke-...@test.local`.

## 5. Conectar la app móvil

La app no lee el `.env`; la URL se fija al compilar:

```bash
cd mobile
flutter build apk --dart-define=API_URL=http://<ip-o-dominio-del-servidor>
```

Sin `:3000`: en servidor la API se alcanza a través de Nginx en el puerto 80.

## Actualizar a una versión nueva

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Los datos viven en los volúmenes `pg_data` y `minio_data` y sobreviven a la reconstrucción. **Nunca uses `down -v` en producción: borra la base de datos.**

## Respaldo de la base de datos

```bash
# Respaldar
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U <DB_USER> <DB_NAME> > respaldo_$(date +%F).sql
# Restaurar
docker compose -f docker-compose.prod.yml exec -T postgres psql -U <DB_USER> <DB_NAME> < respaldo_AAAA-MM-DD.sql
```

## Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

## HTTPS (recomendado antes de usarlo con alumnos reales)

La configuración actual sirve HTTP. Para HTTPS, lo más simple es poner delante un proxy con certificados automáticos (Caddy, Traefik o el balanceador del proveedor) que reenvíe al puerto de `web`. Después:

1. Pon el dominio con `https://` en `CORS_ORIGINS`.
2. Compila la app móvil con `--dart-define=API_URL=https://<dominio>`.
3. Quita `android:usesCleartextTraffic="true"` de `mobile/android/app/src/main/AndroidManifest.xml` y `NSAllowsLocalNetworking` de `mobile/ios/Runner/Info.plist`.

## Probar el modo producción en tu PC

Para no chocar con los contenedores de desarrollo, usa otro nombre de proyecto y otro puerto:

```bash
WEB_PORT=8080 docker compose -p inkluedu-prod-test -f docker-compose.prod.yml up -d --build
./scripts/smoke-test.sh http://localhost:8080
docker compose -p inkluedu-prod-test -f docker-compose.prod.yml down -v   # -v aquí sí: son datos de prueba
```
