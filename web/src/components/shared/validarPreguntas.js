// Valida que cada pregunta tenga texto, todas las opciones con texto, y exactamente una correcta.
// Devuelve "" si está bien, o un mensaje de error si algo falta.
export function validarPreguntas(preguntas) {
  for (const [i, p] of preguntas.entries()) {
    if (!p.pregunta.trim()) return `Escribe el texto de la pregunta ${i + 1}.`;
    if (p.opciones.some((o) => !o.texto.trim())) return `Completa todas las opciones de la pregunta ${i + 1}.`;
    if (p.opciones.filter((o) => o.correcta).length !== 1)
      return `Marca la respuesta correcta de la pregunta ${i + 1}.`;
  }
  return "";
}
