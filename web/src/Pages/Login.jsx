import { useState } from 'react';
import { login } from '../auth/authService.js';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);


    try {
      await login(email, password);
      setMensaje("Inicio de sesión correcto");
    } catch (error) {
      if (error.response?.status === 401) {
        setMensaje("Correo o contraseña incorrectos");
      } else {
        setMensaje("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  };


  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Correo electrónico</label>
          <input 
            id="login-email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Ingresa tu email"
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
            placeholder="12345678"
            required 
          />
        </div>
        <button type="submit" disabled={cargando}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
      {mensaje && <p role="status">{mensaje}</p>}
    </div>
  );
}