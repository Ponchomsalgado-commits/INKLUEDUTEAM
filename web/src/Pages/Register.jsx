
import { useState } from "react";
import { register } from "../auth/authService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ESTUDIANTE");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      await register({
        email,
        password,
        role,
      });

      setMensaje("Registro completado correctamente");
      setEmail("");
      setPassword("");
      setRole("ESTUDIANTE");
    } catch (error) {
      const errorBackend = error.response?.data?.message;

      setMensaje(
        Array.isArray(errorBackend)
          ? errorBackend.join(", ")
          : errorBackend || "No se pudo completar el registro"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear cuenta</h1>

      <label htmlFor="email">Correo electrónico</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />

      <label htmlFor="role">Tipo de usuario</label>
      <select
        id="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        required
      >
        <option value="ESTUDIANTE">Estudiante</option>
        <option value="PROFESOR">Profesor</option>
      </select>

      <button type="submit" disabled={cargando}>
        {cargando ? "Registrando..." : "Registrarse"}
      </button>

      {mensaje && <p role="status">{mensaje}</p>}
    </form>
  );
}