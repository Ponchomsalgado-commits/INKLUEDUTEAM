import apiClient from "./apiClient";

// T2101: llamadas al backend para la pantalla "Mis salones" (UsuarioP / profesor)

// POST /classrooms -> crea un salón. type: "GRUPO" | "INDIVIDUAL"
export async function crearSalon({ name, type }) {
  const response = await apiClient.post("/classrooms", { name, type });
  return response.data;
}

// GET /classrooms/me -> salones del profesor logueado (grupos e individuales mezclados).
// Misma ruta que usa la app móvil (mobile/lib/salones/salones_service.dart).
// Respuesta: array de { id, name, type: "GRUPO" | "INDIVIDUAL", joinCode, ... }.
// Los individuales se filtran en el cliente (ver Tutorias.jsx).
// Pendiente en backend: hoy no existe esta ruta en backend/src/classrooms, así que
// responde 404 hasta que se implemente.
export async function obtenerMisSalones() {
  const response = await apiClient.get("/classrooms/me");
  return response.data;
}

// GET /classrooms/:id/members -> usuarios unidos al salón
// (pendiente en backend, ver nota de T2101)
export async function obtenerMiembros(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/members`);
  return response.data;
}
