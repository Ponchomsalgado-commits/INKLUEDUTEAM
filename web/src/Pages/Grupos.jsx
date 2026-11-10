import { useEffect, useState } from "react";
import { Link } from "react-router";
import { obtenerMisSalones, obtenerMiembros } from "../services/classroomService";
import { COLORES_GRUPO } from "../components/shared/colorSalon";
import "../styles/grupos.css";

// T2101: Pantalla "Grupos": salones de tipo GRUPO, su código y la lista de usuarios unidos.
// Los salones individuales están en /individual. Crear un salón se hace en /salones/crear.
// Cada salón abre su detalle en /grupos/:id, donde también se crean sus actividades.

export default function Grupos() {
  const [salones, setSalones] = useState([]);
  const [cargandoSalones, setCargandoSalones] = useState(true);

  // salón abierto y sus miembros
  const [salonAbierto, setSalonAbierto] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [cargandoMiembros, setCargandoMiembros] = useState(false);

  const [codigoCopiado, setCodigoCopiado] = useState("");

  useEffect(() => {
    obtenerMisSalones()
     .then((data) => {
      // Solo aceptamos arreglos y nos quedamos con los grupos
      const lista = Array.isArray(data) ? data : [];
      setSalones(lista.filter((s) => s.type === "GRUPO"));
    })
      // Si la lista no se puede cargar se muestra como vacía en vez del error
      .catch(() => setSalones([]))
      .finally(() => setCargandoSalones(false));
  }, []);

  const handleVerMiembros = async (salon) => {
    if (salonAbierto === salon.id) {
      setSalonAbierto(null);
      return;
    }

    setSalonAbierto(salon.id);
    setMiembros([]);
    setCargandoMiembros(true);

    try {
      const data = await obtenerMiembros(salon.id);
      setMiembros(Array.isArray(data) ? data : []);
    } catch {
      // Si la lista no se puede cargar se muestra "Sin miembros" en vez del error
      setMiembros([]);
    } finally {
      setCargandoMiembros(false);
    }
  };

  const handleCopiar = async (codigo) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(codigo);
      setTimeout(() => setCodigoCopiado(""), 2000);
    } catch {
      // si el navegador no deja copiar, el código sigue visible en pantalla
    }
  };

  return (
    <div className="gr-pagina">
      <div className="gr-cab">
        <h1 className="titulo-pagina">Mis grupos</h1>
        <Link to="/salones/crear" className="boton">
          + Crear grupo
        </Link>
      </div>
      <p className="gr-sub">Tus salones grupales, su código para unirse y los alumnos inscritos.</p>

      <section aria-labelledby="lista-salones">
        <h2 id="lista-salones" className="gr-oculto">Tus grupos</h2>

        {cargandoSalones && <p role="status" className="vacio">Cargando grupos...</p>}
        {!cargandoSalones && salones.length === 0 && (
          <p className="vacio">No hay grupos aún</p>
        )}

        <ul className="gr-rejilla">
          {salones.map((salon, i) => (
            <li key={salon.id} className="gr-item">
              <div className="gr-tarjeta">
                <div
                  className="gr-lado"
                  style={{ background: COLORES_GRUPO[i % COLORES_GRUPO.length] }}
                  aria-hidden="true"
                >
                  👥
                </div>
                <div className="gr-info">
                  <h3>
                    <Link to={`/grupos/${salon.id}`} className="gr-enlace-salon">
                      {salon.name}
                    </Link>
                  </h3>
                  <p>Tipo: Grupo</p>
                  {salon._count?.members != null && <p>Alumnos: {salon._count.members}</p>}
                  <p className="gr-codigo">
                    Código: <strong>{salon.joinCode}</strong>
                    <button
                      type="button"
                      className="boton-chico"
                      onClick={() => handleCopiar(salon.joinCode)}
                    >
                      {codigoCopiado === salon.joinCode ? "¡Copiado!" : "Copiar"}
                    </button>
                  </p>
                  <div className="gr-acciones">
                    <Link to={`/grupos/${salon.id}?pestana=crear`} className="boton gr-miembros-boton">
                      Crear actividad
                    </Link>
                    <button
                      type="button"
                      className="boton boton-sec gr-miembros-boton"
                      aria-expanded={salonAbierto === salon.id}
                      onClick={() => handleVerMiembros(salon)}
                    >
                      {salonAbierto === salon.id ? "Ocultar usuarios" : "Ver usuarios unidos"}
                    </button>
                  </div>
                </div>
              </div>

              {salonAbierto === salon.id && (
                <div className="gr-miembros">
                  {cargandoMiembros && <p role="status" className="vacio">Cargando usuarios...</p>}
                  {!cargandoMiembros && miembros.length === 0 && (
                    <p className="vacio">Sin miembros</p>
                  )}
                  {miembros.length > 0 && (
                    <ul className="gr-alumnos">
                      {miembros.map((m) => (
                        <li key={m.student.id} className="gr-alumno">
                          <span className="gr-avatar" aria-hidden="true">
                            {(m.student.email || "?").slice(0, 2).toUpperCase()}
                          </span>
                          <span>{m.student.email}</span>
                          <small>se unió el {new Date(m.joinedAt).toLocaleDateString()}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
