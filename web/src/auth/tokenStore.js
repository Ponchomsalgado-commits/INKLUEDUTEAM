let accessToken = null;
let refreshToken = null; // AGREGADO

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// ===== AGREGADO POR MARIO (T1103) =====
const REFRESH_KEY = "refresh_token";

export function setRefreshToken(token) {
  refreshToken = token;
  try {
    sessionStorage.setItem(REFRESH_KEY, token);
  } catch {
    // si el navegador bloquea el storage, queda solo en memoria
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
    // nada
  }
}
// ===== FIN DE LO AGREGADO =====