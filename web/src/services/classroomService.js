import apiClient from "./apiClient";

//llamadas al backend para la pantalla "Mis salones" (UsuarioP / profesor)

// POST /classrooms -> crea un salón. type: "GRUPO" | "INDIVIDUAL"
export async function crearSalon({ name, type }) {
  const response = await apiClient.post("/classrooms", { name, type });
  return response.data;
}

// GET /classrooms/mine -> salones del profesor logueado (grupos e individuales mezclados).
// Respuesta: array de { id, name, type: "GRUPO" | "INDIVIDUAL", joinCode, ... }.
// Los individuales se filtran en el cliente (ver Tutorias.jsx).
export async function obtenerMisSalones() {
  const response = await apiClient.get("/classrooms/mine");
  return response.data;
}

// GET /classrooms/:id -> detalle del salón: { id, name, type, joinCode, teacher, memberCount, assignmentCount }.
export async function obtenerSalon(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}`);
  return response.data;
}

// GET /classrooms/:id/members -> alumnos unidos al salón (solo el profesor dueño).
// Respuesta: array de { joinedAt, student: { id, email, role, createdAt } }.
export async function obtenerMiembros(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/members`);
  return response.data;
}
