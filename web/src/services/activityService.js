import apiClient from "./apiClient";

// Llamadas al backend para plantillas y actividades propias (game_templates, teacher_activities).
// El backend responde en camelCase (templateId, contentJson, mediaUrls, displayName, schemaJson).
// Las claves de material (mediaUrls) son las que devuelve POST /media/upload en `key`, no las URLs firmadas.

// GET /templates -> catálogo: { id, type, skin, displayName, schemaJson }. Cada skin es una entrada.
export async function obtenerPlantillas() {
  try {
    const response = await apiClient.get("/templates");
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    // Sin catálogo la pantalla muestra "No hay plantillas aún" en vez de un error
    return [];
  }
}

// POST /activities -> crea una copia propia de la plantilla. La plantilla original nunca se modifica.
// content: { preguntas: [{ id, pregunta, opciones: [{ texto, correcta }] }] } (sin type ni skin: los pone la plantilla)
export async function crearActividad({ templateId, title, content, mediaUrls = [] }) {
  const response = await apiClient.post("/activities", {
    templateId,
    title,
    contentJson: content,
    mediaUrls,
  });
  return response.data;
}

// GET /activities -> "mis actividades" del profesor: resumen { id, title, template, mediaCount, ... }.
export async function obtenerMisActividades() {
  const response = await apiClient.get("/activities");
  return response.data;
}

// GET /activities/:id -> detalle completo: contentJson, mediaUrls y media (con url firmada) para editar o previsualizar.
export async function obtenerActividad(id) {
  const response = await apiClient.get(`/activities/${id}`);
  return response.data;
}

// PATCH /activities/:id -> edita una actividad propia; la plantilla original nunca se toca.
export async function editarActividad(id, { title, content, mediaUrls = [] }) {
  const response = await apiClient.patch(`/activities/${id}`, {
    title,
    contentJson: content,
    mediaUrls,
  });
  return response.data;
}

// POST /assignments -> publica una actividad en un salón o tutoría con fecha límite.
// Pendiente en backend: es del Sprint 5; hasta entonces responde 404 y la pantalla lo muestra como no disponible.
export async function publicarActividad({ activityId, classroomId, dueDate }) {
  const response = await apiClient.post("/assignments", {
    activityId,
    classroomId,
    dueDate,
  });
  return response.data;
}
