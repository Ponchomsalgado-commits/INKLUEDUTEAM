import { useCallback, useEffect, useState } from "react";
import { obtenerProgresoSalon } from "../services/assignmentService";
import { mensajeDeError } from "./shared/errorHandler";
import { formatearFechaCorta, formatearFechaHora } from "./shared/fechas";

// Tablero de seguimiento: alumnos × actividades publicadas con su estado.
// Se actualiza solo cada 15 s (sin recargar la app) y con el botón "Actualizar".

const INTERVALO_MS = 15000;

const ESTADOS = {
  completado: { texto: "Completado", icono: "✔" },
  pendiente: { texto: "Pendiente", icono: "○" },
  atrasado: { texto: "Atrasado", icono: "!" },
};

// hrefAlumno(student) devuelve el enlace al detalle del alumno dentro del salón
export default function TableroSeguimiento({ salonId, version = 0, hrefAlumno }) {
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  // Sin cambios de estado síncronos: todo ocurre al responder la API
  const cargar = useCallback(
    () =>
      obtenerProgresoSalon(salonId)
        .then((data) => {
          setProgreso(data);
          setError("");
        })
        .catch((err) => setError(mensajeDeError(err, "No se pudo actualizar el tablero.")))
        .finally(() => {
          setCargando(false);
          setActualizando(false);
        }),
    [salonId],
  );

  useEffect(() => {
    cargar();
    const intervalo = setInterval(() => {
      // Si la pestaña no está visible no se consulta; se retoma al volver
      if (!document.hidden) cargar();
    }, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [cargar, version]);

  const handleActualizar = () => {
    setActualizando(true);
    cargar();
  };

  const asignaciones = progreso?.asignaciones ?? [];
  const alumnos = progreso?.alumnos ?? [];

  return (
    <section aria-labelledby="tablero-titulo" className="detalle-seccion">
      <div className="encabezado-seccion">
        <h3 id="tablero-titulo">Tablero de seguimiento</h3>
        <button type="button" className="btn-secundario" onClick={handleActualizar} disabled={actualizando}>
          {actualizando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
      <p className="catalogo-subtitulo">
        Se actualiza solo cada 15 segundos.
        {progreso?.generadoEn && ` Última actualización: ${formatearFechaHora(progreso.generadoEn)}.`}
      </p>

      {cargando && <p role="status">Cargando tablero...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && progreso && alumnos.length === 0 && (
        <p className="sin-datos">Cuando tus alumnos se unan, verás aquí su avance.</p>
      )}
      {!cargando && progreso && alumnos.length > 0 && asignaciones.length === 0 && (
        <p className="sin-datos">Publica una actividad para empezar a ver el avance de tus alumnos.</p>
      )}

      {alumnos.length > 0 && asignaciones.length > 0 && (
        <>
          <ul className="tablero-leyenda" aria-label="Significado de los estados">
            {Object.entries(ESTADOS).map(([clave, { texto, icono }]) => (
              <li key={clave} className={`estado estado-${clave}`}>
                <span aria-hidden="true">{icono}</span> {texto}
              </li>
            ))}
          </ul>
          <div className="tablero-scroll" tabIndex={0} role="region" aria-labelledby="tablero-titulo">
            <table className="tablero">
              <caption className="solo-lectores">Estado de cada alumno en cada actividad publicada</caption>
              <thead>
                <tr>
                  <th scope="col">Alumno</th>
                  {asignaciones.map((a) => (
                    <th key={a.id} scope="col">
                      {a.title}
                      <small>Límite: {formatearFechaCorta(a.dueDate)}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alumnos.map(({ student, resultados }) => (
                  <tr key={student.id}>
                    <th scope="row">
                      {hrefAlumno ? <a href={hrefAlumno(student)}>{student.email}</a> : student.email}
                    </th>
                    {asignaciones.map((a) => {
                      const r = resultados.find((x) => x.assignmentId === a.id);
                      const estado = ESTADOS[r?.estado] ? r.estado : "pendiente";
                      return (
                        <td key={a.id}>
                          <span className={`estado estado-${estado}`}>
                            <span aria-hidden="true">{ESTADOS[estado].icono}</span> {ESTADOS[estado].texto}
                          </span>
                          {r?.score != null && (
                            <small>
                              {r.score} de {r.total} aciertos
                            </small>
                          )}
                          {r?.submittedAt && <small>{formatearFechaHora(r.submittedAt)}</small>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
