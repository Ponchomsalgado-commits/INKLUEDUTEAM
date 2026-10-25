import { useEffect } from 'react';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';
import { logout } from './auth/authService';
import { getAccessToken, getRefreshToken } from './auth/tokenStore';

// Pantallas que solo tienen sentido sin sesión; con sesión se muestra Mis salones
const RUTAS_SIN_SESION = ['/', '/login', '/register'];

// Enrutado mínimo por URL. Cuando haya más pantallas conviene pasar a react-router.
function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  // Hay sesión si existe algún token; el backend sigue validando cada petición
  const haySesion = Boolean(getAccessToken() || getRefreshToken());

  // Ajusta la URL a lo que se muestra (sin recargar): con sesión, /salones; sin ella, /login
  useEffect(() => {
    if (haySesion && RUTAS_SIN_SESION.includes(ruta)) {
      window.history.replaceState(null, '', '/salones');
    } else if (!haySesion && ruta === '/salones') {
      window.history.replaceState(null, '', '/login');
    }
  }, [haySesion, ruta]);

  // apiClient lanza 'auth:logout' cuando la sesión ya no se puede renovar
  useEffect(() => {
    const volverAlLogin = () => window.location.assign('/login');
    window.addEventListener('auth:logout', volverAlLogin);
    return () => window.removeEventListener('auth:logout', volverAlLogin);
  }, []);

  return (
    <main className="app-container">
      <h1>InkluEdu</h1>
      <nav className="nav-buttons" aria-label="Navegación de cuenta">
        {haySesion ? (
          <>
            <a href="/salones">Mis salones</a>
            {/* logout() corre antes de que el enlace navegue al login */}
            <a href="/login" onClick={logout}>
              Cerrar sesión
            </a>
          </>
        ) : (
          <>
            <a href="/login">Login</a>
            <a href="/register">Registro</a>
          </>
        )}
      </nav>
      {haySesion && RUTAS_SIN_SESION.includes(ruta) ? (
        <MisSalones />
      ) : ruta === '/' || ruta === '/login' ? (
        <Login />
      ) : ruta === '/register' ? (
        <Register />
      ) : ruta === '/salones' ? (
        // Mis salones solo con sesión iniciada; sin ella se muestra el login
        haySesion ? <MisSalones /> : <Login />
      ) : (
        <section className="not-found">
          <h2>Página no encontrada</h2>
          <p>
            Prueba las rutas <a href="/login">/login</a> o <a href="/register">/register</a>.
          </p>
        </section>
      )}
    </main>
  );
}

export default App;
