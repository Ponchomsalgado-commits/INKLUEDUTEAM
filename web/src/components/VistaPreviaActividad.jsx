import { ICONOS_MATERIAL, tipoDeMaterial } from "./materialUtils";

// Vista previa de solo lectura de una actividad propia (detalle de GET /activities/:id):
// material adjunto y preguntas con la respuesta correcta marcada.
// La vista del UsuarioA (sin respuestas) es del sprint 4.

export default function VistaPreviaActividad({ actividad }) {
  const preguntas = actividad.contentJson?.preguntas ?? [];
  const material = actividad.media ?? [];

  return (
    <div className="vista-previa">
      {material.length > 0 && (
        <>
          <h4>Material</h4>
          <ul className="vista-previa-material">
            {material.map((m) => (
              <li key={m.key}>
                <a href={m.url} target="_blank" rel="noreferrer">
                  <span aria-hidden="true">{ICONOS_MATERIAL[tipoDeMaterial(m.name)]}</span> {m.name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <h4>Preguntas</h4>
      {preguntas.length === 0 && <p className="sin-datos">Sin preguntas</p>}
      <ol className="vista-previa-preguntas">
        {preguntas.map((p) => (
          <li key={p.id}>
            <p>{p.pregunta}</p>
            <ul className="vista-previa-opciones">
              {p.opciones.map((o, i) => (
                <li key={i} className={o.correcta ? "opcion-correcta" : undefined}>
                  {o.texto}
                  {o.correcta && <span className="opcion-correcta-marca"> ✓ Correcta</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
