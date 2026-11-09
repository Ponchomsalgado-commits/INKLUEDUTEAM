export type EstadoAsignacion = 'completado' | 'pendiente' | 'atrasado';

/**
 * Estado de una asignación para un estudiante (Sprint 5, figura 3.8):
 * entregada → completado; sin entregar y vencida → atrasado; si no → pendiente.
 */
export function estadoDe(
  dueDate: Date,
  entregadaEn: Date | null | undefined,
  ahora = new Date(),
): EstadoAsignacion {
  if (entregadaEn) return 'completado';
  return dueDate.getTime() < ahora.getTime() ? 'atrasado' : 'pendiente';
}
