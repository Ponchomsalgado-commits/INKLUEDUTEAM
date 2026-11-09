import { useEffect } from 'react';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';
import CrearSalones from './Pages/CrearSalones';
import CrearActividad from './Pages/CrearActividad';
import MisActividades from './Pages/MisActividades';
import PrevisualizarActividad from './Pages/PrevisualizarActividad';
import Tutorias from './Pages/Tutorias';
import DetalleSalon from './Pages/DetalleSalon';
import DetalleAlumno from './Pages/DetalleAlumno';
import { logout } from './auth/authService';
import { getAccessToken, getRefreshToken } from './auth/tokenStore';

// Pantallas que solo tienen sentido sin sesión; con sesión se muestra Mis salones
const RUTAS_SIN_SESION = ['/', '/login', '/register'];
// Pantallas que requieren sesión; sin ella se muestra el login
const RUTAS_CON_SESION = ['/salones', '/salones/crear', '/salones/crear/actividad', '/actividades', '/actividades/editar', '/actividades/previa', '/tutorias', '/salones/detalle', '/salones/alumno'];

// Enrutado mínimo por URL. Cuando haya más pantallas conviene pasar a react-router.
function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  // Hay sesión si existe algún token; el backend sigue validando cada petición
  const haySesion = Boolean(getAccessToken() || getRefreshToken());

  // Ajusta la URL a lo que se muestra (sin recargar): con sesión, /salones; sin ella, /login
  useEffect(() => {
    if (haySesion && RUTAS_SIN_SESION.includes(ruta)) {
      window.history.replaceState(null, '', '/salones');
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

  // Pestaña resaltada en el menú; la raíz con sesión, Crear salón y el detalle de un salón cuentan
  // como Mis salones (o Tutorías si se llegó desde ahí), y Editar actividad cuenta como Mis actividades
  const desdeTutorias = new URLSearchParams(window.location.search).get('desde') === 'tutorias';
  const rutaActiva =
    ruta.startsWith('/salones/') && desdeTutorias
      ? '/tutorias'
      : (haySesion && RUTAS_SIN_SESION.includes(ruta)) || ruta.startsWith('/salones/')
      ? '/salones'
      : ruta.startsWith('/actividades')
        ? '/actividades'
        : ruta;
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
              {enlaceNav('/actividades', 'Mis actividades')}
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
      ) : ruta === '/salones/crear/actividad' ? (
        haySesion ? <CrearActividad /> : <Login />
      ) : ruta === '/actividades' ? (
        haySesion ? <MisActividades /> : <Login />
      ) : ruta === '/actividades/editar' ? (
        haySesion ? <CrearActividad /> : <Login />
      ) : ruta === '/actividades/previa' ? (
        haySesion ? <PrevisualizarActividad /> : <Login />
      ) : ruta === '/tutorias' ? (
        haySesion ? <Tutorias /> : <Login />
      ) : ruta === '/salones/detalle' ? (
        haySesion ? <DetalleSalon /> : <Login />
      ) : ruta === '/salones/alumno' ? (
        haySesion ? <DetalleAlumno /> : <Login />
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
