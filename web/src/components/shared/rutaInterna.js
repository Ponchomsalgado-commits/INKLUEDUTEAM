// Solo rutas internas de la app ("/grupos/123"); cualquier otra cosa se descarta
export function rutaInterna(valor) {
  return typeof valor === "string" && /^\/(?!\/)[\w\-/]*$/.test(valor) ? valor : null;
}
