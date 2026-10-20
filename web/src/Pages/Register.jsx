import { useState } from 'react';
import { register } from '../auth/authService';

// Debe coincidir con PASSWORD_MIN_LENGTH del backend (backend/src/auth/dto/register.dto.ts)
const PASSWORD_MIN_LENGTH = 8;

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);

    try {
      // La web solo registra profesores: authService fija el rol
      await register({ email, password });
      setMensaje('Registro completado correctamente');
      setEmail('');
      setPassword('');
    } catch (error) {
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
    <div className="register-container">
      <h2>Crear cuenta de profesor</h2>
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
        <button type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      {mensaje && <p role="status">{mensaje}</p>}
    </div>
  );
}

