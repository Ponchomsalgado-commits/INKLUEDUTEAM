import apiClient from "./apiClient";

// T2101: llamadas al backend para la pantalla "Mis salones" (UsuarioP / profesor)

// POST /classrooms -> crea un salón. type: "GRUPO" | "INDIVIDUAL"
export async function crearSalon({ name, type }) {
  const response = await apiClient.post("/classrooms", { name, type });
  return response.data;
}

// GET /classrooms -> salones del profesor logueado
// (pendiente en backend, ver nota de T2101)
export async function obtenerMisSalones() {
  const response = await apiClient.get("/classrooms");
  return response.data;
}

// GET /classrooms/:id/members -> usuarios unidos al salón
// (pendiente en backend, ver nota de T2101)
export async function obtenerMiembros(classroomId) {
  const response = await apiClient.get(`/classrooms/${classroomId}/members`);
  return response.data;
}
