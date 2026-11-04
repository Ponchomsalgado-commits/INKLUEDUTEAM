import { preguntaVacia } from "./preguntaVacia";

// Ids q1, q2... estables: al quitar una pregunta no se reutiliza su id (ver sección 1.8.2)
function siguienteId(preguntas) {
  const mayor = preguntas.reduce((max, p) => Math.max(max, Number(p.id.slice(1)) || 0), 0);
  return `q${mayor + 1}`;
}

export default function TemplateEditor({ schemaPreguntas, preguntas, onChange }) {
  const minPreguntas = schemaPreguntas.minItems ?? 1;
  const maxPreguntas = schemaPreguntas.maxItems ?? 10;
  const reglasPregunta = schemaPreguntas.items.pregunta;
  const reglasOpciones = schemaPreguntas.items.opciones;
  const totalOpciones = reglasOpciones.minItems ?? 3;

  const actualizarPregunta = (id, cambios) =>
    onChange(preguntas.map((p) => (p.id === id ? { ...p, ...cambios } : p)));

  const actualizarOpcion = (pregunta, indice, texto) =>
    actualizarPregunta(pregunta.id, {
      opciones: pregunta.opciones.map((o, i) => (i === indice ? { ...o, texto } : o)),
    });

  // Radio por pregunta: marcar una desmarca las demás (regla exactamente_una_correcta)
  const marcarCorrecta = (pregunta, indice) =>
    actualizarPregunta(pregunta.id, {
      opciones: pregunta.opciones.map((o, i) => ({ ...o, correcta: i === indice })),
    });

  const agregarPregunta = () =>
    onChange([...preguntas, preguntaVacia(siguienteId(preguntas), totalOpciones)]);

  const quitarPregunta = (id) => onChange(preguntas.filter((p) => p.id !== id));

  return (
    <div className="template-editor">
      <p className="editor-contador">
        {preguntas.length} de {maxPreguntas} preguntas
      </p>

      <ol className="editor-preguntas">
        {preguntas.map((pregunta, numero) => (
          <li key={pregunta.id} className="editor-pregunta">
            <div className="editor-pregunta-encabezado">
              <h4>Pregunta {numero + 1}</h4>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => quitarPregunta(pregunta.id)}
                disabled={preguntas.length <= minPreguntas}
              >
                Quitar
              </button>
            </div>

            <div className="form-group">
              <label htmlFor={`${pregunta.id}-texto`}>Texto de la pregunta</label>
              <input
                id={`${pregunta.id}-texto`}
                type="text"
                value={pregunta.pregunta}
                maxLength={reglasPregunta.maxLength}
                onChange={(e) => actualizarPregunta(pregunta.id, { pregunta: e.target.value })}
                placeholder="Ej. ¿Cuál es la capital de Francia?"
                required={reglasPregunta.required}
              />
            </div>

            <fieldset className="form-group editor-opciones">
              <legend>Opciones (marca la correcta)</legend>
              {pregunta.opciones.map((opcion, i) => (
                <div key={i} className="editor-opcion">
                  <input
                    type="radio"
                    name={`${pregunta.id}-correcta`}
                    checked={opcion.correcta}
                    onChange={() => marcarCorrecta(pregunta, i)}
                    aria-label={`Opción ${i + 1} es la correcta`}
                  />
                  <input
                    type="text"
                    value={opcion.texto}
                    maxLength={reglasOpciones.items.texto.maxLength}
                    onChange={(e) => actualizarOpcion(pregunta, i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    aria-label={`Texto de la opción ${i + 1}`}
                    required
                  />
                </div>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>

      <button type="button" onClick={agregarPregunta} disabled={preguntas.length >= maxPreguntas}>
        + Agregar pregunta
      </button>
    </div>
  );
}
