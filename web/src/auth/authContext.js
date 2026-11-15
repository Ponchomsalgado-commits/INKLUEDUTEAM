// Contexto de sesión: lo provee AuthProvider y se consume con useAuth().
// Va separado del componente para que react-refresh (HMR) funcione bien.
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
