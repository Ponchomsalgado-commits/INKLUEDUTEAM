// Registro, login y logout contra /api/v1/auth. Guarda los tokens en tokenStore.
import apiClient from '../services/apiClient';
import { clearAccessToken, clearRefreshToken, setAccessToken, setRefreshToken } from './tokenStore';

// La web es solo para usuarioP; los usuarioA usan la app móvil
const ROL_WEB = 'PROFESOR';

// Lee el rol del payload del JWT (solo para la interfaz; el backend valida el rol en cada endpoint)
function rolDelToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).role;
  } catch {
    return null;
  }
}

function guardarSesion({ access_token, refresh_token }) {
  if (!access_token) {
    throw new Error('La respuesta del servidor no contiene access_token');
  }
  if (rolDelToken(access_token) !== ROL_WEB) {
    const error = new Error('Esta cuenta no es de profesor');
    error.code = 'ROL_NO_PERMITIDO';
    throw error;
  }
  setAccessToken(access_token);
  if (refresh_token) setRefreshToken(refresh_token);
}

export async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  guardarSesion(response.data);
  return response.data;
}

export async function register({ email, password }) {
  const response = await apiClient.post('/auth/registro', { email, password, role: ROL_WEB });
  guardarSesion(response.data);
  return response.data;
}

export function logout() {
  clearAccessToken();
  clearRefreshToken();
}
