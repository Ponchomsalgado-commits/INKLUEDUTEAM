// Dónde vive cada token en la web:
// - access_token: solo en memoria (se pierde al recargar; dura poco y se renueva solo).
// - refresh_token: en memoria + sessionStorage, para poder renovar la sesión dentro de la pestaña.
//   sessionStorage se borra al cerrar la pestaña. Mejora futura: cookie httpOnly (documento técnico, Sprint 1).

const REFRESH_KEY = 'refresh_token';

let accessToken = null;
let refreshToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function setRefreshToken(token) {
  refreshToken = token;
  try {
    sessionStorage.setItem(REFRESH_KEY, token);
  } catch {
    // Si el navegador bloquea el storage, queda solo en memoria
  }
}

export function getRefreshToken() {
  if (refreshToken) return refreshToken;
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearRefreshToken() {
  refreshToken = null;
  try {
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    // Nada que limpiar
  }
}
