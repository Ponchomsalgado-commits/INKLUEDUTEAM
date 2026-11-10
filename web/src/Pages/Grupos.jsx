import { useEffect, useState } from "react";
import { Link } from "react-router";
import { mensajeDeError } from "../components/shared/errorHandler";
import { obtenerMisSalones, obtenerMiembros } from "../services/classroomService";

// T2101: Pantalla "Grupos": salones de tipo GRUPO, su código y la lista de usuarios unidos.
// Los salones individuales están en /individual. Crear un salón se hace en /salones/crear.

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
    <div className="pagina salones-container salones-ancho">
      <div className="pagina-encabezado">
        <h1>Grupos</h1>
        <p>Tus salones grupales, su código para unirse y los alumnos inscritos.</p>
      </div>

      <section aria-labelledby="lista-salones" className="panel seccion-salones">
        <div className="encabezado-seccion">
          <h2 id="lista-salones" className="panel-titulo">Tus grupos</h2>
          <Link to="/salones/crear" className="btn-crear">
            + Crear grupo
          </Link>
        </div>

        {cargandoSalones && <p role="status">Cargando grupos...</p>}
        {!cargandoSalones && salones.length === 0 && (
          <p className="sin-datos">No hay grupos aún</p>
        )}

        <ul className="lista-salones">
          {salones.map((salon) => (
            <li key={salon.id} className="salon-card">
              <div className="salon-info">
                <strong>{salon.name}</strong>
                <span className="salon-tipo">Grupo</span>
              </div>

              <div className="salon-codigo">
                <span>Código:</span>
                <code>{salon.joinCode}</code>
                <button type="button" onClick={() => handleCopiar(salon.joinCode)}>
                  {codigoCopiado === salon.joinCode ? "¡Copiado!" : "Copiar"}
                </button>
              </div>

              <button
                type="button"
                className="ver-miembros"
                aria-expanded={salonAbierto === salon.id}
                onClick={() => handleVerMiembros(salon)}
              >
                {salonAbierto === salon.id ? "Ocultar usuarios" : "Ver usuarios unidos"}
                {salon._count?.members != null && ` (${salon._count.members})`}
              </button>

              {salonAbierto === salon.id && (
                <div className="miembros">
                  {cargandoMiembros && <p role="status">Cargando usuarios...</p>}
                  {!cargandoMiembros && miembros.length === 0 && (
                    <p className="sin-datos">Sin miembros</p>
                  )}
                  {miembros.length > 0 && (
                    <ul>
                      {miembros.map((m) => (
                        <li key={m.student.id}>
                          {m.student.email}
                          <small> · se unió el {new Date(m.joinedAt).toLocaleDateString()}</small>
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
