import { useEffect } from 'react';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';
import CrearSalones from './Pages/CrearSalones';
import Tutorias from './Pages/Tutorias';
import { logout } from './auth/authService';
import { getAccessToken, getRefreshToken } from './auth/tokenStore';

// Pantallas que solo tienen sentido sin sesión; con sesión se muestra Mis salones
const RUTAS_SIN_SESION = ['/', '/login', '/register'];
// Pantallas que requieren sesión; sin ella se muestra el login
const RUTAS_CON_SESION = ['/salones', '/salones/crear', '/tutorias'];

// Enrutado mínimo por URL. Cuando haya más pantallas conviene pasar a react-router.
function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  // Hay sesión si existe algún token; el backend sigue validando cada petición
  const haySesion = Boolean(getAccessToken() || getRefreshToken());

  // Ajusta la URL a lo que se muestra (sin recargar): con sesión, /salones; sin ella, /login
  useEffect(() => {
    if (haySesion && RUTAS_SIN_SESION.includes(ruta)) {
      window.history.replaceState(null, '', '/salones');
      window.history.replaceState(null, '', '/tutorias');
    } else if (!haySesion && RUTAS_CON_SESION.includes(ruta)) {
      window.history.replaceState(null, '', '/login');
    }
  }, [haySesion, ruta]);

  // apiClient lanza 'auth:logout' cuando la sesión ya no se puede renovar
  useEffect(() => {
    const volverAlLogin = () => window.location.assign('/login');
    window.addEventListener('auth:logout', volverAlLogin);
    return () => window.removeEventListener('auth:logout', volverAlLogin);
  }, []);

  // Pestaña resaltada en el menú; la raíz con sesión y Crear salón cuentan como Mis salones
  const rutaActiva =
    (haySesion && RUTAS_SIN_SESION.includes(ruta)) || ruta === '/salones/crear' ? '/salones' : ruta;
    (haySesion && RUTAS_SIN_SESION.includes(ruta)) || ruta === '/tutorias/crear' ? '/tutorias' : ruta;
  const enlaceNav = (href, texto) => (
    <a href={href} aria-current={rutaActiva === href ? 'page' : undefined}>
      {texto}
    </a>
  );

return (
  <div className="app">
    <header className="hero">
      <div className="barra-superior">
        <div>
          {haySesion && (
            <a
              href="/login"
              onClick={logout}
              className="btn-cerrar-sesion"
            >
              Cerrar sesión
            </a>
          )}
        </div>

        <nav className="nav-tabs" aria-label="Navegación principal">
          {haySesion ? (
            <>
              {enlaceNav('/salones', 'Mis salones')}
              {enlaceNav('/tutorias', 'Tutorías')}
            </>
          ) : (
            <>
              {enlaceNav('/login', 'Login')}
              {enlaceNav('/register', 'Registro')}
            </>
          )}
        </nav>
      </div>

      <h1>InkluEdu</h1>
      <p>Aprender juntos, a tu ritmo</p>
    </header>

    <main className="contenido">
      {haySesion && RUTAS_SIN_SESION.includes(ruta) ? (
        <MisSalones />
      ) : ruta === '/' || ruta === '/login' ? (
        <Login />
      ) : ruta === '/register' ? (
        <Register />
      ) : ruta === '/salones' ? (
        haySesion ? <MisSalones /> : <Login />
      ) : ruta === '/salones/crear' ? (
        haySesion ? <CrearSalones /> : <Login />
      ) : ruta === '/tutorias' ? (
        haySesion ? <Tutorias /> : <Login />
      ) : ruta === '/salones/tutorias/crear' ? (
        haySesion ? <CrearSalones /> : <Login />
      ) : (
        <section className="tarjeta not-found">
          <h2>Página no encontrada</h2>
          <p>
            Prueba las rutas <a href="/login">/login</a> o{' '}
            <a href="/register">/register</a>.
          </p>
        </section>
      )}
    </main>

    <footer className="pie" />
  </div>
);
}
export default App;
