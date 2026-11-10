import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { obtenerActividad, obtenerMisActividades } from '../services/activityService';
import { listarMaterial } from '../services/mediaService';
import SubirMaterial from '../components/SubirMaterial';
import { ICONOS_SKIN } from '../components/shared/iconosSkin';
import { ICONOS_MATERIAL, extensionDe, tipoDeMaterial } from '../components/shared/materialUtils';
import '../styles/galeria.css';

// Galería: buscador, tus actividades y todo el material (PDF, MP4, ...) que subiste.
// "Subir +" abre una ventana para arrastrar o elegir archivos; se guardan en MinIO y la lista
// sale de GET /media. Si ese listado falla, se muestra el material ligado a las actividades.

const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const FILTROS = [
  { clave: 'todos', texto: 'Todos' },
  { clave: 'lectura', texto: 'Lectura' },
  { clave: 'video', texto: 'Video' },
  { clave: 'audio', texto: 'Audio' },
];
const EXTENSIONES_IMAGEN = ['png', 'jpg', 'jpeg', 'webp'];

export default function Galeria() {
  const [busqueda, setBusqueda] = useState('');
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [materialActividades, setMaterialActividades] = useState([]);
  const [materialGuardado, setMaterialGuardado] = useState(null);
  const [cargandoMaterial, setCargandoMaterial] = useState(true);
  const [tipoActivo, setTipoActivo] = useState('todos');
  const [vista, setVista] = useState(null);
  const [subidas, setSubidas] = useState([]);
  const ventana = useRef(null);
  const ventanaSubir = useRef(null);

  useEffect(() => {
    let vigente = true;

    const cargarActividades = obtenerMisActividades()
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
            setMaterialActividades(archivos);
          },
        );
      })
      // Si no se puede cargar se muestra como vacío en vez del error
      .catch(() => vigente && setActividades([]))
      .finally(() => vigente && setCargando(false));

    // Todo lo subido; si falla, la lista cae al material de las actividades
    const cargarGuardado = listarMaterial()
      .then((lista) => vigente && setMaterialGuardado(lista))
      .catch(() => vigente && setMaterialGuardado(null));

    Promise.allSettled([cargarActividades, cargarGuardado]).then(
      () => vigente && setCargandoMaterial(false),
    );

    return () => {
      vigente = false;
    };
  }, []);

  // Archivos guardados + la actividad a la que pertenecen (si alguna los usa)
  const material = useMemo(() => {
    if (!materialGuardado) return materialActividades;
    const porClave = new Map(materialActividades.map((m) => [m.key, m]));
    return materialGuardado.map((m) => {
      const enActividad = porClave.get(m.key);
      return enActividad
        ? { ...m, actividad: enActividad.actividad, actividadId: enActividad.actividadId }
        : m;
    });
  }, [materialGuardado, materialActividades]);

  // Un archivo recién subido aparece al instante, sin recargar la página
  const alSubir = (subido) => {
    const nuevo = { ...subido, lastModified: new Date().toISOString() };
    setMaterialGuardado((previo) => [
      nuevo,
      ...(previo ?? materialActividades).filter((m) => m.key !== nuevo.key),
    ]);
  };

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
        (m) =>
          (tipoActivo === 'todos' || tipoDeMaterial(m.name) === tipoActivo) &&
          (normalizar(m.name).includes(filtro) || normalizar(m.actividad ?? '').includes(filtro)),
      ),
    [material, filtro, tipoActivo],
  );

  const abrirVista = (archivo) => {
    setVista(archivo);
    ventana.current?.showModal();
  };

  const extVista = vista ? extensionDe(vista.name) : '';
  const tipoVista = vista ? tipoDeMaterial(vista.name) : 'lectura';

  return (
    <div className="galeria-pagina">
      <h1 className="titulo-pagina">Galería</h1>

      <div className="barra">
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
        <button type="button" className="boton" onClick={() => ventanaSubir.current?.showModal()}>
          Subir +
        </button>
      </div>

      <h2 id="galeria-actividades" className="seccion-titulo">
        Actividades recientes
      </h2>

      {cargando && <p role="status">Cargando actividades...</p>}
      {!cargando && actividadesFiltradas.length === 0 && (
        <p className="vacio">
          {filtro
            ? 'Ninguna actividad coincide con la búsqueda.'
            : 'Aún no tienes actividades. Crea una desde el Editor.'}
        </p>
      )}

      <div className="fila-scroll" aria-labelledby="galeria-actividades">
        {actividadesFiltradas.map((a) => (
          <Link
            key={a.id}
            to={`/actividades/editar?actividad=${a.id}`}
            className="actividad"
            title={`Editar · ${a.template?.displayName ?? ''}`}
          >
            <span aria-hidden="true">{ICONOS_SKIN[a.template?.skin] ?? '🎮'}</span> {a.title}
          </Link>
        ))}
      </div>

      <h2 id="galeria-material" className="seccion-titulo">
        Mis archivos
      </h2>

      <div className="filtros" role="group" aria-label="Filtrar por tipo de archivo">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            type="button"
            className="chip-filtro"
            aria-pressed={tipoActivo === f.clave}
            onClick={() => setTipoActivo(f.clave)}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {cargandoMaterial && <p role="status">Cargando material...</p>}
      {!cargandoMaterial && materialFiltrado.length === 0 && (
        <p className="vacio">
          {filtro || tipoActivo !== 'todos'
            ? 'No hay archivos con esa búsqueda. Prueba con otra palabra o filtro.'
            : 'Aún no hay material subido.'}
        </p>
      )}

      <div className="archivos" aria-labelledby="galeria-material">
        {materialFiltrado.map((m) => {
          const ext = extensionDe(m.name) || 'archivo';
          return (
            <button
              key={m.key}
              type="button"
              className="archivo"
              title={m.actividad ? `${m.name} · ${m.actividad}` : m.name}
              onClick={() => abrirVista(m)}
            >
              <span className={`tipo tipo-${tipoDeMaterial(m.name)}`}>{ext.toUpperCase()}</span>
              <span className="nombre">{m.name}</span>
            </button>
          );
        })}
      </div>

      <dialog
        ref={ventanaSubir}
        className="galeria-subir"
        aria-labelledby="galeria-subir-titulo"
        onClose={() => setSubidas([])}
      >
        <div className="dialogo-cab">
          <h2 id="galeria-subir-titulo">Subir archivos</h2>
          <button
            type="button"
            className="boton-icono"
            aria-label="Cerrar ventana de subida"
            onClick={() => ventanaSubir.current?.close()}
          >
            ✕
          </button>
        </div>
        <div className="dialogo-cuerpo">
          <SubirMaterial
            titulo="Arrastra o elige los archivos que quieres guardar en tu galería"
            materiales={subidas}
            onChange={setSubidas}
            maximo={Infinity}
            onSubido={alSubir}
          />
          <button type="button" className="boton" onClick={() => ventanaSubir.current?.close()}>
            Listo
          </button>
        </div>
      </dialog>

      <dialog ref={ventana} aria-labelledby="galeria-vista-nombre" onClose={() => setVista(null)}>
        <div className="dialogo-cab">
          <h2 id="galeria-vista-nombre">{vista?.name}</h2>
          <div>
            {vista?.actividadId && (
              <Link
                to={`/actividades/editar?actividad=${vista.actividadId}`}
                className="boton-icono"
                aria-label="Editar la actividad de este archivo"
              >
                ✏️
              </Link>
            )}
            <button
              type="button"
              className="boton-icono"
              aria-label="Cerrar vista previa"
              onClick={() => ventana.current?.close()}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="dialogo-cuerpo">
          {vista && (
            <>
              <div className="vista-previa">
                {EXTENSIONES_IMAGEN.includes(extVista) ? (
                  <img src={vista.url} alt={vista.name} />
                ) : tipoVista === 'video' ? (
                  <video src={vista.url} controls />
                ) : tipoVista === 'audio' ? (
                  <audio src={vista.url} controls />
                ) : (
                  <>
                    <span aria-hidden="true">{ICONOS_MATERIAL[tipoVista]}</span>
                    <small>Vista previa de {vista.name}</small>
                  </>
                )}
              </div>
              <p className="vista-detalle">
                {vista.actividad && <>Actividad: {vista.actividad} · </>}
                <a href={vista.url} target="_blank" rel="noreferrer">
                  Abrir en una pestaña nueva
                </a>
              </p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
