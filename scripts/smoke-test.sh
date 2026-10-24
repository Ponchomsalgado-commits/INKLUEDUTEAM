#!/usr/bin/env bash
# Prueba de humo de la API: recorre los flujos del Sprint 1 y 2 contra un backend en marcha.
# Uso (Git Bash en Windows, o cualquier shell con curl):
#   ./scripts/smoke-test.sh                          # desarrollo: http://localhost:3000
#   ./scripts/smoke-test.sh http://mi-servidor       # servidor (a través de Nginx)
# Crea usuarios de prueba con correos únicos (smoke-...@test.local).

BASE="${1:-http://localhost:3000}/api/v1"
STAMP=$(date +%s)
PASSWORD="Prueba123"
FALLOS=0
CUERPO=$(mktemp)
trap 'rm -f "$CUERPO"' EXIT

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

campo() { echo "${1#*|}" | grep -o "\"$2\":\"[^\"]*" | cut -d'"' -f4; }

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

verificar "estudiante no puede crear salón" 403 "$(peticion POST /classrooms '{"name":"X","type":"GRUPO"}' "$ALU")"
verificar "tipo de salón inválido" 400 "$(peticion POST /classrooms '{"name":"X","type":"GROUP"}' "$PROF")"
verificar "estudiante se une con el código" 201 "$(peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALU")"
verificar "unirse dos veces rechazado" 409 "$(peticion POST /classrooms/join "{\"joinCode\":\"$CODIGO\"}" "$ALU")"
verificar "código inexistente" 404 "$(peticion POST /classrooms/join '{"joinCode":"ZZZZZZ"}' "$ALU")"

echo
if [ "$FALLOS" -eq 0 ]; then
  echo "Todo correcto."
else
  echo "$FALLOS prueba(s) fallaron."
  exit 1
fi
