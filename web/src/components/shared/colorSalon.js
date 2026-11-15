export const COLORES_GRUPO = ["#1b7f8c", "#6a4fb0", "#2f7d3a", "#b5651d", "#a0345a"];

// Mismo color que la tarjeta de Grupos: depende de la posición del salón entre los grupos
export function colorDeSalon(salones, id) {
  const grupos = salones.filter((s) => s.type === "GRUPO");
  const posicion = Math.max(
    0,
    grupos.findIndex((s) => s.id === id),
  );
  return COLORES_GRUPO[posicion % COLORES_GRUPO.length];
}
