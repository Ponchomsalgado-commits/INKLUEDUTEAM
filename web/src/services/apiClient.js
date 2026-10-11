import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "../auth/tokenStore"; // AGREGADO: setAccessToken y clearAccessToken

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AGREGADO

const REFRESH_PATH = "/auth/refresh"; // TODO: confirmar la ruta real en el backend

let refreshPromise = null; // evita pedir varios refresh al mismo tiempo

async function refreshAccessToken() {
  if (!refreshPromise) {
    // axios.post normal (sin apiClient) para no caer en un ciclo infinito
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_URL}${REFRESH_PATH}`, null, {
        withCredentials: true,
      })
      .then((res) => {
        const nuevoToken = res.data.access_token;
        setAccessToken(nuevoToken);
        return nuevoToken;
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
    const peticionOriginal = error.config;
    const esLoginORegistro =
      peticionOriginal.url?.includes("/auth/login") ||
      peticionOriginal.url?.includes("/auth/registro") ||
      peticionOriginal.url?.includes(REFRESH_PATH);

    
    if (error.response?.status === 401 && !esLoginORegistro && !peticionOriginal._retry) {
      peticionOriginal._retry = true;
      try {
        const nuevoToken = await refreshAccessToken();
        peticionOriginal.headers.Authorization = `Bearer ${nuevoToken}`;
        return apiClient(peticionOriginal); // repetimos la petición
      } catch (e) {
        clearAccessToken();
        window.dispatchEvent(new Event("auth:logout")); // avisa a la app: "vuelve al login"
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);



export default apiClient;