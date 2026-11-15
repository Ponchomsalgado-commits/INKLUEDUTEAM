import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { obtenerMisActividades, obtenerPlantillas } from '../services/activityService';
import { ICONOS_SKIN } from '../components/shared/iconosSkin';
import '../styles/editor.css';

// Editor: elegir una plantilla para crear una actividad nueva o seguir editando una propia.

const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Editor() {
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(true);
  const [actividades, setActividades] = useState([]);
  const [cargandoActividades, setCargandoActividades] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    obtenerPlantillas()
      .then(setPlantillas)
      .finally(() => setCargandoPlantillas(false));

    obtenerMisActividades()
      .then((data) => setActividades(Array.isArray(data) ? data : []))
      .catch(() => setActividades([]))
      .finally(() => setCargandoActividades(false));
  }, []);

  const filtro = normalizar(busqueda.trim());
  const plantillasFiltradas = useMemo(
    () => plantillas.filter((p) => normalizar(p.displayName).includes(filtro)),
    [plantillas, filtro],
  );
  const actividadesFiltradas = useMemo(
    () =>
      actividades.filter(
        (a) =>
          normalizar(a.title).includes(filtro) ||
          normalizar(a.template?.displayName).includes(filtro),
      ),
    [actividades, filtro],
  );

  return (
    <div className="editor-pagina">
      <h1 className="titulo-pagina">Editor</h1>

      <div className="barra">
        <label htmlFor="editor-buscar" className="solo-lectores">
          Buscar plantillas y actividades
        </label>
        <input
          id="editor-buscar"
          type="search"
          className="buscador"
          placeholder="Buscar plantillas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {plantillas.length > 0 ? (
          <Link className="boton" to={`/actividades/nueva?plantilla=${plantillas[0].id}`}>
            Crear +
          </Link>
        ) : (
          <a className="boton" href="#editor-plantillas">
            Crear +
          </a>
        )}
      </div>

      <h2 id="editor-plantillas" className="seccion-titulo">
        Plantillas
      </h2>
      <p className="vacio">Elige una plantilla para diseñar una actividad nueva.</p>

      {cargandoPlantillas && <p role="status">Cargando plantillas...</p>}
      {!cargandoPlantillas && plantillasFiltradas.length === 0 && (
        <p className="vacio">
          {filtro ? 'No encontramos esa plantilla.' : 'No hay plantillas aún'}
        </p>
      )}

      <div className="ed-lista" aria-labelledby="editor-plantillas">
        {plantillasFiltradas.map((p) => (
          <div key={p.id} className="ed-fila">
            <span className="ed-fila-icono" aria-hidden="true">
              {ICONOS_SKIN[p.skin] ?? '🎮'}
            </span>
            <div className="ed-fila-info">
              <strong>{p.displayName}</strong>
              <small>Abrir en el editor</small>
            </div>
            <Link
              to={`/actividades/nueva?plantilla=${p.id}`}
              className="boton-icono"
              aria-label={`Editar la plantilla ${p.displayName}`}
            >
              ✏️
            </Link>
          </div>
        ))}
      </div>

      <h2 id="editor-mias" className="seccion-titulo">
        Seguir editando
      </h2>

      {cargandoActividades && <p role="status">Cargando actividades...</p>}
      {!cargandoActividades && actividadesFiltradas.length === 0 && (
        <p className="vacio">
          {filtro ? 'No encontramos esa actividad.' : 'Aún no tienes actividades.'}
        </p>
      )}

      <div className="ed-lista" aria-labelledby="editor-mias">
        {actividadesFiltradas.map((a) => (
          <div key={a.id} className="ed-fila">
            <span className="ed-fila-icono" aria-hidden="true">
              {ICONOS_SKIN[a.template?.skin] ?? '🎮'}
            </span>
            <div className="ed-fila-info">
              <strong>{a.title}</strong>
              <small>
                {a.template?.displayName} · {a.mediaCount} {a.mediaCount === 1 ? 'archivo' : 'archivos'}
              </small>
            </div>
            <div className="ed-fila-acciones">
              <Link to={`/actividades/previa?actividad=${a.id}`} className="boton boton-sec">
                Previsualizar
              </Link>
              <Link
                to={`/actividades/editar?actividad=${a.id}`}
                className="boton-icono"
                aria-label={`Editar ${a.title}`}
              >
                ✏️
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
