import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { obtenerActividad, obtenerMisActividades } from '../services/activityService';
import { ICONOS_SKIN } from '../components/shared/iconosSkin';
import { extensionDe } from '../components/shared/materialUtils';

// Galería: buscador, tus actividades y todo el material (PDF, MP4, ...) que les subiste.
// El backend no tiene un listado de material suelto, así que se junta desde el detalle
// de cada actividad que tiene archivos.

const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Galeria() {
  const [busqueda, setBusqueda] = useState('');
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [material, setMaterial] = useState([]);
  const [cargandoMaterial, setCargandoMaterial] = useState(true);

  useEffect(() => {
    let vigente = true;

    obtenerMisActividades()
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        if (!vigente) return;
        setActividades(lista);

        const conMaterial = lista.filter((a) => a.mediaCount > 0);
        return Promise.allSettled(conMaterial.map((a) => obtenerActividad(a.id))).then(
          (detalles) => {
            if (!vigente) return;
            const archivos = detalles.flatMap((r) =>
              r.status === 'fulfilled'
                ? (r.value.media ?? []).map((m) => ({
                    ...m,
                    actividad: r.value.title,
                    actividadId: r.value.id,
                  }))
                : [],
            );
            setMaterial(archivos);
          },
        );
      })
      // Si no se puede cargar se muestra como vacío en vez del error
      .catch(() => vigente && setActividades([]))
      .finally(() => {
        if (!vigente) return;
        setCargando(false);
        setCargandoMaterial(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const filtro = normalizar(busqueda.trim());
  const actividadesFiltradas = useMemo(
    () =>
      actividades.filter(
        (a) =>
          normalizar(a.title).includes(filtro) ||
          normalizar(a.template?.displayName).includes(filtro),
      ),
    [actividades, filtro],
  );
  const materialFiltrado = useMemo(
    () =>
      material.filter(
        (m) => normalizar(m.name).includes(filtro) || normalizar(m.actividad).includes(filtro),
      ),
    [material, filtro],
  );

  return (
    <div className="pagina">
      <div className="galeria-barra">
        <label htmlFor="galeria-buscar" className="solo-lectores">
          Buscar en la galería
        </label>
        <input
          id="galeria-buscar"
          type="search"
          className="buscador"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Link to="/editor" className="btn-subir">
          Subir <span aria-hidden="true">+</span>
        </Link>
      </div>

      <section className="panel" aria-labelledby="galeria-actividades">
        <h2 id="galeria-actividades" className="panel-titulo">
          Actividades
        </h2>

        {cargando && <p role="status">Cargando actividades...</p>}
        {!cargando && actividadesFiltradas.length === 0 && (
          <p className="sin-datos">
            {filtro
              ? 'Ninguna actividad coincide con la búsqueda.'
              : 'Aún no tienes actividades. Crea una desde el Editor.'}
          </p>
        )}

        <ul className="fila-tarjetas">
          {actividadesFiltradas.map((a) => (
            <li key={a.id}>
              <Link to={`/actividades/previa?actividad=${a.id}`} className="tarjeta-actividad">
                <span className="tarjeta-actividad-icono" aria-hidden="true">
                  {ICONOS_SKIN[a.template?.skin] ?? '🎮'}
                </span>
                <strong>{a.title}</strong>
                <small>{a.template?.displayName}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="galeria-material">
        <h2 id="galeria-material" className="panel-titulo">
          Material
        </h2>

        {cargandoMaterial && <p role="status">Cargando material...</p>}
        {!cargandoMaterial && materialFiltrado.length === 0 && (
          <p className="sin-datos">
            {filtro ? 'Ningún archivo coincide con la búsqueda.' : 'Aún no hay material subido.'}
          </p>
        )}

        <ul className="rejilla-archivos">
          {materialFiltrado.map((m) => {
            const ext = extensionDe(m.name) || 'archivo';
            return (
              <li key={`${m.actividadId}-${m.key}`}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`tarjeta-archivo archivo-${ext}`}
                  title={`${m.name} · ${m.actividad}`}
                >
                  <strong>{ext.toUpperCase()}</strong>
                  <small>{m.name}</small>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
