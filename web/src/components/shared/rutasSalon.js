// Enlaces a las pantallas de un salón. "desde" recuerda si se llegó desde Tutorías
// para resaltar esa pestaña del menú y volver al lugar correcto.

export function rutaDetalleSalon(salonId, { desde, vista } = {}) {
  const params = new URLSearchParams({ salon: salonId });
  if (desde) params.set("desde", desde);
  if (vista) params.set("vista", vista);
  return `/salones/detalle?${params}`;
}

export function rutaDetalleAlumno(salonId, alumnoId, { desde } = {}) {
  const params = new URLSearchParams({ salon: salonId, alumno: alumnoId });
  if (desde) params.set("desde", desde);
  return `/salones/alumno?${params}`;
}

export const tipoSalonLegible = (tipo) => (tipo === "INDIVIDUAL" ? "Tutoría individual" : "Salón");
