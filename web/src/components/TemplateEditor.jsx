import { opcionesIniciales, preguntaVacia } from "./shared/preguntaVacia";

// Ids q1, q2... estables: al quitar una pregunta no se reutiliza su id (ver sección 1.8.2)
function siguienteId(preguntas) {
  const mayor = preguntas.reduce((max, p) => Math.max(max, Number(p.id.slice(1)) || 0), 0);
  return `q${mayor + 1}`;
}

// schemaPreguntas es el campo "preguntas" del schemaJson del backend (ver templates.catalog.ts)
export default function TemplateEditor({ schemaPreguntas, preguntas, onChange }) {
  const minPreguntas = schemaPreguntas.minItems ?? 1;
  const maxPreguntas = schemaPreguntas.maxItems ?? 10;
  const reglasPregunta = schemaPreguntas.items.fields.pregunta;
  const reglasOpciones = schemaPreguntas.items.fields.opciones;
  const minOpciones = reglasOpciones.minItems ?? 1;
  const maxOpciones = reglasOpciones.maxItems ?? minOpciones;

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

  // Dentro de los límites de la plantilla (mín. y máx. de opciones por pregunta)
  const agregarOpcion = (pregunta) =>
    actualizarPregunta(pregunta.id, {
      opciones: [...pregunta.opciones, { texto: "", correcta: false }],
    });

  const quitarOpcion = (pregunta, indice) =>
    actualizarPregunta(pregunta.id, {
      opciones: pregunta.opciones.filter((_, i) => i !== indice),
    });

  const agregarPregunta = () =>
    onChange([...preguntas, preguntaVacia(siguienteId(preguntas), opcionesIniciales(reglasOpciones))]);

  const quitarPregunta = (id) => onChange(preguntas.filter((p) => p.id !== id));

  return (
    <div className="te">
      <p className="te-contador">
        {preguntas.length} de {maxPreguntas} preguntas
      </p>

      <ol className="te-preguntas">
        {preguntas.map((pregunta, numero) => (
          <li key={pregunta.id} className="te-pregunta">
            <div className="te-pregunta-cab">
              <h4>Pregunta {numero + 1}</h4>
              <button
                type="button"
                className="boton-chico"
                onClick={() => quitarPregunta(pregunta.id)}
                disabled={preguntas.length <= minPreguntas}
              >
                Quitar
              </button>
            </div>

            <div className="campo-bloque">
              <label htmlFor={`${pregunta.id}-texto`}>Texto de la pregunta</label>
              <input
                id={`${pregunta.id}-texto`}
                type="text"
                value={pregunta.pregunta}
                maxLength={reglasPregunta.maxLength}
                onChange={(e) => actualizarPregunta(pregunta.id, { pregunta: e.target.value })}
                placeholder="Ej. ¿Cuál es la capital de Francia?"
                required
              />
            </div>

            <fieldset className="campo-bloque te-opciones">
              <legend>
                Opciones (marca la correcta) · de {minOpciones} a {maxOpciones}
              </legend>
              {pregunta.opciones.map((opcion, i) => (
                <div key={i} className="te-opcion">
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
                    maxLength={reglasOpciones.items.fields.texto.maxLength}
                    onChange={(e) => actualizarOpcion(pregunta, i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    aria-label={`Texto de la opción ${i + 1}`}
                    required
                  />
                  <button
                    type="button"
                    className="boton-chico"
                    onClick={() => quitarOpcion(pregunta, i)}
                    disabled={pregunta.opciones.length <= minOpciones}
                    aria-label={`Quitar opción ${i + 1}`}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="boton-chico"
                onClick={() => agregarOpcion(pregunta)}
                disabled={pregunta.opciones.length >= maxOpciones}
              >
                + Agregar opción
              </button>
            </fieldset>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="boton boton-sec"
        onClick={agregarPregunta}
        disabled={preguntas.length >= maxPreguntas}
      >
        + Agregar pregunta
      </button>
    </div>
  );
}
