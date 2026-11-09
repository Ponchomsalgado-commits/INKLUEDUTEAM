import { useEffect, useState } from "react";
import { obtenerDetalleAlumno } from "../services/assignmentService";
import ListaInsignias from "../components/ListaInsignias";
import { mensajeDeError } from "../components/shared/errorHandler";
import { formatearFechaHora } from "../components/shared/fechas";
import { rutaDetalleSalon } from "../components/shared/rutasSalon";

// Detalle de un alumno dentro de un salón (Sprint 6): insignias, intentos y
// las preguntas en las que más necesita apoyo.
// URL: /salones/alumno?salon=ID&alumno=ID[&desde=tutorias]

export default function DetalleAlumno() {
  const params = new URLSearchParams(window.location.search);
  const salonId = params.get("salon");
  const alumnoId = params.get("alumno");
  const desde = params.get("desde") === "tutorias" ? "tutorias" : undefined;

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(Boolean(salonId && alumnoId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!salonId || !alumnoId) return;
    obtenerDetalleAlumno(salonId, alumnoId)
      .then(setDetalle)
      .catch((err) =>
        setError(
          err.response?.status === 404 || err.response?.status === 400
            ? "No encontramos a ese alumno en este salón."
            : mensajeDeError(err, "No se pudo cargar el avance del alumno."),
        ),
      )
      .finally(() => setCargando(false));
  }, [salonId, alumnoId]);

  const volver = salonId ? (
    <a href={rutaDetalleSalon(salonId, { desde, vista: "alumnos" })} className="enlace-volver">
      ← Volver al salón
    </a>
  ) : (
    <a href="/salones" className="enlace-volver">
      ← Volver a Mis salones
    </a>
  );

  if (cargando) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <p role="status">Cargando avance del alumno...</p>
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        {volver}
        <p className="sin-datos">{error || "No encontramos a ese alumno en este salón."}</p>
      </div>
    );
  }

  const { student, badges = [], intentos = [], preguntasFalladas = [] } = detalle;

  return (
    <div className="tarjeta salones-container salones-ancho">
      {volver}
      <h2>{student.email}</h2>

      <section className="detalle-seccion" aria-labelledby="alumno-insignias">
        <h3 id="alumno-insignias">Insignias obtenidas</h3>
        <ListaInsignias
          insignias={badges}
          conDescripcion
          textoVacio="Aún no tiene insignias. Llegarán conforme complete actividades."
        />
      </section>

      <section className="detalle-seccion" aria-labelledby="alumno-intentos">
        <h3 id="alumno-intentos">Actividades resueltas</h3>
        {intentos.length === 0 ? (
          <p className="sin-datos">Todavía no resuelve actividades en este salón.</p>
        ) : (
          <div className="tablero-scroll">
            <table className="tablero tabla-simple">
              <thead>
                <tr>
                  <th scope="col">Actividad</th>
                  <th scope="col">Aciertos</th>
                  <th scope="col">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {intentos.map((i) => (
                  <tr key={i.id}>
                    <td>{i.activityTitle}</td>
                    <td>
                      {i.score} de {i.total}
                    </td>
                    <td>{formatearFechaHora(i.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detalle-seccion" aria-labelledby="alumno-dificultades">
        <h3 id="alumno-dificultades">Preguntas que más se le dificultan</h3>
        <p className="catalogo-subtitulo">
          Una pista para saber dónde darle un poco más de apoyo o repasar juntos.
        </p>
        {preguntasFalladas.length === 0 ? (
          <p className="sin-datos">
            {intentos.length === 0
              ? "Cuando resuelva actividades, aquí verás en qué temas puedes apoyarle."
              : "¡Va muy bien! Por ahora no hay preguntas que se le dificulten."}
          </p>
        ) : (
          <ul className="lista-salones lista-dificultades">
            {preguntasFalladas.map((p) => (
              <li key={`${p.activityId}-${p.preguntaId}`} className="salon-card">
                <strong>{p.pregunta || "Pregunta sin texto"}</strong>
                <p className="actividad-detalle">
                  Actividad: {p.activityTitle}
                  <br />
                  Falló {p.fallos} de {p.respuestas} {p.respuestas === 1 ? "vez" : "veces"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
