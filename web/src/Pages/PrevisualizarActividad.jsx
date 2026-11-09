import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { obtenerActividad } from "../services/activityService";

// Vista previa de solo lectura tal como la verá el alumno: preguntas y opciones, sin respuesta correcta ni envío.
// Se abre desde "Editar" o "Mis actividades" con ?actividad=ID.(claude)

export default function PrevisualizarActividad() {
  const [params] = useSearchParams();
  const actividadId = params.get("actividad");
  const [actividad, setActividad] = useState(null);
  // Sin ?actividad= no hay nada que cargar: se muestra "No encontramos esa actividad" directo
  const [cargando, setCargando] = useState(Boolean(actividadId));

  useEffect(() => {
    if (!actividadId) return;

    obtenerActividad(actividadId)
      .then(setActividad)
      .catch(() => setActividad(null))
      .finally(() => setCargando(false));
  }, [actividadId]);

  const enlaceVolver = (
    <Link to="/actividades" className="enlace-volver">
      ← Volver a Mis actividades
    </Link>
  );

  if (cargando) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <p role="status">Cargando vista previa...</p>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        {enlaceVolver}
        <p className="sin-datos">No encontramos esa actividad.</p>
      </div>
    );
  }

  const preguntas = actividad.contentJson?.preguntas ?? [];

  return (
    <div className="tarjeta salones-container salones-ancho">
      {enlaceVolver}

      <section className="vista-previa" aria-labelledby="vista-previa-alumno-titulo">
        <h2 id="vista-previa-alumno-titulo">{actividad.title}</h2>
        <p className="catalogo-subtitulo">Vista previa de alumno · solo lectura</p>

        {preguntas.length === 0 && <p className="sin-datos">Sin preguntas</p>}
        <ol className="vista-previa-preguntas">
          {preguntas.map((p) => (
            <li key={p.id}>
              <p>{p.pregunta}</p>
              <ul className="vista-previa-opciones">
                {p.opciones.map((o, i) => (
                  <li key={i}>{o.texto}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
