// src/components/HealthCheck.jsx
import { useState } from "react";
import api from"../services/client.js";

export default function HealthCheck() {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function probar() {
    setCargando(true);
    setResultado(null);

    try {
      const res = await api.get("/v1/health");
      setResultado({
        ok: true,
        status: res.status,
        statusText: res.statusText,
        data: res.data,
      });
    } catch (error) {
      if (error.response) {
        // El servidor respondió, pero con error (400, 404, 500, 503...)
        setResultado({
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      } else {
        // No hubo respuesta (servidor apagado, sin red, timeout...)
        setResultado({
          ok: false,
          status: null,
          statusText: "Sin respuesta del servidor",
          data: error.message,
        });
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h2>Prueba de conexión</h2>
      <button onClick={probar} disabled={cargando}>
        {cargando ? "Probando..." : "Probar /api/v1/health"}
      </button>

      {resultado && (
        <div>
          <p>
            Estado HTTP: <strong>{resultado.status ?? "N/A"}</strong>{" "}
            {resultado.statusText} {resultado.ok ? "✅" : "❌"}
          </p>
          <pre>{JSON.stringify(resultado.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}