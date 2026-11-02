// El mensaje específico depende del rol y la acción; el backend rechaza con 401/403 si no tiene permisos.
export function mensajeDeError(error, porDefecto) {
  // 401: token expirado o inválido (el apiClient ya lo reintentó)
  if (error.response?.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";

  // 403: usuario autenticado pero no tiene el rol o permiso requerido
  if (error.response?.status === 403) return "No tienes permiso para hacer esto.";

  // 404: endpoint no existe aún en backend
  if (error.response?.status === 404) return "Esta función aún no está disponible en el servidor.";

  // 409: conflicto, ej. código de acceso duplicado
  if (error.response?.status === 409) return "Este dato ya existe. Intenta con otro.";

  // Mensaje del backend (si es array, une con comas)
  const msgBackend = error.response?.data?.message;
  if (Array.isArray(msgBackend)) return msgBackend.join(", ");
  if (typeof msgBackend === "string") return msgBackend;
}
