import { useEffect, useState } from "react";
import {
  crearSalon,
  obtenerMisSalones,
  obtenerMiembros,
} from "../services/classroomService";

// T2101: Pantalla "Mis salones": crear salón, ver código, ver lista de usuarios unidos.

function mensajeDeError(error, porDefecto) {
  if (error.response?.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (error.response?.status === 403) return "Solo los profesores pueden gestionar salones.";
  const errorBackend = error.response?.data?.message;
  if (Array.isArray(errorBackend)) return errorBackend.join(", ");
  return errorBackend || porDefecto;
}

export default function MisSalones() {
  const [salones, setSalones] = useState([]);
  const [cargandoSalones, setCargandoSalones] = useState(true);
  const [errorLista, setErrorLista] = useState("");

  // formulario de crear salón
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("GRUPO");
  const [creando, setCreando] = useState(false);
  const [mensajeCrear, setMensajeCrear] = useState("");

  // salón abierto y sus miembros
  const [salonAbierto, setSalonAbierto] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [cargandoMiembros, setCargandoMiembros] = useState(false);
  const [errorMiembros, setErrorMiembros] = useState("");

  const [codigoCopiado, setCodigoCopiado] = useState("");

  useEffect(() => {
    obtenerMisSalones()
      .then((data) => setSalones(data))
      .catch((error) =>
        setErrorLista(mensajeDeError(error, "No se pudieron cargar tus salones"))
      )
      .finally(() => setCargandoSalones(false));
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setMensajeCrear("");
    setCreando(true);

    try {
      const nuevo = await crearSalon({ name: nombre.trim(), type: tipo });
      setSalones((prev) => [{ ...nuevo, _count: { members: 0 } }, ...prev]);
      setMensajeCrear(`Salón creado. Código: ${nuevo.joinCode}`);
      setNombre("");
      setTipo("GRUPO");
    } catch (error) {
      setMensajeCrear(mensajeDeError(error, "No se pudo crear el salón"));
    } finally {
      setCreando(false);
    }
  };

  const handleVerMiembros = async (salon) => {
    if (salonAbierto === salon.id) {
      setSalonAbierto(null);
      return;
    }

    setSalonAbierto(salon.id);
    setMiembros([]);
    setErrorMiembros("");
    setCargandoMiembros(true);

    try {
      const data = await obtenerMiembros(salon.id);
      setMiembros(data);
    } catch (error) {
      setErrorMiembros(mensajeDeError(error, "No se pudo cargar la lista de usuarios"));
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
    <div className="salones-container">
      <h2>Mis salones</h2>

      <form className="crear-salon" onSubmit={handleCrear}>
        <h3>Crear salón</h3>
        <div className="form-group">
          <label htmlFor="salon-nombre">Nombre del salón</label>
          <input
            id="salon-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. 3°A Matemáticas"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="salon-tipo">Tipo</label>
          <select id="salon-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="GRUPO">Grupo</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </div>
        <button type="submit" disabled={creando || !nombre.trim()}>
          {creando ? "Creando..." : "Crear salón"}
        </button>
        {mensajeCrear && <p role="status">{mensajeCrear}</p>}
      </form>

      <section aria-labelledby="lista-salones">
        <h3 id="lista-salones">Tus salones</h3>

        {cargandoSalones && <p role="status">Cargando salones...</p>}
        {errorLista && <p role="alert">{errorLista}</p>}
        {!cargandoSalones && !errorLista && salones.length === 0 && (
          <p>Aún no tienes salones. Crea el primero arriba.</p>
        )}

        <ul className="lista-salones">
          {salones.map((salon) => (
            <li key={salon.id} className="salon-card">
              <div className="salon-info">
                <strong>{salon.name}</strong>
                <span className="salon-tipo">
                  {salon.type === "GRUPO" ? "Grupo" : "Individual"}
                </span>
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
                  {errorMiembros && <p role="alert">{errorMiembros}</p>}
                  {!cargandoMiembros && !errorMiembros && miembros.length === 0 && (
                    <p>Todavía nadie se ha unido. Comparte el código {salon.joinCode}.</p>
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
