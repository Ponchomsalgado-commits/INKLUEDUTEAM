import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';
import '../styles/publico.css';

// Debe coincidir con PASSWORD_MIN_LENGTH del backend (backend/src/auth/dto/register.dto.ts)
const PASSWORD_MIN_LENGTH = 8;

export default function Register() {
  const { registrarse } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [esError, setEsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setEsError(false);
    setCargando(true);

    try {
      // La web solo registra profesores: authService fija el rol
      // El registro ya deja la sesión iniciada; RutaPublica redirige sola a Mis salones
      await registrarse({ email, password });
      setMensaje('Registro completado correctamente');
    } catch (error) {
      setEsError(true);
      if (error.response?.status === 409) {
        setMensaje('Ese correo ya tiene una cuenta.');
      } else {
        const errorBackend = error.response?.data?.message;
        setMensaje(
          Array.isArray(errorBackend)
            ? errorBackend.join(', ')
            : errorBackend || 'No se pudo completar el registro',
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pub-auth">
      <div className="pub-auth-form">
        <section className="pub-tarjeta">
          <h1>Crear cuenta</h1>

          <form onSubmit={handleSubmit}>
            <div className="pub-campo-icono">
              <div className="pub-icono-caja" aria-hidden="true">
                ✉️
              </div>
              <label className="campo">
                <span>Correo electrónico</span>
                <input
                  id="register-email"
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
                <span>Contraseña (mínimo {PASSWORD_MIN_LENGTH} caracteres)</span>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  placeholder="Crea una contraseña segura"
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            <p role="status" className={`pub-mensaje ${esError ? 'error' : 'exito'}`}>
              {mensaje}
            </p>
            <button type="submit" className="boton" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <hr className="pub-separador" />

          <p className="pub-enlace-pie">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
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
        <p>Crea tu cuenta y prepara tu primera actividad en minutos.</p>
      </div>
    </div>
  );
}

