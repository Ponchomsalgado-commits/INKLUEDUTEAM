// Pregunta nueva del TemplateEditor: texto vacío y N opciones sin marcar como correctas(claude)
export function preguntaVacia(id, totalOpciones) {
  return {
    id,
    pregunta: "",
    opciones: Array.from({ length: totalOpciones }, () => ({ texto: "", correcta: false })),
  };
}
