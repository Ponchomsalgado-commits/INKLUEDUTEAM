import { useEffect, useState } from "react";
import { Link } from "react-router";
import { crearSalon } from "../services/classroomService";
import { obtenerPlantillas } from "../services/activityService";
import { mensajeDeError } from "../components/shared/errorHandler";
import { ICONOS_SKIN } from "../components/shared/iconosSkin";
import "../styles/grupos.css";

// Pantalla exclusiva para crear un salón y, debajo, el catálogo de plantillas.

// Las actividades se crean dentro del salón: con un salón recién creado se abre su pestaña
// "Crear actividad" con la plantilla elegida; sin salón se manda a elegir uno.
function enlacePlantilla(plantillaId, salon) {
  if (!salon) return "/grupos";
  return `/grupos/${salon.id}?${new URLSearchParams({ pestana: "crear", plantilla: plantillaId })}`;
}

export default function CrearSalones() {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("GRUPO");
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");
  const [recienCreado, setRecienCreado] = useState(null);
  const [copiado, setCopiado] = useState(false);
//Metodos para obtener las plantillas de minijuego desde el backend y mostrarlas en la pantalla de creación de salones.(victor)
const [plantillas, setPlantillas] = useState([]);
const [cargandoPlantillas, setCargandoPlantillas] = useState(true);

  useEffect(() => {
    obtenerPlantillas()
      .then(setPlantillas)
      .finally(() => setCargandoPlantillas(false));
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorCrear("");
    setRecienCreado(null);
    setCreando(true);

    try {
      const nuevo = await crearSalon({ name: nombre.trim(), type: tipo });
      setRecienCreado(nuevo);
      setNombre("");
      setTipo("GRUPO");
    } catch (error) {
      setErrorCrear(mensajeDeError(error, "No se pudo crear el salón"));
    } finally {
      setCreando(false);
    }
  };

  const handleCopiar = async (codigo) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // si el navegador no deja copiar, el código sigue visible en pantalla
    }
  };

  return (
    <div className="gr-pagina">
      <Link to="/grupos" className="volver">
        ← Volver a grupos
      </Link>
      <h1 className="titulo-pagina">Crear salón</h1>

      <form className="tarjeta gr-form" onSubmit={handleCrear}>
        <label className="campo" htmlFor="salon-nombre">
          <span>Nombre del salón</span>
          <input
            id="salon-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. 3°A Matemáticas"
            required
          />
        </label>
        <label className="campo" htmlFor="salon-tipo">
          <span>Tipo</span>
          <select id="salon-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="GRUPO">Grupo</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </label>
        <button type="submit" className="boton" disabled={creando || !nombre.trim()}>
          {creando ? "Creando..." : "Crear salón"}
        </button>
        {errorCrear && <p role="alert" className="mensaje error">{errorCrear}</p>}

        {recienCreado && (
          <section className="gr-nuevo" role="status" aria-labelledby="salon-nuevo-titulo">
            <h3 id="salon-nuevo-titulo">Salón "{recienCreado.name}" creado</h3>
            <p>Comparte este código con tus alumnos para que se unan desde la app:</p>
            <div className="gr-codigo">
              <strong className="gr-codigo-grande">{recienCreado.joinCode}</strong>
              <button
                type="button"
                className="boton-chico"
                onClick={() => handleCopiar(recienCreado.joinCode)}
              >
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </section>
        )}
      </form>

      <section aria-labelledby="catalogo-plantillas">
        <h2 id="catalogo-plantillas" className="seccion-titulo">Catálogo de plantillas</h2>
        <p className="gr-sub">Plantillas disponibles para tus salones.</p>

        {cargandoPlantillas && <p role="status" className="vacio">Cargando plantillas...</p>}
        {!cargandoPlantillas && plantillas.length === 0 && (
          <p className="vacio">No hay plantillas aún</p>
        )}

        <ul className="gr-plantillas">
          {plantillas.map((plantilla) => (
            <li key={plantilla.id} className="gr-plantilla">
              <span className="gr-plantilla-icono" aria-hidden="true">
                {ICONOS_SKIN[plantilla.skin] ?? "🎮"}
              </span>
              <strong>{plantilla.displayName}</strong>
              <small>{plantilla.type}</small>

              <ul className="gr-campos">
                {Object.entries(plantilla.schemaJson?.fields ?? {}).map(([clave, campo]) => (
                  <li key={clave}>
                    {campo.type === "array" ? `${clave}: de ${campo.minItems} a ${campo.maxItems}` : clave}
                  </li>
                ))}
              </ul>
              <Link to={enlacePlantilla(plantilla.id, recienCreado)} className="boton boton-sec">
                {recienCreado ? "Usar plantilla" : "Elegir salón"}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
