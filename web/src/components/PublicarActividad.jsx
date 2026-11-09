import { useEffect, useRef, useState } from "react";
import { obtenerMisActividades } from "../services/activityService";
import { obtenerMisSalones } from "../services/classroomService";
import { publicarAsignacion } from "../services/assignmentService";
import { mensajeDeError } from "./shared/errorHandler";
import { aValorLocal, fechaLimiteSugerida, formatearFechaHora } from "./shared/fechas";

// Flujo "Publicar actividad" en una ventana modal, reutilizado en:
// - el detalle del salón (salón fijo: se elige la actividad),
// - Mis actividades y Crear actividad (actividad fija: se elige el salón o tutoría).
// En ambos casos se elige la fecha y hora límite y se hace POST /assignments.

const tipoLegible = (tipo) => (tipo === "INDIVIDUAL" ? "Tutoría individual" : "Salón");

// Los mensajes del backend (400 fecha en el pasado, 409 ya publicada, 404) ya vienen en español
function mensajeDePublicacion(error) {
  const mensaje = error.response?.data?.message;
  if (typeof mensaje === "string" && error.response?.status !== 401) return mensaje;
  if (Array.isArray(mensaje)) return mensaje.join(", ");
  return mensajeDeError(error, "No se pudo publicar la actividad. Revisa tu conexión e inténtalo de nuevo.");
}

export default function PublicarActividad({
  actividad = null,
  salon = null,
  actividadesYaPublicadas = [],
  salonInicialId = "",
  onCerrar,
  onPublicada,
}) {
  const dialogRef = useRef(null);
  // Si falta la actividad se elige de la lista del profesor; si falta el salón, de sus salones
  const eligeActividad = !actividad;

  const [opciones, setOpciones] = useState([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [errorOpciones, setErrorOpciones] = useState("");
  const [elegidoId, setElegidoId] = useState(salonInicialId);
  const [fechaLimite, setFechaLimite] = useState(fechaLimiteSugerida);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState("");
  const [publicada, setPublicada] = useState(null);

  // <dialog> nativo: atrapa el foco y se cierra con Esc
  useEffect(() => {
    const dialog = dialogRef.current;
    // Sin cleanup: al desmontarse, el <dialog> sale del DOM y deja de estar en la capa superior
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const cargar = eligeActividad ? obtenerMisActividades : obtenerMisSalones;
    cargar()
      .then((data) => setOpciones(Array.isArray(data) ? data : []))
      .catch((err) => setErrorOpciones(mensajeDeError(err, "No se pudo cargar la lista.")))
      .finally(() => setCargandoOpciones(false));
  }, [eligeActividad]);

  const handlePublicar = async (e) => {
    e.preventDefault();
    setError("");

    const activityId = actividad?.id ?? elegidoId;
    const classroomId = salon?.id ?? elegidoId;
    if (!elegidoId) {
      setError(eligeActividad ? "Elige una actividad." : "Elige un salón o tutoría.");
      return;
    }
    const fecha = new Date(fechaLimite);
    if (!fechaLimite || Number.isNaN(fecha.getTime())) {
      setError("Elige la fecha y hora límite.");
      return;
    }
    if (fecha <= new Date()) {
      setError("La fecha límite debe ser posterior a este momento.");
      return;
    }

    setPublicando(true);
    try {
      const asignacion = await publicarAsignacion({ activityId, classroomId, dueDate: fecha.toISOString() });
      const elegido = opciones.find((o) => o.id === elegidoId);
      setPublicada({
        actividad: actividad?.title ?? elegido?.title,
        salon: salon?.name ?? elegido?.name,
        dueDate: asignacion?.dueDate ?? fecha.toISOString(),
      });
      onPublicada?.(asignacion);
    } catch (err) {
      setError(mensajeDePublicacion(err));
    } finally {
      setPublicando(false);
    }
  };

  const titulo = actividad ? `Publicar "${actividad.title}"` : `Publicar actividad en "${salon?.name}"`;

  return (
    <dialog
      ref={dialogRef}
      className="modal-publicar"
      aria-labelledby="publicar-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <h3 id="publicar-titulo">{titulo}</h3>

      {publicada ? (
        <div className="publicar-exito">
          <p role="status">
            ¡Listo! "{publicada.actividad}" quedó publicada en "{publicada.salon}". Fecha límite:{" "}
            {formatearFechaHora(publicada.dueDate)}.
          </p>
          <div className="modal-acciones">
            <button type="button" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublicar} noValidate>
          {salon && (
            <p className="catalogo-subtitulo">
              {tipoLegible(salon.type)}: <strong>{salon.name}</strong>
            </p>
          )}

          {cargandoOpciones && (
            <p role="status">{eligeActividad ? "Cargando tus actividades..." : "Cargando tus salones..."}</p>
          )}
          {errorOpciones && <p role="alert">{errorOpciones}</p>}

          {!cargandoOpciones && !errorOpciones && opciones.length === 0 && (
            <p className="sin-datos">
              {eligeActividad ? (
                <>
                  Aún no tienes actividades. <a href="/salones/crear#catalogo-plantillas">Crea una</a> desde el
                  catálogo de plantillas.
                </>
              ) : (
                <>
                  Aún no tienes salones ni tutorías. <a href="/salones/crear">Crea uno</a> para publicar.
                </>
              )}
            </p>
          )}

          {!cargandoOpciones && opciones.length > 0 && (
            <div className="form-group">
              <label htmlFor="publicar-opcion">{eligeActividad ? "Actividad" : "Salón o tutoría"}</label>
              <select
                id="publicar-opcion"
                value={elegidoId}
                onChange={(e) => setElegidoId(e.target.value)}
                required
              >
                <option value="">{eligeActividad ? "Elige una actividad" : "Elige un salón o tutoría"}</option>
                {eligeActividad
                  ? opciones.map((a) => {
                      const yaPublicada = actividadesYaPublicadas.includes(a.id);
                      return (
                        <option key={a.id} value={a.id} disabled={yaPublicada}>
                          {a.title}
                          {yaPublicada ? " (ya publicada aquí)" : ""}
                        </option>
                      );
                    })
                  : opciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {tipoLegible(s.type)}
                      </option>
                    ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="publicar-fecha">Fecha y hora límite</label>
            <input
              id="publicar-fecha"
              type="datetime-local"
              value={fechaLimite}
              min={aValorLocal(new Date())}
              onChange={(e) => setFechaLimite(e.target.value)}
              required
            />
          </div>

          {error && <p role="alert">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" disabled={publicando || cargandoOpciones || opciones.length === 0}>
              {publicando ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
