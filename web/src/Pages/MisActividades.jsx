import { useEffect, useState } from "react";
import { obtenerMisActividades, obtenerPlantillas } from "../services/activityService";
import VistaPreviaActividad from "../components/VistaPreviaActividad";
import { ICONOS_SKIN } from "../components/iconosSkin";

// T3104: Pantalla "Mis actividades": copias propias de plantillas, con opción de editar o previsualizar.
// Crear una actividad nueva empieza en el catálogo de plantillas (/salones/crear).

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : "—";
}

export default function MisActividades() {
  const [actividades, setActividades] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // actividad con la vista previa abierta
  const [previaAbierta, setPreviaAbierta] = useState(null);

  useEffect(() => {
    Promise.all([
      // Si la lista no se puede cargar se muestra como vacía en vez del error
      obtenerMisActividades().catch(() => []),
      obtenerPlantillas(),
    ])
      .then(([data, catalogo]) => {
        // Solo aceptamos arreglos; si no, usamos lista vacía
        setActividades(Array.isArray(data) ? data : []);
        setPlantillas(catalogo);
      })
      .finally(() => setCargando(false));
  }, []);

  const nombrePlantilla = (actividad) => {
    const { type, skin } = actividad.content_json ?? {};
    const origen =
      plantillas.find((p) => String(p.id) === String(actividad.template_id)) ??
      plantillas.find((p) => p.type === type && p.skin === skin);
    return origen?.display_name ?? skin ?? "Plantilla";
  };

  const togglePrevia = (id) => setPreviaAbierta((abierta) => (abierta === id ? null : id));

  return (
    <div className="tarjeta salones-container salones-ancho">
      <section aria-labelledby="lista-actividades" className="seccion-salones">
        <div className="encabezado-seccion">
          <h2 id="lista-actividades">Mis actividades</h2>
          <a href="/salones/crear#catalogo-plantillas" className="btn-crear">
            + Nueva actividad
          </a>
        </div>
        <p className="catalogo-subtitulo">
          Tus copias editadas de las plantillas. Editarlas nunca modifica la plantilla original.
        </p>

        {cargando && <p role="status">Cargando actividades...</p>}
        {!cargando && actividades.length === 0 && (
          <p className="sin-datos">No hay actividades aún. Crea una desde el catálogo de plantillas.</p>
        )}

        <ul className="lista-salones">
          {actividades.map((actividad) => {
            const totalPreguntas = actividad.content_json?.preguntas?.length ?? 0;
            const totalMaterial = actividad.media_urls?.length ?? 0;

            return (
              <li key={actividad.id} className="salon-card actividad-card">
                <div className="salon-info">
                  <strong>
                    <span aria-hidden="true">{ICONOS_SKIN[actividad.content_json?.skin] ?? "🎮"} </span>
                    {actividad.title}
                  </strong>
                  <span className="salon-tipo">{nombrePlantilla(actividad)}</span>
                </div>

                <p className="actividad-detalle">
                  {totalPreguntas} {totalPreguntas === 1 ? "pregunta" : "preguntas"} · {totalMaterial}{" "}
                  {totalMaterial === 1 ? "archivo" : "archivos"} de material · creada el{" "}
                  {formatearFecha(actividad.created_at)}
                </p>

                <div className="actividad-acciones">
                  <a href={`/actividades/editar?actividad=${actividad.id}`} className="plantilla-usar">
                    Editar
                  </a>
                  <button
                    type="button"
                    className="ver-miembros"
                    aria-expanded={previaAbierta === actividad.id}
                    onClick={() => togglePrevia(actividad.id)}
                  >
                    {previaAbierta === actividad.id ? "Ocultar vista previa" : "Previsualizar"}
                  </button>
                </div>

                {previaAbierta === actividad.id && <VistaPreviaActividad actividad={actividad} />}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
