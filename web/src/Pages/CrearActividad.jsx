import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useSearchParams } from "react-router";
import TemplateEditor from "../components/TemplateEditor";
import SubirMaterial from "../components/SubirMaterial";
import LienzoActividad from "../components/LienzoActividad";
import { ICONOS_SKIN } from "../components/shared/iconosSkin";
import { temaDeSkin } from "../components/shared/temaSkin";
import {
  AJUSTES_POR_DEFECTO,
  guardarAjustes,
  leerAjustes,
} from "../components/shared/ajustesLectura";
import "../styles/editor.css";
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
import { rutaInterna } from "../components/shared/rutaInterna";

// Con ?volver=/grupos/ID (desde el salón) el editor regresa allí con la plantilla guardada elegida.
// Editor de una copia de la plantilla elegida: Contenido, Diseño y Ajustes de lectura.
// Solo diseña la actividad; publicarla con fecha límite se hace desde el salón.
// Con ?actividad=ID (desde la Galería o "Seguir editando") edita esa actividad propia en vez de crear otra.

// Plantilla de origen de una actividad: el catálogo trae el schemaJson que necesita el editor
function plantillaDeActividad(plantillas, actividad) {
  return plantillas.find((p) => p.id === actividad.templateId);
}

export default function CrearActividad() {
  const [params] = useSearchParams();
  const plantillaId = params.get("plantilla");
  const actividadId = params.get("actividad");
  const esEdicion = Boolean(actividadId);
  const volverASalon = rutaInterna(params.get("volver"));

  const [plantilla, setPlantilla] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [ajustes, setAjustes] = useState(AJUSTES_POR_DEFECTO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  // Si ya se creó la actividad, guardar otra vez no la duplica
  const [actividadCreada, setActividadCreada] = useState(null);
  // Pestaña abierta del panel lateral (solo presentación)
  const [pestana, setPestana] = useState("contenido");

  useEffect(() => {
    const cargar = async () => {
      const plantillas = await obtenerPlantillas();
      setPlantillas(plantillas);

      if (esEdicion) {
        const actividad = await obtenerActividad(actividadId);
        const origen = plantillaDeActividad(plantillas, actividad);
        if (!origen) return;
        setPlantilla(origen);
        setAjustes(leerAjustes(actividadId));
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
      if (esEdicion) {
        await editarActividad(actividadId, datos);
        guardarAjustes(actividadId, ajustes);
        setResultado({ titulo: datos.title });
        return;
      }

      const actividad = actividadCreada ?? (await crearActividad({ templateId: plantilla.id, ...datos }));
      setActividadCreada(actividad);
      guardarAjustes(actividad.id, ajustes);
      setResultado({ titulo: datos.title });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo guardar la actividad"));
    } finally {
      setGuardando(false);
    }
  };

  const idActividad = esEdicion ? actividadId : actividadCreada?.id;

  const enlaceVolver = (
    <Link to={volverASalon ?? "/editor"} className="volver">
      {volverASalon ? "← Volver al salón" : "← Volver al Editor"}
    </Link>
  );

  if (cargando) {
    return (
      <div className="actividad-pagina">
        <p role="status">{esEdicion ? "Cargando actividad..." : "Cargando plantilla..."}</p>
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="actividad-pagina">
        {enlaceVolver}
        <p className="vacio">
          {esEdicion
            ? "No encontramos esa actividad."
            : "No encontramos esa plantilla. Elige una del catálogo."}
        </p>
      </div>
    );
  }

  const PESTANAS = [
    { clave: "contenido", texto: "Contenido" },
    { clave: "diseno", texto: "Diseño" },
    { clave: "ajustes", texto: "Ajustes" },
  ];
  // Solo se puede cambiar de diseño al crear y entre skins de la misma mecánica (mismo schema)
  const disenos = plantillas.filter((p) => p.type === plantilla.type);

  return (
    <div className="actividad-pagina">
      {enlaceVolver}

      <h1 className="titulo-pagina">
        {esEdicion ? "Editar actividad" : "Nueva actividad"}: {plantilla.displayName}
      </h1>
      <p className="vacio">
        {esEdicion
          ? "Los cambios se guardan en tu copia; la plantilla original no se modifica."
          : "Al guardar quedará en tus actividades. La publicas en un salón desde Grupos."}
      </p>

      <form
        className="editor"
        onSubmit={handleGuardar}
        // Un campo obligatorio vacío en otra pestaña no se puede enfocar: se vuelve a Contenido antes
        onInvalidCapture={() => flushSync(() => setPestana("contenido"))}
      >
        <LienzoActividad
          titulo={titulo}
          preguntas={preguntas}
          skin={plantilla.skin}
          mostrarCorrectas
          letra={ajustes.letra}
          espaciado={ajustes.espaciado}
        />

        <aside className="panel-lateral">
          <div className="pestanas" role="tablist">
            {PESTANAS.map((p) => (
              <button
                key={p.clave}
                type="button"
                role="tab"
                id={`pestana-${p.clave}`}
                aria-selected={pestana === p.clave}
                aria-controls={`panel-${p.clave}`}
                onClick={() => setPestana(p.clave)}
              >
                {p.texto}
              </button>
            ))}
          </div>

          <div
            className="panel-cuerpo"
            id="panel-contenido"
            role="tabpanel"
            aria-labelledby="pestana-contenido"
            hidden={pestana !== "contenido"}
          >
            <div className="campo-bloque">
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
          </div>

          <div
            className="panel-cuerpo"
            id="panel-diseno"
            role="tabpanel"
            aria-labelledby="pestana-diseno"
            hidden={pestana !== "diseno"}
          >
            <h3>Escoge un diseño</h3>
            <div className="temas">
              {disenos.map((d) => {
                const actual = d.id === plantilla.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="tema-opcion"
                    aria-pressed={actual}
                    disabled={esEdicion && !actual}
                    onClick={() => setPlantilla(d)}
                  >
                    <strong>{d.displayName}</strong>
                    <div className={`tema-previa tema-${temaDeSkin(d.skin)}`} aria-hidden="true">
                      {ICONOS_SKIN[d.skin] ?? "🎮"}
                    </div>
                  </button>
                );
              })}
            </div>
            {esEdicion && (
              <p className="vacio">El diseño se elige al crear la actividad y no se cambia después.</p>
            )}
          </div>

          <div
            className="panel-cuerpo"
            id="panel-ajustes"
            role="tabpanel"
            aria-labelledby="pestana-ajustes"
            hidden={pestana !== "ajustes"}
          >
            <h3>Ajustes de lectura</h3>
            <div className="campo-bloque">
              <label htmlFor="ajuste-letra">
                Tamaño de letra: <output htmlFor="ajuste-letra">{ajustes.letra} px</output>
              </label>
              <input
                id="ajuste-letra"
                type="range"
                min="16"
                max="32"
                step="2"
                value={ajustes.letra}
                onChange={(e) => setAjustes((a) => ({ ...a, letra: Number(e.target.value) }))}
              />
            </div>
            <div className="campo-bloque">
              <label>
                <input
                  type="checkbox"
                  checked={ajustes.espaciado}
                  onChange={(e) => setAjustes((a) => ({ ...a, espaciado: e.target.checked }))}
                />{" "}
                Más espacio entre bloques
              </label>
            </div>
          </div>

          <div className="panel-cuerpo panel-pie">
            {error && (
              <p className="mensaje error" role="alert">
                {error}
              </p>
            )}
            {resultado && (
              <p className="mensaje exito" role="status">
                Actividad "{resultado.titulo}" guardada.{" "}
                {volverASalon && idActividad ? (
                  <Link to={`${volverASalon}?pestana=crear&actividad=${idActividad}`}>
                    Volver al salón y usarla
                  </Link>
                ) : (
                  <Link to="/galeria">Ver en la Galería</Link>
                )}
              </p>
            )}

            <button
              type="submit"
              className="boton"
              disabled={guardando || (!esEdicion && Boolean(resultado)) || !titulo.trim()}
            >
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Guardar actividad"}
            </button>
            {idActividad && (
              <Link
                to={`/actividades/previa?actividad=${idActividad}`}
                className="boton boton-sec"
              >
                Previsualizar como alumno
              </Link>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
