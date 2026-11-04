// Ayudas para mostrar y validar el material didáctico a partir de su nombre (extensión).

// Mismo listado que ALLOWED_MEDIA en backend/src/media/media.rules.ts. Si cambia uno, cambia el otro.
export const FORMATOS_PERMITIDOS = ["pdf", "txt", "png", "jpg", "jpeg", "webp", "mp4", "webm", "mp3", "m4a", "ogg", "wav"];

// Tipo de material que muestra cada formato: lectura (texto e imágenes), video o audio
const TIPO_POR_FORMATO = {
  pdf: "lectura",
  txt: "lectura",
  png: "lectura",
  jpg: "lectura",
  jpeg: "lectura",
  webp: "lectura",
  mp4: "video",
  webm: "video",
  mp3: "audio",
  m4a: "audio",
  ogg: "audio",
  wav: "audio",
};

export const ICONOS_MATERIAL = { lectura: "📄", video: "🎬", audio: "🎧" };

// Extensión en minúsculas de un nombre de archivo ("Tema 1.PDF" -> "pdf"); "" si no tiene
export function extensionDe(nombre = "") {
  const i = nombre.lastIndexOf(".");
  return i === -1 ? "" : nombre.slice(i + 1).toLowerCase();
}

export function formatoPermitido(nombre) {
  return FORMATOS_PERMITIDOS.includes(extensionDe(nombre));
}

// "lectura" | "video" | "audio" según la extensión del nombre
export function tipoDeMaterial(nombre = "") {
  return TIPO_POR_FORMATO[extensionDe(nombre)] ?? "lectura";
}

// Material ya guardado en la actividad (al editarla): { key, name, url } desde `media` del backend
export function materialDesdeReferencia(referencia) {
  return {
    id: referencia.key,
    key: referencia.key,
    nombre: referencia.name,
    tipo: tipoDeMaterial(referencia.name),
    estado: "listo",
    url: referencia.url,
  };
}

export function formatearTamano(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
