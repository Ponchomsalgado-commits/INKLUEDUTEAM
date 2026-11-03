import { useRef, useState } from "react";
import { subirMaterial } from "../services/mediaService";
import { mensajeDeError } from "./errorHandler";
import { ICONOS_MATERIAL, formatearTamano, tipoDeMaterial } from "./materialUtils";

// Zona de arrastrar y soltar para el material didáctico de una actividad.
// Cada archivo se sube en cuanto se suelta; la actividad solo guarda las URLs de los que quedaron listos.
// materiales: [{ id, nombre, tamano, tipo, estado: "subiendo" | "listo" | "error", progreso, url, error, archivo }]
// onChange recibe una función (lista) => nuevaLista, porque varias subidas terminan a la vez.

// Lectura (PDF o texto), video o audio; el backend vuelve a validar tipo y tamaño antes de aceptarlo
const TIPOS_PERMITIDOS = ["application/pdf", "text/plain", "video/", "audio/"];
const ACCEPT = "application/pdf,text/plain,video/*,audio/*";
const TAMANO_MAXIMO_MB = 50;
const MAXIMO_ARCHIVOS = 5;

function tipoPermitido(archivo) {
  return TIPOS_PERMITIDOS.some((t) => (t.endsWith("/") ? archivo.type.startsWith(t) : archivo.type === t));
}

export default function SubirMaterial({ materiales, onChange }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [avisos, setAvisos] = useState([]);

  const actualizar = (id, cambios) =>
    onChange((lista) => lista.map((m) => (m.id === id ? { ...m, ...cambios } : m)));

  const subir = async (material) => {
    actualizar(material.id, { estado: "subiendo", progreso: 0, error: "" });
    try {
      const { url } = await subirMaterial(material.archivo, (progreso) => actualizar(material.id, { progreso }));
      actualizar(material.id, { estado: "listo", url });
    } catch (err) {
      actualizar(material.id, { estado: "error", error: mensajeDeError(err, "No se pudo subir el archivo") });
    }
  };

  const agregarArchivos = (archivos) => {
    const rechazos = [];
    const nuevos = [];
    let espacio = MAXIMO_ARCHIVOS - materiales.length;

    for (const archivo of archivos) {
      if (!tipoPermitido(archivo)) {
        rechazos.push(`"${archivo.name}" no es lectura (PDF/TXT), video ni audio.`);
      } else if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
        rechazos.push(`"${archivo.name}" pesa más de ${TAMANO_MAXIMO_MB} MB.`);
      } else if (espacio <= 0) {
        rechazos.push(`"${archivo.name}" no se agregó: máximo ${MAXIMO_ARCHIVOS} archivos por actividad.`);
      } else {
        espacio -= 1;
        nuevos.push({
          id: `${Date.now()}-${nuevos.length}-${archivo.name}`,
          nombre: archivo.name,
          tamano: archivo.size,
          tipo: tipoDeMaterial(archivo.type),
          estado: "subiendo",
          progreso: 0,
          archivo,
        });
      }
    }

    setAvisos(rechazos);
    if (nuevos.length === 0) return;
    onChange((lista) => [...lista, ...nuevos]);
    nuevos.forEach(subir);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    agregarArchivos(e.dataTransfer.files);
  };

  // dragleave también salta al pasar sobre un hijo de la zona; solo cuenta si sale de verdad
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setArrastrando(false);
  };

  const abrirSelector = () => inputRef.current?.click();

  const quitar = (id) => onChange((lista) => lista.filter((m) => m.id !== id));

  return (
    <div className="form-group subir-material">
      <span className="subir-material-titulo">Material didáctico (opcional)</span>

      <div
        className={`zona-material${arrastrando ? " arrastrando" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Agregar material didáctico: arrastra archivos aquí o presiona para elegirlos"
        onClick={abrirSelector}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            abrirSelector();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="zona-material-icono" aria-hidden="true">
          📂
        </span>
        <strong>{arrastrando ? "Suelta los archivos aquí" : "Arrastra tus archivos aquí"}</strong>
        <span>
          o haz clic para elegirlos · PDF, TXT, video o audio · hasta {TAMANO_MAXIMO_MB} MB cada uno
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            agregarArchivos(e.target.files);
            e.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />
      </div>

      {avisos.length > 0 && (
        <ul className="material-avisos" role="alert">
          {avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}

      {materiales.length > 0 && (
        <ul className="lista-material">
          {materiales.map((m) => (
            <li key={m.id} className={`material-item material-${m.estado}`}>
              <span className="material-icono" aria-hidden="true">
                {ICONOS_MATERIAL[m.tipo]}
              </span>
              <div className="material-info">
                <strong>{m.nombre}</strong>
                <small>
                  {m.tamano != null && `${formatearTamano(m.tamano)} · `}
                  {m.estado === "subiendo" && `Subiendo ${m.progreso ?? 0}%`}
                  {m.estado === "listo" && "Listo"}
                  {m.estado === "error" && m.error}
                </small>
                {m.estado === "subiendo" && (
                  <progress value={m.progreso ?? 0} max={100} aria-label={`Progreso de ${m.nombre}`} />
                )}
              </div>
              {m.estado === "error" && m.archivo && (
                <button type="button" className="btn-secundario" onClick={() => subir(m)}>
                  Reintentar
                </button>
              )}
              <button
                type="button"
                className="btn-secundario"
                onClick={() => quitar(m.id)}
                aria-label={`Quitar ${m.nombre}`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
