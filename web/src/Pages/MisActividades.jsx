import { useEffect, useState } from "react";
import { Link } from "react-router";
import { obtenerMisActividades } from "../services/activityService";
import { ICONOS_SKIN } from "../components/shared/iconosSkin";

// T3104: Pantalla "Mis actividades": copias propias de plantillas, con opción de editar o previsualizar como alumno.
// Crear una actividad nueva empieza en el catálogo de plantillas (/salones/crear).

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : "—";
}

export default function MisActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Si la lista no se puede cargar se muestra como vacía en vez del error
    obtenerMisActividades()
      .then((data) => setActividades(Array.isArray(data) ? data : []))
      .catch(() => setActividades([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="tarjeta salones-container salones-ancho">
      <section aria-labelledby="lista-actividades" className="seccion-salones">
        <div className="encabezado-seccion">
          <h2 id="lista-actividades">Mis actividades</h2>
          <Link to="/salones/crear#catalogo-plantillas" className="btn-crear">
            + Nueva actividad
          </Link>
        </div>
        <p className="catalogo-subtitulo">
          Tus copias editadas de las plantillas. Editarlas nunca modifica la plantilla original.
        </p>

        {cargando && <p role="status">Cargando actividades...</p>}
        {!cargando && actividades.length === 0 && (
          <p className="sin-datos">No hay actividades aún. Crea una desde el catálogo de plantillas.</p>
        )}

        <ul className="lista-salones">
          {actividades.map((actividad) => (
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
                <Link to={`/actividades/editar?actividad=${actividad.id}`} className="plantilla-usar">
                  Editar
                </Link>
                <Link to={`/actividades/previa?actividad=${actividad.id}`} className="plantilla-usar">
                  Previsualizar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
