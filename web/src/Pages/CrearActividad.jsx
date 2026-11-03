import { useEffect, useState } from "react";
import TemplateEditor from "../components/TemplateEditor";
import SubirMaterial from "../components/SubirMaterial";
import { preguntaVacia } from "../components/preguntaVacia";
import { obtenerPlantillas, crearActividad, publicarActividad } from "../services/activityService";
import { validarPreguntas } from "../components/validarPreguntas";
import { mensajeDeError } from "../components/errorHandler";

// Pantalla para editar una copia de la plantilla elegida en /salones/crear y,
// al guardar, publicarla en el salón recién creado..

export default function CrearActividad() {
  const params = new URLSearchParams(window.location.search);
  const plantillaId = params.get("plantilla");
  const salonId = params.get("salon");
  const salonNombre = params.get("salonNombre");

  const [plantilla, setPlantilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [fechaLimite, setFechaLimite] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  // Si se creó la actividad pero falló la publicación, reintentar no la duplica
  const [actividadCreada, setActividadCreada] = useState(null);

  useEffect(() => {
    obtenerPlantillas()
      .then((plantillas) => {
        const elegida = plantillas.find((p) => String(p.id) === plantillaId);
        if (!elegida) return;
        // Se edita una copia: el estado arranca vacío y la plantilla original no se toca
        const schemaPreguntas = elegida.schema_json.fields.preguntas;
        const totalOpciones = schemaPreguntas.items.opciones.minItems ?? 3;
        setPlantilla(elegida);
        setTitulo(elegida.display_name);
        setPreguntas(
          Array.from({ length: schemaPreguntas.minItems ?? 1 }, (_, i) =>
            preguntaVacia(`q${i + 1}`, totalOpciones),
          ),
        );
      })
      .finally(() => setCargando(false));
  }, [plantillaId]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    const errorPreguntas = validarPreguntas(preguntas);
    if (errorPreguntas) {
      setError(errorPreguntas);
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

    setGuardando(true);
    try {
      const actividad =
        actividadCreada ??
        (await crearActividad({
          templateId: plantilla.id,
          title: titulo.trim(),
          content: { type: plantilla.type, skin: plantilla.skin, preguntas },
          mediaUrls: materiales.map((m) => m.url),
        }));
      setActividadCreada(actividad);
      if (salonId) {
        await publicarActividad({
          activityId: actividad.id,
          classroomId: salonId,
          dueDate: new Date(fechaLimite).toISOString(),
        });
      }
      setResultado({ titulo: titulo.trim(), publicada: Boolean(salonId) });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo guardar la actividad"));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <p role="status">Cargando plantilla...</p>
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <a href="/salones/crear" className="enlace-volver">
          ← Volver a Crear salón
        </a>
        <p className="sin-datos">No encontramos esa plantilla. Elige una del catálogo.</p>
      </div>
    );
  }

  return (
    <div className="tarjeta salones-container salones-ancho">
      <a href="/salones/crear" className="enlace-volver">
        ← Volver a Crear salón
      </a>

      <form className="crear-actividad" onSubmit={handleGuardar}>
        <h2>Nueva actividad: {plantilla.display_name}</h2>
        <p className="catalogo-subtitulo">
          {salonId
            ? `Al guardar se publicará en el salón "${salonNombre ?? salonId}".`
            : "Al guardar quedará en tus actividades. Crea un salón primero para publicarla."}
        </p>

        <div className="form-group">
          <label htmlFor="actividad-titulo">Título de la actividad</label>
          <input
            id="actividad-titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <TemplateEditor
          schemaPreguntas={plantilla.schema_json.fields.preguntas}
          preguntas={preguntas}
          onChange={setPreguntas}
        />

        <SubirMaterial materiales={materiales} onChange={setMateriales} />

        {salonId && (
          <div className="form-group">
            <label htmlFor="actividad-fecha">Fecha límite</label>
            <input
              id="actividad-fecha"
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              required
            />
          </div>
        )}

        {error && <p role="alert">{error}</p>}
        {resultado && (
          <p role="status">
            Actividad "{resultado.titulo}" {resultado.publicada ? "publicada en el salón" : "guardada"}.
          </p>
        )}

        <button type="submit" className="btn-guardar-actividad" disabled={guardando || Boolean(resultado) || !titulo.trim()}>
          {guardando ? "Guardando..." : salonId ? "Guardar y publicar" : "Guardar actividad"}
        </button>
      </form>
    </div>
  );
}
