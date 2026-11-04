// Ayudas para mostrar el material didáctico a partir de su tipo MIME o de su URL.

const EXTENSIONES = {
  lectura: ["pdf", "txt"],
  video: ["mp4", "webm", "mov", "mkv"],
  audio: ["mp3", "wav", "ogg", "m4a", "aac"],
};

export const ICONOS_MATERIAL = { lectura: "📄", video: "🎬", audio: "🎧" };

// "lectura" | "video" | "audio" según el MIME del archivo o la extensión de su nombre/URL
export function tipoDeMaterial(mimeONombre = "") {
  if (mimeONombre.startsWith("video/")) return "video";
  if (mimeONombre.startsWith("audio/")) return "audio";
  const extension = mimeONombre.split(".").pop().toLowerCase();
  return Object.keys(EXTENSIONES).find((tipo) => EXTENSIONES[tipo].includes(extension)) ?? "lectura";
}

// Nombre legible de una URL firmada: último tramo de la ruta, sin la firma (?X-Amz-...)
export function nombreDeUrl(url) {
  const ruta = url.split("?")[0];
  return decodeURIComponent(ruta.split("/").pop() || ruta);
}

// Material ya guardado en la actividad (al editarla) en el formato de SubirMaterial: solo se conoce su URL
export function materialDesdeUrl(url) {
  return { id: url, nombre: nombreDeUrl(url), tipo: tipoDeMaterial(nombreDeUrl(url)), estado: "listo", url };
}

export function formatearTamano(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
