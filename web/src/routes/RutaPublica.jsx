import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/authContext';

// Rutas que solo tienen sentido sin sesión (login, registro). Con sesión manda a la
// página que se pidió antes de pasar por el login o, si no había ninguna, a la Galería.
// Así, al iniciar sesión o registrarse, la redirección ocurre sola.
export default function RutaPublica() {
  const { haySesion } = useAuth();
  const location = useLocation();

  if (haySesion) {
    return <Navigate to={location.state?.from ?? '/galeria'} replace />;
  }
  return <Outlet />;
}
