import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';

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
    <section className="tarjeta auth-card">
      <h2>Crear cuenta de profesor</h2>
      <p className="auth-subtitulo">Regístrate para gestionar tus salones</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@escuela.mx"
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" className="btn-principal" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      {mensaje && (
        <p role="status" className={esError ? 'mensaje mensaje-error' : 'mensaje mensaje-ok'}>
          {mensaje}
        </p>
      )}
      <p className="auth-cambio">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </section>
  );
}

