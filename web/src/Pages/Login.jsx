import { useState } from 'react';
import { login } from '../auth/authService';

export default function Login() {
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
      await login(email, password);
      setMensaje('Inicio de sesión correcto');
      // Recargar la página es seguro: apiClient renueva el access_token con el refresh_token
      window.location.assign('/salones');
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
    <section className="tarjeta auth-card">
      <h2>¡Hola! ¿Listo para aprender?</h2>
      <p className="auth-subtitulo">Inicia sesión para continuar</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@escuela.mx"
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn-principal" disabled={cargando}>
          <span aria-hidden="true">✏️</span>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {mensaje && (
        <p role="status" className={esError ? 'mensaje mensaje-error' : 'mensaje mensaje-ok'}>
          {mensaje}
        </p>
      )}
      <p className="auth-cambio">
        ¿No tienes cuenta? <a href="/register">Regístrate</a>
      </p>
    </section>
  );
}
