import apiClient from "./apiClient";

// llamadas al backend para el material didáctico (lectura, video o audio) de una actividad

// POST /media/upload -> sube un archivo a MinIO a través del backend.
// Devuelve { key, name, contentType, url, expiresIn, size }:
//  - key: lo que se guarda en la actividad (mediaUrls). Es estable.
//  - url: URL firmada que caduca; solo para mostrarlo ahora, nunca para guardarlo.
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
  return response.data;
}
