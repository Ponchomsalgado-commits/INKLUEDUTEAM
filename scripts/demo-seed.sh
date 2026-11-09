#!/usr/bin/env bash
# Datos de demostración (expocarrera): un profesor, dos alumnos, un salón, una tutoría,
# actividades con material y asignaciones con distintos estados.
# Uso: bash scripts/demo-seed.sh [http://localhost:3000]
# Se puede correr varias veces: reutiliza las cuentas y agrega actividades nuevas.
#
# Cuentas (contraseña Demo1234):
#   profe.demo@inkluedu.mx   -> web  (http://localhost:5173)
#   alumna.demo@inkluedu.mx  -> móvil (miembro del salón y de la tutoría)
#   alumno.demo@inkluedu.mx  -> móvil (miembro del salón)

BASE="${1:-http://localhost:3000}/api/v1"
PASSWORD="Demo1234"
CUERPO=$(mktemp)
PETICION_TMP=$(mktemp)
LECTURA=$(mktemp --suffix=.txt)
trap 'rm -f "$CUERPO" "$PETICION_TMP" "$LECTURA"' EXIT

peticion() {
  local auth=()
  [ -n "$4" ] && auth=(-H "Authorization: Bearer $4")
  # El cuerpo va por archivo: en Windows, curl recodifica los argumentos -d y rompe los acentos
  local datos=()
  if [ -n "$3" ]; then printf '%s' "$3" > "$PETICION_TMP"; datos=(--data-binary "@$(ruta_nativa "$PETICION_TMP")"); fi
  curl -s -o "$CUERPO" -w "%{http_code}" -X "$1" "${auth[@]}" \
    -H "Content-Type: application/json; charset=utf-8" "${datos[@]}" "$BASE$2"
  printf '|%s' "$(cat "$CUERPO")"
}
campo() { echo "${1#*|}" | grep -o "\"$2\":\"[^\"]*" | head -1 | cut -d'"' -f4; }
ruta_nativa() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }
fecha() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v"$2" +%Y-%m-%dT%H:%M:%SZ; }

# cuenta EMAIL ROL -> access_token (registra o inicia sesión)
cuenta() {
  local r
  r=$(peticion POST /auth/registro "{\"email\":\"$1\",\"password\":\"$PASSWORD\",\"role\":\"$2\"}")
  [ "${r%%|*}" = "201" ] || r=$(peticion POST /auth/login "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}")
  campo "$r" access_token
}

PROF=$(cuenta profe.demo@inkluedu.mx PROFESOR)
ALUMNA=$(cuenta alumna.demo@inkluedu.mx ESTUDIANTE)
ALUMNO=$(cuenta alumno.demo@inkluedu.mx ESTUDIANTE)
[ -n "$PROF" ] && [ -n "$ALUMNA" ] && [ -n "$ALUMNO" ] || { echo "No se pudo entrar con las cuentas demo"; exit 1; }

SALON_R=$(peticion POST /classrooms '{"name":"3°A Ciencias (demo)","type":"GRUPO"}' "$PROF")
SALON=$(campo "$SALON_R" id); CODIGO=$(campo "$SALON_R" joinCode)
TUTO_R=$(peticion POST /classrooms '{"name":"Tutoría de lectura (demo)","type":"INDIVIDUAL"}' "$PROF")
TUTO=$(campo "$TUTO_R" id); CODIGO_TUTO=$(campo "$TUTO_R" joinCode)
peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALUMNA" >/dev/null
peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALUMNO" >/dev/null
peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO_TUTO\"}" "$ALUMNA" >/dev/null

PLANTILLAS=$(peticion GET /templates "" "$PROF")
PLANTILLA_1=$(echo "${PLANTILLAS#*|}" | grep -o '"id":"[^"]*' | sed -n 1p | cut -d'"' -f4)
PLANTILLA_2=$(echo "${PLANTILLAS#*|}" | grep -o '"id":"[^"]*' | sed -n 2p | cut -d'"' -f4)
[ -n "$PLANTILLA_2" ] || PLANTILLA_2=$PLANTILLA_1

cat > "$LECTURA" <<'TXT'
El ciclo del agua

El agua de mares, ríos y lagos se calienta con el Sol y se evapora: sube al cielo como vapor.
Arriba hace frío, así que el vapor se condensa y forma nubes.
Cuando las gotas de las nubes pesan mucho, caen como lluvia, granizo o nieve: eso es la precipitación.
El agua vuelve a ríos, lagos y mares, o se filtra bajo la tierra, y el ciclo empieza otra vez.
TXT
MATERIAL=$(curl -s -X POST -H "Authorization: Bearer $PROF" \
  -F "file=@$(ruta_nativa "$LECTURA");type=text/plain;filename=ciclo-del-agua.txt" "$BASE/media/upload")
CLAVE=$(echo "$MATERIAL" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
MEDIA="[]"; [ -n "$CLAVE" ] && MEDIA="[\"$CLAVE\"]"

AGUA='{"preguntas":[
 {"pregunta":"¿Qué hace el Sol con el agua de los mares?","opciones":[{"texto":"La congela","correcta":false},{"texto":"La evapora","correcta":true},{"texto":"La vuelve sal","correcta":false}]},
 {"pregunta":"¿Cómo se llama cuando el vapor forma nubes?","opciones":[{"texto":"Condensación","correcta":true},{"texto":"Evaporación","correcta":false},{"texto":"Filtración","correcta":false},{"texto":"Fusión","correcta":false}]},
 {"pregunta":"La lluvia, el granizo y la nieve son…","opciones":[{"texto":"Precipitación","correcta":true},{"texto":"Vapor","correcta":false}]}]}'
SUMAS='{"preguntas":[
 {"pregunta":"¿Cuánto es 7 + 5?","opciones":[{"texto":"11","correcta":false},{"texto":"12","correcta":true},{"texto":"13","correcta":false}]},
 {"pregunta":"¿Cuánto es 9 + 8?","opciones":[{"texto":"17","correcta":true},{"texto":"16","correcta":false},{"texto":"18","correcta":false}]}]}'
ANIMALES='{"preguntas":[
 {"pregunta":"¿Qué animal es un anfibio?","opciones":[{"texto":"Rana","correcta":true},{"texto":"Gato","correcta":false},{"texto":"Águila","correcta":false}]},
 {"pregunta":"¿Qué come una mariposa?","opciones":[{"texto":"Néctar de flores","correcta":true},{"texto":"Semillas","correcta":false},{"texto":"Insectos","correcta":false}]}]}'

actividad() { # PLANTILLA TITULO CONTENIDO MEDIA
  campo "$(peticion POST /activities "{\"templateId\":\"$1\",\"title\":\"$2\",\"contentJson\":$(echo "$3" | tr -d '\n'),\"mediaUrls\":$4}" "$PROF")" id
}
publicar() { # ACTIVIDAD SALON FECHA
  peticion POST /assignments "{\"activityId\":\"$1\",\"classroomId\":\"$2\",\"dueDate\":\"$3\"}" "$PROF" >/dev/null
}

A_AGUA=$(actividad "$PLANTILLA_1" "El ciclo del agua" "$AGUA" "$MEDIA")
A_SUMAS=$(actividad "$PLANTILLA_2" "Sumas rápidas" "$SUMAS" "[]")
A_ANIMALES=$(actividad "$PLANTILLA_1" "Animales y lo que comen" "$ANIMALES" "$MEDIA")

publicar "$A_AGUA" "$SALON" "$(fecha '+3 days' '+3d')"
publicar "$A_SUMAS" "$SALON" "$(fecha '+1 day' '+1d')"
publicar "$A_ANIMALES" "$SALON" "$(fecha '+6 days' '+6d')"
publicar "$A_AGUA" "$TUTO" "$(fecha '+2 days' '+2d')"

# El alumno ya resolvió "Sumas rápidas" (para que el tablero y sus insignias tengan datos)
JUEGO=$(peticion GET /activities/$A_SUMAS/play "" "$ALUMNO")
P1=$(echo "${JUEGO#*|}" | grep -o '"preguntas":\[{"id":"[^"]*' | cut -d'"' -f6)
P2=$(echo "${JUEGO#*|}" | grep -o '"id":"[^"]*' | sed -n 2p | cut -d'"' -f4)
peticion POST /progress "{\"activityId\":\"$A_SUMAS\",\"respuestas\":[{\"preguntaId\":\"$P1\",\"opcionId\":1},{\"preguntaId\":\"$P2\",\"opcionId\":1}]}" "$ALUMNO" >/dev/null

echo "Listo."
echo "  Web (profesor):  profe.demo@inkluedu.mx / $PASSWORD"
echo "  Móvil (alumnos): alumna.demo@inkluedu.mx / $PASSWORD  ·  alumno.demo@inkluedu.mx / $PASSWORD"
echo "  Salón: código $CODIGO  ·  Tutoría: código $CODIGO_TUTO"
