import { useEffect, useState } from "react";
import { obtenerMiembros, obtenerSalon } from "../services/classroomService";
import {
  obtenerAsignacionesSalon,
  obtenerInsigniasSalon,
  retirarAsignacion,
} from "../services/assignmentService";
import PublicarActividad from "../components/PublicarActividad";
import TableroSeguimiento from "../components/TableroSeguimiento";
import ListaInsignias from "../components/ListaInsignias";
import { mensajeDeError } from "../components/shared/errorHandler";
import { formatearFechaCorta, formatearFechaHora } from "../components/shared/fechas";
import { ICONOS_SKIN } from "../components/shared/iconosSkin";
import { rutaDetalleAlumno, tipoSalonLegible } from "../components/shared/rutasSalon";

// Detalle de un salón o tutoría (Sprints 5 y 6): alumnos, actividades publicadas,
// publicar una actividad, tablero de seguimiento e insignias.
// URL: /salones/detalle?salon=ID[&desde=tutorias][&vista=alumnos|actividades|seguimiento|insignias]

const VISTAS = [
  { id: "alumnos", texto: "Alumnos" },
  { id: "actividades", texto: "Actividades publicadas" },
  { id: "seguimiento", texto: "Tablero de seguimiento" },
  { id: "insignias", texto: "Insignias" },
];

export default function DetalleSalon() {
  const params = new URLSearchParams(window.location.search);
  const salonId = params.get("salon");
  const desde = params.get("desde") === "tutorias" ? "tutorias" : undefined;
  const vistaInicial = VISTAS.some((v) => v.id === params.get("vista")) ? params.get("vista") : "alumnos";

  const [salon, setSalon] = useState(null);
  const [cargandoSalon, setCargandoSalon] = useState(Boolean(salonId));
  const [errorSalon, setErrorSalon] = useState("");
  const [vista, setVista] = useState(vistaInicial);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  const [miembros, setMiembros] = useState([]);
  const [cargandoMiembros, setCargandoMiembros] = useState(true);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(true);
  const [errorAsignaciones, setErrorAsignaciones] = useState("");
  const [insignias, setInsignias] = useState([]);
  const [cargandoInsignias, setCargandoInsignias] = useState(true);

  // Se incrementa al publicar o retirar para recargar las listas y el tablero
  const [version, setVersion] = useState(0);
  const [publicando, setPublicando] = useState(false);
  const [retirandoId, setRetirandoId] = useState(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!salonId) return;
    obtenerSalon(salonId)
      .then(setSalon)
      .catch((err) =>
        setErrorSalon(
          err.response?.status === 404 || err.response?.status === 400
            ? "No encontramos ese salón."
            : mensajeDeError(err, "No se pudo cargar el salón."),
        ),
      )
      .finally(() => setCargandoSalon(false));
    // version: al publicar o retirar se actualizan los contadores del encabezado
  }, [salonId, version]);

  useEffect(() => {
    if (!salonId) return;
    obtenerMiembros(salonId)
      .then((data) => setMiembros(Array.isArray(data) ? data : []))
      .catch(() => setMiembros([]))
      .finally(() => setCargandoMiembros(false));
    obtenerAsignacionesSalon(salonId)
      .then((data) => {
        setAsignaciones(data);
        setErrorAsignaciones("");
      })
      .catch((err) => setErrorAsignaciones(mensajeDeError(err, "No se pudieron cargar las actividades.")))
      .finally(() => setCargandoAsignaciones(false));
    obtenerInsigniasSalon(salonId)
      .then(setInsignias)
      .catch(() => setInsignias([]))
      .finally(() => setCargandoInsignias(false));
  }, [salonId, version]);

  const cambiarVista = (id) => {
    setVista(id);
    // La vista queda en la URL para volver a ella desde el detalle del alumno
    const nuevos = new URLSearchParams(window.location.search);
    nuevos.set("vista", id);
    window.history.replaceState(null, "", `${window.location.pathname}?${nuevos}`);
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(salon.joinCode);
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    } catch {
      // si el navegador no deja copiar, el código sigue visible en pantalla
    }
  };

  const handleRetirar = async (asignacion) => {
    const ok = window.confirm(
      `¿Retirar "${asignacion.activity.title}" de este salón? Tus alumnos ya no la verán. ` +
        "La actividad seguirá en Mis actividades.",
    );
    if (!ok) return;
    setAviso("");
    setRetirandoId(asignacion.id);
    try {
      await retirarAsignacion(asignacion.id);
      setAviso(`"${asignacion.activity.title}" se retiró del salón.`);
      setVersion((v) => v + 1);
    } catch (err) {
      setAviso(mensajeDeError(err, "No se pudo retirar la actividad."));
    } finally {
      setRetirandoId(null);
    }
  };

  const volver = desde ? (
    <a href="/tutorias" className="enlace-volver">
      ← Volver a Tutorías
    </a>
  ) : (
    <a href="/salones" className="enlace-volver">
      ← Volver a Mis salones
    </a>
  );

  if (!salonId || errorSalon) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        {volver}
        <p className="sin-datos">{errorSalon || "No encontramos ese salón."}</p>
      </div>
    );
  }

  if (cargandoSalon || !salon) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <p role="status">Cargando salón...</p>
      </div>
    );
  }

  const esTutoria = salon.type === "INDIVIDUAL";
  const hrefAlumno = (student) => rutaDetalleAlumno(salonId, student.id, { desde });

  return (
    <div className="tarjeta salones-container salones-ancho">
      {volver}

      <header className="detalle-encabezado">
        <div>
          <span className={`salon-tipo ${esTutoria ? "tipo-tutoria" : "tipo-grupo"}`}>
            <span aria-hidden="true">{esTutoria ? "👤 " : "👥 "}</span>
            {tipoSalonLegible(salon.type)}
          </span>
          <h2>{salon.name}</h2>
          <p className="catalogo-subtitulo">
            {salon.memberCount} {salon.memberCount === 1 ? "alumno unido" : "alumnos unidos"} ·{" "}
            {salon.assignmentCount}{" "}
            {salon.assignmentCount === 1 ? "actividad publicada" : "actividades publicadas"}
          </p>
        </div>
        <div className="salon-codigo">
          <span>Código para unirse:</span>
          <code className="codigo-grande">{salon.joinCode}</code>
          <button type="button" onClick={handleCopiar}>
            {codigoCopiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </header>

      <div className="pestanas" role="tablist" aria-label="Secciones del salón">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            id={`pestana-${v.id}`}
            aria-selected={vista === v.id}
            aria-controls={`panel-${v.id}`}
            className={vista === v.id ? "pestana activa" : "pestana"}
            onClick={() => cambiarVista(v.id)}
          >
            {v.texto}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${vista}`} aria-labelledby={`pestana-${vista}`}>
        {vista === "alumnos" && (
          <section className="detalle-seccion" aria-label="Alumnos">
            {cargandoMiembros && <p role="status">Cargando alumnos...</p>}
            {!cargandoMiembros && miembros.length === 0 && (
              <p className="sin-datos">
                {esTutoria
                  ? "Tu alumno aún no se une. Compártele el código para que entre desde la app."
                  : "Aún no hay alumnos. Comparte el código para que se unan desde la app."}
              </p>
            )}
            {miembros.length > 0 && (
              <ul className="lista-alumnos">
                {miembros.map((m) => (
                  <li key={m.student.id}>
                    <a href={hrefAlumno(m.student)} className="alumno-enlace">
                      <strong>{m.student.email}</strong>
                      <small>Se unió el {formatearFechaCorta(m.joinedAt)}</small>
                      <span className="alumno-ver">Ver avance →</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {vista === "actividades" && (
          <section className="detalle-seccion" aria-label="Actividades publicadas">
            <div className="encabezado-seccion">
              <p className="catalogo-subtitulo">Actividades que tus alumnos ven en la app.</p>
              <button type="button" className="btn-publicar" onClick={() => setPublicando(true)}>
                + Publicar actividad
              </button>
            </div>

            {aviso && <p role="status">{aviso}</p>}
            {cargandoAsignaciones && <p role="status">Cargando actividades publicadas...</p>}
            {errorAsignaciones && <p role="alert">{errorAsignaciones}</p>}
            {!cargandoAsignaciones && !errorAsignaciones && asignaciones.length === 0 && (
              <p className="sin-datos">Aún no publicas actividades aquí. ¡Publica la primera!</p>
            )}

            <ul className="lista-salones">
              {asignaciones.map((a) => (
                <li key={a.id} className={`salon-card asignacion-card${a.vencida ? " vencida" : ""}`}>
                  <div className="salon-info">
                    <strong>
                      <span aria-hidden="true">{ICONOS_SKIN[a.activity.skin] ?? "🎮"} </span>
                      {a.activity.title}
                    </strong>
                    {a.vencida ? (
                      <span className="marca-vencida">Vencida</span>
                    ) : (
                      <span className="salon-tipo">Abierta</span>
                    )}
                  </div>
                  <p className="actividad-detalle">
                    Fecha límite: {formatearFechaHora(a.dueDate)}
                    <br />
                    {a.activity.totalPreguntas} {a.activity.totalPreguntas === 1 ? "pregunta" : "preguntas"}
                  </p>
                  <p className="entregados">
                    Entregados: <strong>{a.entregados}</strong> de <strong>{a.totalAlumnos}</strong>
                  </p>
                  <div className="actividad-acciones">
                    <a href={`/actividades/previa?actividad=${a.activity.id}`} className="plantilla-usar">
                      Previsualizar
                    </a>
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={() => handleRetirar(a)}
                      disabled={retirandoId === a.id}
                    >
                      {retirandoId === a.id ? "Retirando..." : "Retirar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {vista === "seguimiento" && (
          <TableroSeguimiento salonId={salonId} version={version} hrefAlumno={hrefAlumno} />
        )}

        {vista === "insignias" && (
          <section className="detalle-seccion" aria-label="Insignias">
            <p className="catalogo-subtitulo">
              Cada insignia celebra un logro personal: empezar, constancia, puntualidad y esfuerzo.
            </p>
            {cargandoInsignias && <p role="status">Cargando insignias...</p>}
            {!cargandoInsignias && insignias.length === 0 && (
              <p className="sin-datos">Cuando tus alumnos se unan, aquí verás sus logros.</p>
            )}
            <ul className="lista-salones">
              {insignias.map(({ student, badges }) => (
                <li key={student.id} className="salon-card">
                  <div className="salon-info">
                    <a href={hrefAlumno(student)}>
                      <strong>{student.email}</strong>
                    </a>
                  </div>
                  <ListaInsignias
                    insignias={badges}
                    textoVacio="Sus primeras insignias llegarán al completar actividades."
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {publicando && (
        <PublicarActividad
          salon={salon}
          actividadesYaPublicadas={asignaciones.map((a) => a.activity.id)}
          onCerrar={() => setPublicando(false)}
          onPublicada={() => {
            setAviso("");
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
