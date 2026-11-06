// Pregunta nueva del TemplateEditor: texto vacío y N opciones sin marcar como correctas(claude)
export function preguntaVacia(id, totalOpciones) {
  return {
    id,
    pregunta: "",
    opciones: Array.from({ length: totalOpciones }, () => ({ texto: "", correcta: false })),
  };
}

// Opciones con las que arranca una pregunta nueva: 3, pero sin salirse de los límites de la plantilla
export function opcionesIniciales(reglasOpciones) {
  const minimo = reglasOpciones.minItems ?? 1;
  const maximo = reglasOpciones.maxItems ?? minimo;
  return Math.min(Math.max(3, minimo), maximo);
}
