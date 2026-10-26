// Cliente HTTP único de la web. Todas las peticiones a la API pasan por aquí:
// agrega el access_token y, si caduca (401), lo renueva con el refresh_token y repite la petición.
import axios from 'axios';
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/tokenStore';

const REFRESH_PATH = '/auth/refrescar';
// Rutas que nunca deben disparar un refresh (no usan token o son el refresh mismo)
const RUTAS_PUBLICAS = ['/auth/login', '/auth/registro', REFRESH_PATH];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si varias peticiones fallan a la vez, todas esperan el mismo refresh
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No hay refresh token'));
    }
    // axios directo (no apiClient) para no caer en un ciclo de interceptores
    refreshPromise = axios
      .post(`${apiClient.defaults.baseURL}${REFRESH_PATH}`, { refresh_token: refreshToken })
      .then(({ data }) => {
        setAccessToken(data.access_token);
        if (data.refresh_token) setRefreshToken(data.refresh_token);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const peticion = error.config;
    const esPublica = RUTAS_PUBLICAS.some((ruta) => peticion?.url?.includes(ruta));

    if (error.response?.status !== 401 || esPublica || peticion._retry) {
      return Promise.reject(error);
    }

    peticion._retry = true;
    try {
      const nuevoToken = await refreshAccessToken();
      peticion.headers.Authorization = `Bearer ${nuevoToken}`;
      return apiClient(peticion);
    } catch (refreshError) {
      // La sesión ya no se puede renovar: se limpia y se avisa a la app para volver al login
      clearAccessToken();
      clearRefreshToken();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
