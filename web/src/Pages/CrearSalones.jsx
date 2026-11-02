import { useEffect, useState } from "react";
import { crearSalon } from "../services/classroomService";
import { obtenerPlantillas } from "../services/activityService";
import { mensajeDeError } from "../components/errorHandler";

// Pantalla exclusiva para crear un salón y, debajo, el catálogo de plantillas.

const ICONOS_SKIN = { rana_nenufar: "🐸", mariposa_flor: "🦋" };

// Enlace al editor (CrearActividad); si ya se creó un salón, la actividad se publicará ahí
function enlaceEditor(plantillaId, salon) {
  const params = new URLSearchParams({ plantilla: plantillaId });
  if (salon) {
    params.set("salon", salon.id);
    params.set("salonNombre", salon.name);
  }
  return `/salones/crear/actividad?${params}`;
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
    <div className="tarjeta salones-container salones-ancho">
      <a href="/salones" className="enlace-volver">
        ← Volver a Mis salones
      </a>

      <form className="crear-salon crear-salon-horizontal seccion-salones" onSubmit={handleCrear}>
        <h2>Crear salón</h2>
        <div className="crear-salon-campos">
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
        </div>
        {errorCrear && <p role="alert">{errorCrear}</p>}

        {recienCreado && (
          <section className="codigo-nuevo" role="status" aria-labelledby="salon-nuevo-titulo">
            <h3 id="salon-nuevo-titulo">Salón "{recienCreado.name}"" creado</h3>
            <p>Comparte este código con tus alumnos para que se unan desde la app:</p>
            <div className="salon-codigo">
              <code className="codigo-grande">{recienCreado.joinCode}</code>
              <button type="button" onClick={() => handleCopiar(recienCreado.joinCode)}>
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </section>
        )}
      </form>

      <section aria-labelledby="catalogo-plantillas">
        <h3 id="catalogo-plantillas">Catálogo de plantillas</h3>
        <p className="catalogo-subtitulo">Plantillas disponibles para tus salones.</p>

        {cargandoPlantillas && <p role="status">Cargando plantillas...</p>}
        {!cargandoPlantillas && plantillas.length === 0 && (
          <p className="sin-datos">No hay plantillas aún</p>
        )}

        <ul className="catalogo-plantillas">
          {plantillas.map((plantilla) => (
            <li key={plantilla.id} className="plantilla-card">
              <span className="plantilla-icono" aria-hidden="true">
                {ICONOS_SKIN[plantilla.skin] ?? "🎮"}
              </span>
              <strong>{plantilla.display_name}</strong>
              <span className="salon-tipo">{plantilla.type}</span>
             
              <ul className="plantilla-campos">
                {Object.entries(plantilla.schema_json?.fields ?? {}).map(([clave, campo]) => (
                  <li key={clave}>{campo.label}</li>
                ))}
              </ul>
              <a href={enlaceEditor(plantilla.id, recienCreado)} className="plantilla-usar">
                Usar plantilla
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
