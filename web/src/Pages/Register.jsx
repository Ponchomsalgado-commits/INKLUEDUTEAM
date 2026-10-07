import { useState } from 'react';

export default function Register() {
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [celular, setCelular] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje('');
  };

  return (
    <div className="register-container">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-matricula">Matrícula</label>
          <input 
            id="register-matricula"
            type="text" 
            value={matricula} 
            onChange={(e) => setMatricula(e.target.value)} 
            placeholder="Tu matrícula"
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Correo electrónico</label>
          <input 
            id="register-email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="correo@ejemplo.com"
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
            placeholder="********"
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-celular">Celular</label>
          <input 
            id="register-celular"
            type="tel" 
            value={celular} 
            onChange={(e) => setCelular(e.target.value)} 
            placeholder="10 dígitos"
            required 
          />
        </div>
        <button type="submit">Registrarse</button>
      </form>
      {mensaje && <p role="status">{mensaje}</p>}
    </div>
  );
}