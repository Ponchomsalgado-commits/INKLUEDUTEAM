import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';
import CrearSalones from './Pages/CrearSalones';
import CrearActividad from './Pages/CrearActividad';
import MisActividades from './Pages/MisActividades';
import PrevisualizarActividad from './Pages/PrevisualizarActividad';
import Tutorias from './Pages/Tutorias';
import Inicio from './Pages/inicio';
import { useAuth } from './auth/authContext';
import RutaPrivada from './routes/RutaPrivada';
import RutaPublica from './routes/RutaPublica';
import ScrollAlNavegar from './routes/ScrollAlNavegar';

function App() {
  const { haySesion, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const enInicio = pathname === '/' || pathname === '/inicio';

  return (
    <div className="app">
      <ScrollAlNavegar />

      <header className="hero">
        <div className="barra-superior">
          <div>
            {haySesion && (
              <Link to="/inicio" onClick={cerrarSesion} className="btn-cerrar-sesion">
                Cerrar sesión
              </Link>
            )}
          </div>

        
          {haySesion ? (
            <nav className="nav-tabs" aria-label="Navegación principal">
              <NavLink to="/salones">Mis salones</NavLink>
              <NavLink to="/actividades">Mis actividades</NavLink>
              <NavLink to="/tutorias">Tutorías</NavLink>
            </nav>
          ) : (
            // Sin sesión, los botones Unirse/Registrarse solo aparecen en el inicio
            enInicio && (
              <nav className="inicio-acciones" aria-label="Acceso">
                <Link to="/login" className="btn-inicio btn-inicio-secundario">
                  Unirse
                </Link>
                <Link to="/register" className="btn-inicio btn-inicio-principal">
                  Registrarse
                </Link>
              </nav>
            )
          )}
        </div>

        <h1>InkluEdu</h1>
        
      </header>

      <main className="contenido">
        <Routes>
          
          <Route index element={haySesion ? <Navigate to="/salones" replace /> : <Inicio />} />

          {/* Solo sin sesión */}
          <Route element={<RutaPublica />}>
           <Route path="inicio" element={<Inicio />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Solo con sesión. Las pantallas que se repiten en dos rutas llevan key
              para que React no reutilice su estado al pasar de una ruta a la otra */}
          <Route element={<RutaPrivada />}>
            <Route path="salones" element={<MisSalones />} />
            <Route path="salones/crear" element={<CrearSalones key="salon" />} />
            <Route path="salones/crear/actividad" element={<CrearActividad key="crear" />} />
            <Route path="salones/tutorias/crear" element={<CrearSalones key="tutoria" />} />
            <Route path="actividades" element={<MisActividades />} />
            <Route path="actividades/editar" element={<CrearActividad key="editar" />} />
            <Route path="actividades/previa" element={<PrevisualizarActividad />} />
            <Route path="tutorias" element={<Tutorias />} />
          </Route>

          <Route
            path="*"
            element={
              <section className="tarjeta not-found">
                <h2>Página no encontrada</h2>
                <p>
                  Prueba las rutas <Link to="/login">/login</Link> o{' '}
                  <Link to="/register">/register</Link>.
                </p>
              </section>
            }
          />
        </Routes>
      </main>

      <footer className="pie" />
    </div>
  );
}

export default App;
