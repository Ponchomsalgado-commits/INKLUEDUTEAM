#!/usr/bin/env bash
# Prueba de humo de la API: recorre los flujos de los Sprints 1 a 4 contra un backend en marcha.
# Uso (Git Bash en Windows, o cualquier shell con curl):
#   ./scripts/smoke-test.sh                          # desarrollo: http://localhost:3000
#   ./scripts/smoke-test.sh http://mi-servidor       # servidor (a través de Nginx)
# Crea usuarios de prueba con correos únicos (smoke-...@test.local).
# La parte de material (subida a MinIO) necesita que el contenedor minio esté arriba.

BASE="${1:-http://localhost:3000}/api/v1"
STAMP=$(date +%s)
PASSWORD="Prueba123"
FALLOS=0
CUERPO=$(mktemp)
ARCHIVO_TXT=$(mktemp --suffix=.txt)
ARCHIVO_EXE=$(mktemp --suffix=.exe)
trap 'rm -f "$CUERPO" "$ARCHIVO_TXT" "$ARCHIVO_EXE"' EXIT

# peticion METODO RUTA [JSON] [TOKEN] -> imprime "codigo|cuerpo"
peticion() {
  local auth=()
  [ -n "$4" ] && auth=(-H "Authorization: Bearer $4")
  curl -s -o "$CUERPO" -w "%{http_code}" -X "$1" "${auth[@]}" \
    -H "Content-Type: application/json" ${3:+-d "$3"} "$BASE$2"
  printf '|%s' "$(cat "$CUERPO")"
}

# verificar DESCRIPCION CODIGO_ESPERADO RESPUESTA
verificar() {
  local codigo="${3%%|*}"
  if [ "$codigo" = "$2" ]; then
    echo "  OK    $1 ($codigo)"
  else
    echo "  FALLA $1: esperaba $2, llegó $codigo -> ${3#*|}"
    FALLOS=$((FALLOS + 1))
  fi
}

# Ruta que entiende curl en Windows: el curl de Git Bash no lee /tmp dentro de -F
ruta_nativa() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }

# subir RUTA_LOCAL MIME TOKEN -> imprime "codigo|cuerpo" (multipart, como el navegador)
subir() {
  curl -s -o "$CUERPO" -w "%{http_code}" -X POST -H "Authorization: Bearer $3" \
    -F "file=@$(ruta_nativa "$1");type=$2" "$BASE/media/upload"
  printf '|%s' "$(cat "$CUERPO")"
}

# Devuelve el primer valor de un campo de texto de la respuesta
campo() { echo "${1#*|}" | grep -o "\"$2\":\"[^\"]*" | head -1 | cut -d'"' -f4; }

echo "Probando $BASE"

r=$(peticion GET /health)
verificar "health" 200 "$r"
echo "${r#*|}" | grep -q '"database":"connected"' || { echo "  FALLA base de datos desconectada"; FALLOS=$((FALLOS + 1)); }

r=$(peticion POST /auth/registro "{\"email\":\"smoke-prof-$STAMP@test.local\",\"password\":\"$PASSWORD\",\"role\":\"PROFESOR\"}")
verificar "registro de profesor" 201 "$r"
PROF=$(campo "$r" access_token)
REFRESH=$(campo "$r" refresh_token)

r=$(peticion POST /auth/registro "{\"email\":\"smoke-alu-$STAMP@test.local\",\"password\":\"$PASSWORD\",\"role\":\"ESTUDIANTE\"}")
verificar "registro de estudiante" 201 "$r"
ALU=$(campo "$r" access_token)

verificar "contraseña corta rechazada" 400 "$(peticion POST /auth/registro "{\"email\":\"x$STAMP@test.local\",\"password\":\"123\",\"role\":\"ESTUDIANTE\"}")"
verificar "correo repetido rechazado" 409 "$(peticion POST /auth/registro "{\"email\":\"smoke-prof-$STAMP@test.local\",\"password\":\"$PASSWORD\",\"role\":\"PROFESOR\"}")"
verificar "login correcto" 201 "$(peticion POST /auth/login "{\"email\":\"smoke-prof-$STAMP@test.local\",\"password\":\"$PASSWORD\"}")"
verificar "login con contraseña incorrecta" 401 "$(peticion POST /auth/login "{\"email\":\"smoke-prof-$STAMP@test.local\",\"password\":\"mala\"}")"
verificar "perfil con token" 200 "$(peticion GET /auth/perfil "" "$PROF")"
verificar "perfil sin token" 401 "$(peticion GET /auth/perfil)"
verificar "refresh válido" 201 "$(peticion POST /auth/refrescar "{\"refresh_token\":\"$REFRESH\"}")"
verificar "refresh inválido" 401 "$(peticion POST /auth/refrescar '{"refresh_token":"invalido"}')"

r=$(peticion POST /classrooms '{"name":"Salón de prueba","type":"GRUPO"}' "$PROF")
verificar "profesor crea salón" 201 "$r"
CODIGO=$(campo "$r" joinCode)
SALON=$(campo "$r" id)

verificar "estudiante no puede crear salón" 403 "$(peticion POST /classrooms '{"name":"X","type":"GRUPO"}' "$ALU")"
verificar "tipo de salón inválido" 400 "$(peticion POST /classrooms '{"name":"X","type":"GROUP"}' "$PROF")"
verificar "estudiante se une con el código" 201 "$(peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALU")"
verificar "unirse dos veces rechazado" 409 "$(peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALU")"
verificar "código inexistente" 404 "$(peticion POST /classrooms/join '{"joinCode":"ZZZZZZ"}' "$ALU")"

# --- Sprint 2: listados de salones ---
verificar "profesor lista sus salones" 200 "$(peticion GET /classrooms/mine "" "$PROF")"
verificar "estudiante lista los salones a los que se unió" 200 "$(peticion GET /classrooms/mine "" "$ALU")"
verificar "profesor ve los miembros de su salón" 200 "$(peticion GET /classrooms/$SALON/members "" "$PROF")"
verificar "estudiante no ve los miembros" 403 "$(peticion GET /classrooms/$SALON/members "" "$ALU")"

# --- Sprint 3: plantillas, actividades y material ---
r=$(peticion GET /templates "" "$PROF")
verificar "profesor ve el catálogo de plantillas" 200 "$r"
PLANTILLA=$(campo "$r" id)
verificar "catálogo sin token rechazado" 401 "$(peticion GET /templates)"
verificar "estudiante no ve el catálogo" 403 "$(peticion GET /templates "" "$ALU")"

CONTENIDO='{"preguntas":[{"pregunta":"¿2 + 2?","opciones":[{"texto":"3","correcta":false},{"texto":"4","correcta":true},{"texto":"5","correcta":false}]}]}'
CONTENIDO_DOS_CORRECTAS='{"preguntas":[{"pregunta":"¿2 + 2?","opciones":[{"texto":"4","correcta":true},{"texto":"4 también","correcta":true},{"texto":"5","correcta":false}]}]}'

r=$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"Sumas $STAMP\",\"contentJson\":$CONTENIDO,\"mediaUrls\":[]}" "$PROF")
verificar "profesor crea actividad desde plantilla" 201 "$r"
ACT=$(campo "$r" id)
echo "${r#*|}" | grep -q '"contentVersion":1' || { echo "  FALLA content_version inicial distinto de 1"; FALLOS=$((FALLOS + 1)); }

verificar "pregunta con dos correctas rechazada" 400 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"X\",\"contentJson\":$CONTENIDO_DOS_CORRECTAS,\"mediaUrls\":[]}" "$PROF")"
verificar "campo no permitido (type) rechazado" 400 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"X\",\"contentJson\":{\"type\":\"x\",\"preguntas\":[]},\"mediaUrls\":[]}" "$PROF")"
CONTENIDO_UNA_OPCION='{"preguntas":[{"pregunta":"¿2 + 2?","opciones":[{"texto":"4","correcta":true}]}]}'
CONTENIDO_DOS_OPCIONES='{"preguntas":[{"pregunta":"¿2 + 2?","opciones":[{"texto":"4","correcta":true},{"texto":"5","correcta":false}]}]}'
verificar "pregunta con una sola opción rechazada" 400 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"X\",\"contentJson\":$CONTENIDO_UNA_OPCION,\"mediaUrls\":[]}" "$PROF")"
verificar "pregunta con 2 opciones aceptada" 201 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"Dos opciones\",\"contentJson\":$CONTENIDO_DOS_OPCIONES,\"mediaUrls\":[]}" "$PROF")"
verificar "plantilla inexistente" 404 "$(peticion POST /activities "{\"templateId\":\"00000000-0000-4000-8000-000000000000\",\"title\":\"X\",\"contentJson\":$CONTENIDO,\"mediaUrls\":[]}" "$PROF")"
verificar "estudiante no crea actividades" 403 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"X\",\"contentJson\":$CONTENIDO,\"mediaUrls\":[]}" "$ALU")"

verificar "mis actividades (lista)" 200 "$(peticion GET /activities "" "$PROF")"
verificar "detalle de mi actividad" 200 "$(peticion GET /activities/$ACT "" "$PROF")"
verificar "editar el título" 200 "$(peticion PATCH /activities/$ACT '{"title":"Sumas editadas"}' "$PROF")"

r=$(peticion POST /auth/registro "{\"email\":\"smoke-prof2-$STAMP@test.local\",\"password\":\"$PASSWORD\",\"role\":\"PROFESOR\"}")
PROF2=$(campo "$r" access_token)
verificar "otro profesor no ve mi actividad" 404 "$(peticion GET /activities/$ACT "" "$PROF2")"
verificar "otro profesor no ve los miembros de mi salón" 404 "$(peticion GET /classrooms/$SALON/members "" "$PROF2")"

echo "smoke $STAMP" > "$ARCHIVO_TXT"
echo "ejecutable" > "$ARCHIVO_EXE"
r=$(subir "$ARCHIVO_TXT" text/plain "$PROF")
verificar "subida de material (TXT)" 201 "$r"
CLAVE=$(campo "$r" key)
echo "${r#*|}" | grep -q 'X-Amz-Signature' || { echo "  FALLA el material no devuelve URL firmada"; FALLOS=$((FALLOS + 1)); }
verificar "tipo no permitido (.exe) rechazado" 415 "$(subir "$ARCHIVO_EXE" application/octet-stream "$PROF")"

verificar "actividad con material propio" 201 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"Con material\",\"contentJson\":$CONTENIDO,\"mediaUrls\":[\"$CLAVE\"]}" "$PROF")"
verificar "material de otro profesor rechazado" 400 "$(peticion POST /activities "{\"templateId\":\"$PLANTILLA\",\"title\":\"Ajena\",\"contentJson\":$CONTENIDO,\"mediaUrls\":[\"media/otro-profe/archivo.txt\"]}" "$PROF")"

# Sprint 4: jugar la actividad y enviar el intento
r=$(peticion GET /activities/$ACT/play "" "$ALU")
verificar "estudiante obtiene la actividad para jugar" 200 "$r"
echo "${r#*|}" | grep -q '"correcta"' && { echo "  FALLA /play expone la respuesta correcta"; FALLOS=$((FALLOS + 1)); }
PREGUNTA=$(campo "$r" id)
verificar "profesor no usa /play" 403 "$(peticion GET /activities/$ACT/play "" "$PROF")"

INTENTO="00000000-0000-4000-8000-$(printf '%012d' "$STAMP")"
ENVIO="{\"activityId\":\"$ACT\",\"respuestas\":[{\"preguntaId\":\"$PREGUNTA\",\"opcionId\":1}],\"attemptId\":\"$INTENTO\"}"
r=$(peticion POST /progress "$ENVIO" "$ALU")
verificar "estudiante envía su intento" 201 "$r"
echo "${r#*|}" | grep -q '"score":1' || { echo "  FALLA el score del intento no es 1"; FALLOS=$((FALLOS + 1)); }
PROGRESO=$(campo "$r" id)
r=$(peticion POST /progress "$ENVIO" "$ALU")
verificar "reintento con el mismo attemptId" 201 "$r"
[ "$(campo "$r" id)" = "$PROGRESO" ] || { echo "  FALLA el reintento duplicó el intento"; FALLOS=$((FALLOS + 1)); }
verificar "opción inexistente rechazada" 400 "$(peticion POST /progress "{\"activityId\":\"$ACT\",\"respuestas\":[{\"preguntaId\":\"$PREGUNTA\",\"opcionId\":9}]}" "$ALU")"
verificar "profesor no envía intentos" 403 "$(peticion POST /progress "$ENVIO" "$PROF")"

echo
if [ "$FALLOS" -eq 0 ]; then
  echo "Todo correcto."
else
  echo "$FALLOS prueba(s) fallaron."
  exit 1
fi
