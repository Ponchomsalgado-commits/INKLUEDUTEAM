import apiClient from "./apiClient";

// llamadas al backend para el catálogo de plantillas y actividades de minijuego (game_templates)

// Plantillas fijas mientras el backend no tenga la ruta. Misma mecánica (type) pero distinto skin (tema visual). Cada plantilla tiene un esquema de preguntas y opciones.
// GET /templates: { id, type, skin, display_name, schema_json }.
// con minItems/maxItems, y cada pregunta tiene su texto y sus opciones (una correcta).
// Rana y Mariposa comparten type (misma mecánica) y solo cambia el skin (tema visual).
//Estrucra de datos de json de la plantilla no officiales, solo temporales
const SCHEMA_SELECCIONAR_OBJETIVO = {
  fields: {
    preguntas: {
      type: "array",
      label: "De 1 a 10 preguntas con 3 opciones",
      minItems: 1,
      maxItems: 10,
      items: {
        pregunta: { type: "string", maxLength: 140, required: true },
        opciones: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { texto: { type: "string", maxLength: 40 }, correcta: { type: "boolean" } },
          constraint: "exactamente_una_correcta",
        },
      },
    },
  },
};

export const PLANTILLAS_PROVISIONALES = [
  {
    id: "rana",
    type: "seleccionar_objetivo",
    skin: "rana_nenufar",
    display_name: "Rana y sus nenúfares",
    schema_json: SCHEMA_SELECCIONAR_OBJETIVO,
  },
  {
    id: "mariposa",
    type: "seleccionar_objetivo",
    skin: "mariposa_flor",
    display_name: "Mariposa y sus flores",
    schema_json: SCHEMA_SELECCIONAR_OBJETIVO,
  },
];

// GET /templates -> lista las plantillas de minijuego disponibles.
// Pendiente en backend: hoy no existe esta ruta, así que si la petición falla
// se usan las plantillas provisionales.(claude)
export async function obtenerPlantillas() {
  try {
    const response = await apiClient.get("/templates");
    return Array.isArray(response.data) ? response.data : PLANTILLAS_PROVISIONALES;
  } catch {
    return PLANTILLAS_PROVISIONALES;
  }
}
// POST /activities -> crea una actividad propia a partir de una plantilla.
// La plantilla original nunca se modifica: el backend guarda una copia en "mis actividades".
// content_json: { type, skin, preguntas: [{ id, pregunta, opciones: [{ texto, correcta }] }] }
// media_urls: referencias devueltas por POST /media/upload (ver mediaService.js)
// Pendiente en backend: hoy no existe esta ruta, así que responde 404 hasta que se implemente.
export async function crearActividad({ templateId, title, content, mediaUrls = [] }) {
  const response = await apiClient.post("/activities", {
    template_id: templateId,
    title,
    content_json: content,
    media_urls: mediaUrls,
  });
  return response.data;
}

// GET /activities/mine -> actividades propias del UsuarioP ("mis actividades").
// Misma convención que /classrooms/mine.
// Respuesta: array de { id, template_id, title, content_json, media_urls, created_at }.
// Pendiente en backend: hoy no existe esta ruta, así que responde 404 hasta que se implemente.
export async function obtenerMisActividades() {
  const response = await apiClient.get("/activities/mine");
  return response.data;
}

// GET /activities/:id -> una actividad propia completa (con las respuestas correctas) para editarla.
export async function obtenerActividad(id) {
  const response = await apiClient.get(`/activities/${id}`);
  return response.data;
}

// PATCH /activities/:id -> edita una actividad propia; la plantilla original nunca se toca.
export async function editarActividad(id, { title, content, mediaUrls = [] }) {
  const response = await apiClient.patch(`/activities/${id}`, {
    title,
    content_json: content,
    media_urls: mediaUrls,
  });
  return response.data;
}

// POST /assignments -> publica una actividad en un salón o tutoría con fecha límite.
//Endpoint del sprint 4
export async function publicarActividad({ activityId, classroomId, dueDate }) {
  const response = await apiClient.post("/assignments/me", {
    activity_id: activityId,
    classroom_id: classroomId,
    due_date: dueDate,
  });
  return response.data;
}

