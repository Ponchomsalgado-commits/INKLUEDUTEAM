
import apiClient from "../services/apiClient";
import { setAccessToken, clearAccessToken } from "./tokenStore";
//registro, login, renovación y logout, según los endpoints reales del backend. Se puede usar para manejar la autenticación de usuarios y la gestión de tokens de acceso.
export async function login(email, password) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

   const { access_token } = response.data;

  if (!access_token) {
    throw new Error("La respuesta del login no contiene access_token");
  }

  setAccessToken(access_token);

  return response.data;
}

 export async function register(datos) {
 const response = await apiClient.post("/auth/registro", datos);
const { access_token } = response.data;

if (!access_token) {
  throw new Error("La respuesta del registro no contiene access_token");
}
setAccessToken(access_token);
 return response.data;
 }

export function logout() {
  clearAccessToken();
}