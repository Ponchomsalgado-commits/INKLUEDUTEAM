import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { obtenerMisSalones, obtenerMiembros } from "../services/classroomService";
import {
  crearActividad,
  obtenerActividad,
  obtenerMisActividades,
  obtenerPlantillas,
  publicarActividad,
} from "../services/activityService";
import SubirMaterial from "../components/SubirMaterial";
import { colorDeSalon } from "../components/shared/colorSalon";
import { mensajeDeError } from "../components/shared/errorHandler";
import "../styles/grupos.css";

// Detalle de un salón: alumnos, actividades/calificaciones y creación de actividades.
// Una actividad del salón lleva nombre y, al menos, una plantilla de la galería o material didáctico.
// Las plantillas se diseñan en el Editor (contentJson = { preguntas } validado por su schemaJson);
// aquí nunca se inventa contenido: se copia el de la plantilla elegida.

const PESTANAS = [
  { clave: "alumnos", texto: "Alumnos" },
  { clave: "notas", texto: "Actividad / calificación" },
  { clave: "crear", texto: "Crear actividad" },
];

const REGLA = "Agrega una plantilla, material didáctico o ambos.";

export default function Clase() {
  const { id } = useParams();
  const [params] = useSearchParams();
  // ?plantilla=ID (del catálogo) solo sirve para abrir el editor con ese diseño;
  // ?actividad=ID (al volver del editor) deja esa plantilla de la galería elegida
  const plantillaInicial = params.get("plantilla");
  const actividadInicial = params.get("actividad");

  const [pestana, setPestana] = useState(params.get("pestana") === "crear" ? "crear" : "alumnos");
  const [cargando, setCargando] = useState(true);
  const [salon, setSalon] = useState(null);
  const [color, setColor] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [copiado, setCopiado] = useState(false);

  // formulario "Crear actividad"
  const [seleccion, setSeleccion] = useState(actividadInicial ?? "");
  const [nombre, setNombre] = useState("");
  const [materiales, setMateriales] = useState([]);
  const [instrucciones, setInstrucciones] = useState("");
  const [fecha, setFecha] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState("");
  // Si la actividad se creó pero falló la publicación, reintentar con lo mismo no la duplica
  const [creada, setCreada] = useState(null);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      const [salones, alumnos, catalogo, propias] = await Promise.all([
        obtenerMisSalones().catch(() => []),
        obtenerMiembros(id).catch(() => []),
        obtenerPlantillas(),
        obtenerMisActividades().catch(() => []),
      ]);
      if (!vigente) return;
      const lista = Array.isArray(salones) ? salones : [];
      setSalon(lista.find((s) => s.id === id) ?? null);
      setColor(colorDeSalon(lista, id));
      setMiembros(Array.isArray(alumnos) ? alumnos : []);
      setPlantillas(catalogo);
      const misActividades = Array.isArray(propias) ? propias : [];
      setActividades(misActividades);
      const inicial = misActividades.find((a) => a.id === actividadInicial);
      if (inicial) setNombre((actual) => actual || inicial.title);
      setCargando(false);
    };
    cargar();
    return () => {
      vigente = false;
    };
  }, [id, actividadInicial]);

  const plantillaElegida = actividades.find((a) => a.id === seleccion) ?? null;

  // Al editor se vuelve a este salón con la plantilla recién guardada ya elegida
  const volver = `/grupos/${id}`;
  const idDiseno = plantillaInicial ?? plantillas[0]?.id;
  const enlaceNueva = idDiseno
    ? `/actividades/nueva?plantilla=${idDiseno}&volver=${encodeURIComponent(volver)}`
    : null;
  const enlaceEditar = plantillaElegida
    ? `/actividades/editar?actividad=${plantillaElegida.id}&volver=${encodeURIComponent(volver)}`
    : null;

  const materialListo = materiales.filter((m) => m.estado === "listo");
  const llevaMaterial = materialListo.length > 0;
  const faltaContenido = !plantillaElegida && !llevaMaterial;

  const handleSeleccion = (valor) => {
    const anterior = actividades.find((a) => a.id === seleccion);
    const elegida = actividades.find((a) => a.id === valor);
    setSeleccion(valor);
    // El nombre sugerido sigue a la plantilla mientras el profesor no lo haya cambiado
    if (elegida && (!nombre.trim() || nombre === anterior?.title)) setNombre(elegida.title);
    setError("");
    setResultado("");
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(salon.joinCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // si el navegador no deja copiar, el código sigue visible en pantalla
    }
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    setError("");
    setResultado("");

    const titulo = nombre.trim();
    if (!titulo) {
      setError("Escribe el nombre de la actividad.");
      return;
    }
    if (faltaContenido) {
      setError(`La actividad necesita una plantilla o material didáctico. ${REGLA}`);
      return;
    }
    if (materiales.some((m) => m.estado === "subiendo")) {
      setError("Espera a que termine de subirse el material.");
      return;
    }
    if (materiales.some((m) => m.estado === "error")) {
      setError("Reintenta o quita los archivos que no se pudieron subir.");
      return;
    }

    const claves = materialListo.map((m) => m.key);
    const firma = JSON.stringify([seleccion, titulo, claves]);

    setPublicando(true);
    let activityId = creada?.firma === firma ? creada.id : null;
    let paso = "crear";
    try {
      if (!activityId && plantillaElegida && claves.length === 0 && titulo === plantillaElegida.title) {
        // Sin cambios sobre la plantilla de la galería: se publica tal cual
        activityId = plantillaElegida.id;
      } else if (!activityId && plantillaElegida) {
        // Copia propia con el contenido de la plantilla (ya válido) y su material más el nuevo
        const origen = await obtenerActividad(plantillaElegida.id);
        const copia = await crearActividad({
          templateId: origen.templateId,
          title: titulo,
          content: origen.contentJson,
          mediaUrls: [...new Set([...(origen.mediaUrls ?? []), ...claves])],
        });
        activityId = copia.id;
        setCreada({ firma, id: copia.id });
      } else if (!activityId) {
        // Solo material: el servidor hoy exige plantilla, así que responde 400 y se avisa abajo
        const copia = await crearActividad({ title: titulo, content: {}, mediaUrls: claves });
        activityId = copia.id;
        setCreada({ firma, id: copia.id });
      }

      paso = "publicar";
      await publicarActividad({
        activityId,
        classroomId: id,
        dueDate: fecha ? new Date(`${fecha}T23:59:59`).toISOString() : undefined,
      });
      setResultado(`Actividad "${titulo}" publicada en el salón.`);
      setNombre("");
      setSeleccion("");
      setMateriales([]);
      setInstrucciones("");
      setFecha("");
      setCreada(null);
    } catch (err) {
      const estado = err.response?.status;
      if (paso === "publicar") {
        const guardada = " La actividad ya quedó guardada en tu galería.";
        setError(
          estado === 404
            ? `La publicación en salones estará disponible pronto.${guardada}`
            : mensajeDeError(err, "No se pudo publicar la actividad") + guardada,
        );
      } else if (!plantillaElegida && estado === 400) {
        setError(
          "Por ahora el servidor no admite actividades solo con material: necesitan una plantilla. " +
            "Elige una de tu galería o crea una nueva. Tus archivos ya quedaron guardados en la galería.",
        );
      } else {
        setError(mensajeDeError(err, "No se pudo crear la actividad"));
      }
    } finally {
      setPublicando(false);
    }
  };

  if (cargando) {
    return (
      <div className="gr-pagina">
        <p role="status" className="vacio">Cargando salón...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="gr-pagina">
        <Link to="/grupos" className="volver">← Volver a grupos</Link>
        <p className="vacio">No encontramos este salón.</p>
      </div>
    );
  }

  return (
    <div className="gr-pagina">
      <Link to="/grupos" className="volver">← Volver a grupos</Link>

      <div className="pestanas" role="tablist" aria-label="Secciones del salón">
        {PESTANAS.map((p) => (
          <button
            key={p.clave}
            type="button"
            role="tab"
            id={`clase-tab-${p.clave}`}
            aria-selected={pestana === p.clave}
            aria-controls={`clase-panel-${p.clave}`}
            onClick={() => setPestana(p.clave)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      <div className="gr-banner" style={{ background: color }}>
        <h1>{salon.name}</h1>
      </div>
      <div className="gr-info-clase">
        <div>
          <small>Nombre del salón</small>
          <strong>{salon.name}</strong>
        </div>
        <div>
          <small>Tipo</small>
          <strong>{salon.type === "GRUPO" ? "Grupo" : "Individual"}</strong>
        </div>
        <div>
          <small>Código</small>
          <strong>{salon.joinCode}</strong>{" "}
          <button type="button" className="boton-chico" onClick={handleCopiar}>
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <section
        id="clase-panel-alumnos"
        role="tabpanel"
        aria-labelledby="clase-tab-alumnos"
        hidden={pestana !== "alumnos"}
      >
        {miembros.length === 0 ? (
          <p className="vacio">Aún no hay alumnos unidos. Comparte el código del salón.</p>
        ) : (
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
      </section>

      <section
        id="clase-panel-notas"
        role="tabpanel"
        aria-labelledby="clase-tab-notas"
        hidden={pestana !== "notas"}
      >
        <p className="vacio">Aún no hay actividades publicadas ni calificaciones.</p>
      </section>

      <section
        id="clase-panel-crear"
        role="tabpanel"
        aria-labelledby="clase-tab-crear"
        hidden={pestana !== "crear"}
      >
        <form className="tarjeta gr-form" onSubmit={handlePublicar}>
          <p
            id="clase-regla"
            className={`gr-regla${faltaContenido ? " pendiente" : ""}`}
          >
            {REGLA}{" "}
            {faltaContenido ? "Aún falta una de las dos." : "Listo: la actividad ya lleva contenido."}
          </p>

          <label className="campo" htmlFor="clase-nombre">
            <span>Nombre de la actividad</span>
            <input
              id="clase-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>

          <div className="campo-bloque">
            <label className="campo" htmlFor="clase-plantilla">
              <span>Plantilla de tu galería (opcional)</span>
              <select
                id="clase-plantilla"
                value={seleccion}
                onChange={(e) => handleSeleccion(e.target.value)}
                aria-describedby="clase-regla"
              >
                <option value="">Sin plantilla</option>
                {actividades.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
            {actividades.length === 0 && (
              <p className="vacio">Aún no tienes plantillas en tu galería.</p>
            )}
            <div className="gr-acciones-plantilla">
              {enlaceNueva && (
                <Link className="boton boton-sec" to={enlaceNueva}>
                  Crear una plantilla nueva
                </Link>
              )}
              {enlaceEditar && (
                <Link className="boton boton-sec" to={enlaceEditar}>
                  Editar esta plantilla
                </Link>
              )}
            </div>
          </div>

          <SubirMaterial
            materiales={materiales}
            onChange={setMateriales}
            titulo="Material didáctico (opcional)"
            maximo={10}
            galeria
          />

          <label className="campo" htmlFor="clase-instrucciones">
            <span>Instrucciones (opcional)</span>
            <textarea
              id="clase-instrucciones"
              rows={3}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Explica en pocos pasos qué debe hacer el alumno."
              aria-describedby="clase-instrucciones-nota"
            />
            <small id="clase-instrucciones-nota" className="gr-nota">
              Aún no se envían al servidor: se activarán con la publicación en salones.
            </small>
          </label>

          <label className="campo" htmlFor="clase-fecha">
            <span>Fecha de entrega (opcional)</span>
            <input
              id="clase-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>

          <button type="submit" className="boton" disabled={publicando}>
            {publicando ? "Publicando..." : "Crear actividad"}
          </button>
          {error && <p role="alert" className="mensaje error">{error}</p>}
          {resultado && <p role="status" className="mensaje exito">{resultado}</p>}
        </form>
      </section>
    </div>
  );
}
