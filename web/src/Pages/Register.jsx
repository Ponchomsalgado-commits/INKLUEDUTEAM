import { useState } from "react";
import { register } from "../auth/authService";

const roles = [
  { valor: "ESTUDIANTE", texto: "Estudiante", icono: "🎒" },
  { valor: "PROFESOR", texto: "Profesor", icono: "🍎" },
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ESTUDIANTE");
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
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

      setEsError(false);
      setMensaje("Registro completado correctamente");
      setEmail("");
      setPassword("");
      setRole("ESTUDIANTE");
    } catch (error) {
      const errorBackend = error.response?.data?.message;

      setEsError(true);
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
    <section className="tarjeta auth-card">
      <h2>Crea tu cuenta</h2>
      <p className="auth-subtitulo">Únete a InkluEdu en un momento</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>

        <fieldset className="form-group selector-rol">
          <legend>¿Quién eres?</legend>
          <div className="opciones-rol">
            {roles.map((opcion) => (
              <label key={opcion.valor} className="opcion-rol">
                <input
                  type="radio"
                  name="role"
                  value={opcion.valor}
                  checked={role === opcion.valor}
                  onChange={(e) => setRole(e.target.value)}
                />
                <span className="opcion-rol-icono" aria-hidden="true">{opcion.icono}</span>
                <span>{opcion.texto}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn-principal" disabled={cargando}>
          <span aria-hidden="true">🚀</span>
          {cargando ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      {mensaje && (
        <p role="status" className={esError ? "mensaje mensaje-error" : "mensaje mensaje-ok"}>
          {mensaje}
        </p>
      )}
      <p className="auth-cambio">
        ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </section>
  );
}
