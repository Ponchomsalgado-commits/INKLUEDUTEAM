import apiClient from "./apiClient";

// Llamadas al backend para publicar actividades en salones (Sprint 5),
// el tablero de seguimiento y las insignias (Sprint 6). Solo para el profesor dueño del salón.

// POST /assignments -> publica una actividad en un salón o tutoría con fecha límite (ISO 8601).
// Errores: 400 fecha en el pasado ({ message, field }), 409 ya publicada en ese salón, 404 no es tuya.
export async function publicarAsignacion({ activityId, classroomId, dueDate }) {
  const response = await apiClient.post("/assignments", { activityId, classroomId, dueDate });
  return response.data;
}

// DELETE /assignments/:id -> retira la publicación del salón. Respuesta: { id }.
export async function retirarAsignacion(id) {
  const response = await apiClient.delete(`/assignments/${id}`);
  return response.data;
}

// GET /classrooms/:id/assignments -> publicaciones del salón:
// [{ id, dueDate, createdAt, classroom, activity: { id, title, type, skin, totalPreguntas, mediaCount },
//    totalAlumnos, entregados, vencida }]
export async function obtenerAsignacionesSalon(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/assignments`);
  return Array.isArray(response.data) ? response.data : [];
}

// GET /classrooms/:id/progress -> tablero: { classroom, asignaciones: [{ id, activityId, title, dueDate }],
//   alumnos: [{ student, resultados: [{ assignmentId, estado, score, total, submittedAt }] }], generadoEn }
export async function obtenerProgresoSalon(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/progress`);
  return response.data;
}

// GET /classrooms/:id/badges-summary -> [{ student: { id, email }, badges: [{ code, name, icon, streakCount, awardedAt }] }]
export async function obtenerInsigniasSalon(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/badges-summary`);
  return Array.isArray(response.data) ? response.data : [];
}

// GET /classrooms/:id/students/:studentId -> { student, badges, intentos, preguntasFalladas }
export async function obtenerDetalleAlumno(classroomId, studentId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/students/${studentId}`);
  return response.data;
}
