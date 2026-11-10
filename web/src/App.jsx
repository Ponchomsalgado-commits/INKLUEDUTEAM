import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Galeria from './Pages/Galeria';
import Editor from './Pages/Editor';
import Grupos from './Pages/Grupos';
import Clase from './Pages/Clase';
import Individual from './Pages/Individual';
import Calendario from './Pages/Calendario';
import CrearSalones from './Pages/CrearSalones';
import CrearActividad from './Pages/CrearActividad';
import PrevisualizarActividad from './Pages/PrevisualizarActividad';
import Inicio from './Pages/inicio';
import BarraSuperior from './components/BarraSuperior';
import MenuDepleja from './components/MenuDepleja';
import { useAuth } from './auth/authContext';
import RutaPrivada from './routes/RutaPrivada';
import RutaPublica from './routes/RutaPublica';
import ScrollAlNavegar from './routes/ScrollAlNavegar';

function App() {
  const { haySesion } = useAuth();
  const { pathname } = useLocation();
  const paginaPublica = !haySesion && ['/', '/inicio', '/login', '/register'].includes(pathname);

  return (
    <div className={`app${haySesion ? ' con-sesion' : ''}`}>
      <ScrollAlNavegar />

      {!paginaPublica && <BarraSuperior />}

      <div className="cuerpo">
        {haySesion && <MenuDepleja />}

        <main className={`contenido${paginaPublica ? ' contenido-publico' : ''}`}>
          <Routes>
            <Route index element={haySesion ? <Navigate to="/galeria" replace /> : <Inicio />} />

            {/* Solo sin sesión */}
            <Route element={<RutaPublica />}>
              <Route path="inicio" element={<Inicio />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Solo con sesión. Las pantallas que se repiten en dos rutas llevan key
                para que React no reutilice su estado al pasar de una ruta a la otra */}
            <Route element={<RutaPrivada />}>
              <Route path="galeria" element={<Galeria />} />
              <Route path="editor" element={<Editor />} />
              <Route path="grupos" element={<Grupos />} />
              <Route path="grupos/:id" element={<Clase />} />
              <Route path="individual" element={<Individual />} />
              <Route path="calendario" element={<Calendario />} />

              <Route path="salones/crear" element={<CrearSalones key="salon" />} />
              <Route path="salones/crear/actividad" element={<Navigate to="/grupos" replace />} />
              <Route path="actividades/nueva" element={<CrearActividad key="crear" />} />
              <Route path="salones/tutorias/crear" element={<CrearSalones key="tutoria" />} />
              <Route path="actividades/editar" element={<CrearActividad key="editar" />} />
              <Route path="actividades/previa" element={<PrevisualizarActividad />} />

              {/* Rutas anteriores al menú lateral: se mandan a su página nueva */}
              <Route path="salones" element={<Navigate to="/grupos" replace />} />
              <Route path="actividades" element={<Navigate to="/galeria" replace />} />
              <Route path="tutorias" element={<Navigate to="/individual" replace />} />
            </Route>

            <Route
              path="*"
              element={
                <section className="tarjeta not-found">
                  <h2>Página no encontrada</h2>
                  <p>
                    {haySesion ? (
                      <>
                        Vuelve a la <Link to="/galeria">Galería</Link>.
                      </>
                    ) : (
                      <>
                        Prueba las rutas <Link to="/login">/login</Link> o{' '}
                        <Link to="/register">/register</Link>.
                      </>
                    )}
                  </p>
                </section>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
