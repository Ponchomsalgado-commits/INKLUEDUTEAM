import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/authContext';

// Rutas que requieren sesión. Sin sesión manda al login y recuerda a dónde se quería ir
// (state.from), para volver ahí después de iniciar sesión.
export default function RutaPrivada() {
  const { haySesion } = useAuth();
  const location = useLocation();

  if (!haySesion) {
    return <Navigate to="/inicio" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
