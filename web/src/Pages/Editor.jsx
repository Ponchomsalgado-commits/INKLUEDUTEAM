import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { obtenerMisActividades, obtenerPlantillas } from '../services/activityService';
import { mensajeDeError } from "../components/shared/errorHandler";
import { ICONOS_SKIN } from '../components/shared/iconosSkin';

// Editor: elegir una plantilla para crear una actividad nueva o seguir editando una propia.

export default function Editor() {
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(true);
  const [actividades, setActividades] = useState([]);
  const [cargandoActividades, setCargandoActividades] = useState(true);

  useEffect(() => {
    obtenerPlantillas()
      .then(setPlantillas)
      .finally(() => setCargandoPlantillas(false));

    obtenerMisActividades()
      .then((data) => setActividades(Array.isArray(data) ? data : []))
      .catch(() => setActividades([]))
      .finally(() => setCargandoActividades(false));
  }, []);

  return (
    <div className="pagina">
      <div className="pagina-encabezado">
        <h1>Editor</h1>
        <p>Elige una plantilla para crear una actividad nueva, o sigue editando una tuya.</p>
      </div>

      <section className="panel" aria-labelledby="editor-plantillas">
        <h2 id="editor-plantillas" className="panel-titulo">
          Plantillas
        </h2>

        {cargandoPlantillas && <p role="status">Cargando plantillas...</p>}
        {!cargandoPlantillas && plantillas.length === 0 && (
          <p className="sin-datos">No hay plantillas aún</p>
        )}

        <ul className="fila-tarjetas">
          {plantillas.map((p) => (
            <li key={p.id}>
              <Link to={`/salones/crear/actividad?plantilla=${p.id}`} className="tarjeta-actividad">
                <span className="tarjeta-actividad-icono" aria-hidden="true">
                  {ICONOS_SKIN[p.skin] ?? '🎮'}
                </span>
                <strong>{p.displayName}</strong>
                <small>Usar plantilla</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="editor-mias">
        <h2 id="editor-mias" className="panel-titulo">
          Seguir editando
        </h2>

        {cargandoActividades && <p role="status">Cargando actividades...</p>}
        {!cargandoActividades && actividades.length === 0 && (
          <p className="sin-datos">Aún no tienes actividades.</p>
        )}

        <ul className="lista-filas">
          {actividades.map((a) => (
            <li key={a.id} className="fila">
              <span className="fila-icono" aria-hidden="true">
                {ICONOS_SKIN[a.template?.skin] ?? '🎮'}
              </span>
              <div className="fila-info">
                <strong>{a.title}</strong>
                <small>
                  {a.template?.displayName} · {a.mediaCount}{' '}
                  {a.mediaCount === 1 ? 'archivo' : 'archivos'}
                </small>
              </div>
              <div className="fila-acciones">
                <Link to={`/actividades/editar?actividad=${a.id}`} className="plantilla-usar">
                  Editar
                </Link>
                <Link to={`/actividades/previa?actividad=${a.id}`} className="plantilla-usar">
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
