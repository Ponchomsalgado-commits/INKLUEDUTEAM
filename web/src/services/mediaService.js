import apiClient from "./apiClient";

// llamadas al backend para el material didáctico (lectura, video o audio) de una actividad

// POST /media/upload -> sube un archivo a MinIO a través del backend y devuelve su referencia.
// El backend valida tipo y tamaño de nuevo y entrega una URL firmada (nunca pública sin control).
// Pendiente en backend: hoy no existe esta ruta, así que responde 404 hasta que se implemente.
export async function subirMaterial(archivo, onProgreso) {
  const datos = new FormData();
  datos.append("file", archivo);
  const response = await apiClient.post("/media/upload", datos, {
    // multipart en vez del JSON por defecto del apiClient; el navegador agrega el boundary
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total) onProgreso?.(Math.round((e.loaded / e.total) * 100));
    },
  });
  return { url: response.data.url ?? response.data.key };
}
