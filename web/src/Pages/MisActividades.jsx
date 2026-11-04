import { useEffect, useState } from "react";
import { obtenerActividad, obtenerMisActividades } from "../services/activityService";
import VistaPreviaActividad from "../components/VistaPreviaActividad";
import { mensajeDeError } from "../components/errorHandler";
import { ICONOS_SKIN } from "../components/iconosSkin";

// T3104: Pantalla "Mis actividades": copias propias de plantillas, con opción de editar o previsualizar.
// Crear una actividad nueva empieza en el catálogo de plantillas (/salones/crear).

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : "—";
}

export default function MisActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Vista previa abierta: { id, detalle, error }. El detalle (preguntas) se pide solo al abrirla.
  const [previa, setPrevia] = useState(null);

  useEffect(() => {
    // Si la lista no se puede cargar se muestra como vacía en vez del error
    obtenerMisActividades()
      .then((data) => setActividades(Array.isArray(data) ? data : []))
      .catch(() => setActividades([]))
      .finally(() => setCargando(false));
  }, []);

  const togglePrevia = async (id) => {
    if (previa?.id === id) {
      setPrevia(null);
      return;
    }

    setPrevia({ id, detalle: null, error: "" });
    try {
      const detalle = await obtenerActividad(id);
      // Solo se aplica si sigue siendo la vista abierta (el usuario pudo cambiar de tarjeta)
      setPrevia((abierta) => (abierta?.id === id ? { id, detalle, error: "" } : abierta));
    } catch (err) {
      setPrevia((abierta) =>
        abierta?.id === id
          ? { id, detalle: null, error: mensajeDeError(err, "No se pudo cargar la vista previa") }
          : abierta,
      );
    }
  };

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
            const abierta = previa?.id === actividad.id;

            return (
              <li key={actividad.id} className="salon-card actividad-card">
                <div className="salon-info">
                  <strong>
                    <span aria-hidden="true">{ICONOS_SKIN[actividad.template.skin] ?? "🎮"} </span>
                    {actividad.title}
                  </strong>
                  <span className="salon-tipo">{actividad.template.displayName}</span>
                </div>

                <p className="actividad-detalle">
                  {actividad.mediaCount} {actividad.mediaCount === 1 ? "archivo" : "archivos"} de material · creada el{" "}
                  {formatearFecha(actividad.createdAt)}
                </p>

                <div className="actividad-acciones">
                  <a href={`/actividades/editar?actividad=${actividad.id}`} className="plantilla-usar">
                    Editar
                  </a>
                  <button
                    type="button"
                    className="ver-miembros"
                    aria-expanded={abierta}
                    onClick={() => togglePrevia(actividad.id)}
                  >
                    {abierta ? "Ocultar vista previa" : "Previsualizar"}
                  </button>
                </div>

                {abierta &&
                  (previa.error ? (
                    <p role="alert">{previa.error}</p>
                  ) : previa.detalle ? (
                    <VistaPreviaActividad actividad={previa.detalle} />
                  ) : (
                    <p role="status">Cargando vista previa...</p>
                  ))}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
