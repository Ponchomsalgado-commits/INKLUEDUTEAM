import { useState } from 'react';

export default function Login() {
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje('');
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-matricula">Matrícula</label>
          <input 
            id="login-matricula"
            type="text" 
            value={matricula} 
            onChange={(e) => setMatricula(e.target.value)} 
            placeholder="Ingresa tu matrícula"
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
            placeholder="********"
            required 
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
      {mensaje && <p role="status">{mensaje}</p>}
    </div>
  );
}