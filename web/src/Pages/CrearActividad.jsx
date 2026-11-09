import { useEffect, useState } from "react";
import TemplateEditor from "../components/TemplateEditor";
import SubirMaterial from "../components/SubirMaterial";
import { materialDesdeReferencia } from "../components/shared/materialUtils";
import { opcionesIniciales, preguntaVacia } from "../components/shared/preguntaVacia";
import {
  obtenerPlantillas,
  obtenerActividad,
  crearActividad,
  editarActividad,
} from "../services/activityService";
import { validarPreguntas } from "../components/shared/validarPreguntas";
import { mensajeDeError } from "../components/shared/errorHandler";
import PublicarActividad from "../components/PublicarActividad";

// Pantalla para editar una copia de la plantilla elegida en /salones/crear.
// "Guardar" solo guarda; "Guardar y publicar" guarda y abre la ventana para elegir
// salón o tutoría y fecha límite (si se llegó con ?salon=ID, ese salón viene preseleccionado).
// Con ?actividad=ID (desde "Mis actividades") edita esa actividad propia en vez de crear otra.

// Plantilla de origen de una actividad: el catálogo trae el schemaJson que necesita el editor
function plantillaDeActividad(plantillas, actividad) {
  return plantillas.find((p) => p.id === actividad.templateId);
}

export default function CrearActividad() {
  const params = new URLSearchParams(window.location.search);
  const plantillaId = params.get("plantilla");
  const actividadId = params.get("actividad");
  const salonId = params.get("salon");
  const salonNombre = params.get("salonNombre");
  const esEdicion = Boolean(actividadId);

  const [plantilla, setPlantilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  // Una vez creada, volver a guardar o publicar no la duplica
  const [actividadCreada, setActividadCreada] = useState(null);
  // Actividad guardada que se está publicando (abre la ventana de publicar)
  const [aPublicar, setAPublicar] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      const plantillas = await obtenerPlantillas();

      if (esEdicion) {
        const actividad = await obtenerActividad(actividadId);
        const origen = plantillaDeActividad(plantillas, actividad);
        if (!origen) return;
        setPlantilla(origen);
        setTitulo(actividad.title);
        setPreguntas(actividad.contentJson?.preguntas ?? []);
        setMateriales((actividad.media ?? []).map(materialDesdeReferencia));
        return;
      }

      const elegida = plantillas.find((p) => p.id === plantillaId);
      if (!elegida) return;
      // Se edita una copia: el estado arranca vacío y la plantilla original no se toca
      const schemaPreguntas = elegida.schemaJson.fields.preguntas;
      const totalOpciones = opcionesIniciales(schemaPreguntas.items.fields.opciones);
      setPlantilla(elegida);
      setTitulo(elegida.displayName);
      setPreguntas(
        Array.from({ length: schemaPreguntas.minItems ?? 1 }, (_, i) =>
          preguntaVacia(`q${i + 1}`, totalOpciones),
        ),
      );
    };

    // Si la actividad no se puede cargar se muestra "No encontramos..." en vez del error
    cargar()
      .catch(() => setPlantilla(null))
      .finally(() => setCargando(false));
  }, [plantillaId, actividadId, esEdicion]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    // Qué botón envió el formulario: "Guardar" o "Guardar y publicar"
    const publicar = e.nativeEvent?.submitter?.value === "publicar";
    setError("");
    setResultado(null);

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

    // Solo las preguntas: type y skin los define la plantilla y el backend los rechaza en el contenido
    const datos = {
      title: titulo.trim(),
      content: { preguntas },
      mediaUrls: materiales.map((m) => m.key),
    };

    setGuardando(true);
    try {
      let id = actividadId;
      if (esEdicion) {
        await editarActividad(actividadId, datos);
      } else {
        const actividad = actividadCreada ?? (await crearActividad({ templateId: plantilla.id, ...datos }));
        setActividadCreada(actividad);
        id = actividad.id;
      }
      setResultado({ titulo: datos.title, mensaje: "guardada" });
      if (publicar) setAPublicar({ id, title: datos.title });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo guardar la actividad"));
    } finally {
      setGuardando(false);
    }
  };

  const idActividad = esEdicion ? actividadId : actividadCreada?.id;

  const enlaceVolver = esEdicion ? (
    <a href="/actividades" className="enlace-volver">
      ← Volver a Mis actividades
    </a>
  ) : (
    <a href="/salones/crear" className="enlace-volver">
      ← Volver a Crear salón
    </a>
  );

  if (cargando) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        <p role="status">{esEdicion ? "Cargando actividad..." : "Cargando plantilla..."}</p>
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="tarjeta salones-container salones-ancho">
        {enlaceVolver}
        <p className="sin-datos">
          {esEdicion
            ? "No encontramos esa actividad."
            : "No encontramos esa plantilla. Elige una del catálogo."}
        </p>
      </div>
    );
  }

  return (
    <div className="tarjeta salones-container salones-ancho">
      {enlaceVolver}

      <form className="crear-actividad" onSubmit={handleGuardar}>
        <h2>
          {esEdicion ? "Editar actividad" : "Nueva actividad"}: {plantilla.displayName}
        </h2>
        <p className="catalogo-subtitulo">
          {esEdicion
            ? "Los cambios se guardan en tu copia; la plantilla original no se modifica."
            : salonId
              ? `Al guardar quedará en tus actividades. Con "Guardar y publicar" podrás publicarla en "${salonNombre ?? "tu salón"}" o en otro salón.`
              : 'Al guardar quedará en tus actividades. Con "Guardar y publicar" eliges el salón o tutoría y la fecha límite.'}
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
          schemaPreguntas={plantilla.schemaJson.fields.preguntas}
          preguntas={preguntas}
          onChange={setPreguntas}
        />

        <SubirMaterial materiales={materiales} onChange={setMateriales} />

        {error && <p role="alert">{error}</p>}
        {resultado && (
          <p role="status">
            Actividad "{resultado.titulo}" {resultado.mensaje}.{" "}
            <a href="/actividades">Ver mis actividades</a>
          </p>
        )}

        <div className="guardar-acciones">
          <button
            type="submit"
            name="accion"
            value="guardar"
            className="btn-guardar-actividad"
            disabled={guardando || (!esEdicion && Boolean(resultado)) || !titulo.trim()}
          >
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar actividad"}
          </button>
          <button
            type="submit"
            name="accion"
            value="publicar"
            className="btn-guardar-actividad"
            disabled={guardando || (!esEdicion && Boolean(resultado)) || !titulo.trim()}
          >
            {guardando ? "Guardando..." : "Guardar y publicar"}
          </button>
        </div>
        {!esEdicion && resultado && idActividad && (
          <button
            type="button"
            className="btn-secundario"
            onClick={() => setAPublicar({ id: idActividad, title: resultado.titulo })}
          >
            Publicar en un salón
          </button>
        )}{" "}
        {idActividad && (
          <a href={`/actividades/previa?actividad=${idActividad}`} className="plantilla-usar">
            Previsualizar como alumno
          </a>
        )}
      </form>

      {aPublicar && (
        <PublicarActividad
          actividad={aPublicar}
          salonInicialId={salonId ?? ""}
          onCerrar={() => setAPublicar(null)}
        />
      )}
    </div>
  );
}
