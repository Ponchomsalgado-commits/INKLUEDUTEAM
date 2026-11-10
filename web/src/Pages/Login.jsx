import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';
import '../styles/publico.css';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setEsError(false);
    setCargando(true);

    try {
      // Al marcar la sesión, RutaPublica redirige sola (a Mis salones o a la página pedida antes)
      await iniciarSesion(email, password);
      setMensaje('Inicio de sesión correcto');
    } catch (error) {
      setEsError(true);
      if (error.code === 'ROL_NO_PERMITIDO') {
        setMensaje('Esta cuenta es de estudiante. Inicia sesión desde la app móvil.');
      } else if (error.response?.status === 401) {
        setMensaje('Correo o contraseña incorrectos');
      } else {
        setMensaje('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pub-auth">
      <div className="pub-auth-form">
        <section className="pub-tarjeta">
          <h1>Iniciar sesión</h1>

          <form onSubmit={handleSubmit}>
            <div className="pub-campo-icono">
              <div className="pub-icono-caja" aria-hidden="true">
                ✉️
              </div>
              <label className="campo">
                <span>Correo electrónico</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <div className="pub-campo-icono">
              <div className="pub-icono-caja" aria-hidden="true">
                🔒
              </div>
              <label className="campo">
                <span>Contraseña</span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </label>
            </div>

            <p role="status" className={`pub-mensaje ${esError ? 'error' : 'exito'}`}>
              {mensaje}
            </p>
            <button type="submit" className="boton" disabled={cargando}>
              {cargando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <hr className="pub-separador" />

          <div className="pub-social">
            {['Google', 'Apple'].map((servicio) => (
              <button
                key={servicio}
                type="button"
                className="boton boton-sec"
                onClick={() => {
                  setEsError(true);
                  setMensaje(`Entrar con ${servicio} estará disponible pronto.`);
                }}
              >
                Continuar con {servicio}
              </button>
            ))}
          </div>

          <p className="pub-enlace-pie">
            ¿No tienes cuenta? <Link to="/register">Crea una aquí</Link>
          </p>
          <p className="pub-enlace-pie">
            <Link to="/">Volver al inicio</Link>
          </p>
        </section>
      </div>

      <div className="pub-deco">
        <div className="pub-animales" aria-hidden="true">
          🐸🦋🐝🐱
        </div>
        <p>Aprender se siente mejor cuando todo es claro.</p>
      </div>
    </div>
  );
}
