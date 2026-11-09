// Utilidades de fechas para publicar actividades y mostrar entregas.

const dosDigitos = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DDTHH:mm" en hora local, el formato que usa <input type="datetime-local">
export function aValorLocal(fecha) {
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  );
}

// Valor sugerido para la fecha límite: mañana a las 23:59
export function fechaLimiteSugerida() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(23, 59, 0, 0);
  return aValorLocal(manana);
}

// "12 nov 2026, 23:59"
export function formatearFechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

// "12 nov 2026"
export function formatearFechaCorta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-MX", { dateStyle: "medium" });
}
