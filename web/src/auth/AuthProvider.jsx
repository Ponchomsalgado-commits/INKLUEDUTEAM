import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { login, logout, register } from './authService';
import { getAccessToken, getRefreshToken } from './tokenStore';

// Guarda en estado de React si hay sesión, para que la app se vuelva a pintar
// al iniciar o cerrar sesión sin recargar la página (antes se dependía de window.location.assign).
// Hay sesión si existe algún token; el backend sigue validando cada petición.
const hayTokens = () => Boolean(getAccessToken() || getRefreshToken());

export default function AuthProvider({ children }) {
  const [haySesion, setHaySesion] = useState(hayTokens);

  const iniciarSesion = useCallback(async (email, password) => {
    const data = await login(email, password);
    setHaySesion(true);
    return data;
  }, []);

  const registrarse = useCallback(async (datos) => {
    const data = await register(datos);
    // El registro ya deja la sesión iniciada (authService guarda los tokens)
    setHaySesion(true);
    return data;
  }, []);

  const cerrarSesion = useCallback(() => {
    logout();
    setHaySesion(false);
  }, []);

  // apiClient lanza 'auth:logout' cuando la sesión ya no se puede renovar;
  // al marcar haySesion=false, RutaPrivada manda al login.
  useEffect(() => {
    const alExpirar = () => setHaySesion(false);
    window.addEventListener('auth:logout', alExpirar);
    return () => window.removeEventListener('auth:logout', alExpirar);
  }, []);

  const valor = useMemo(
    () => ({ haySesion, iniciarSesion, registrarse, cerrarSesion }),
    [haySesion, iniciarSesion, registrarse, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
