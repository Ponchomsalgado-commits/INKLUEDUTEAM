import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';

// Encabezado: marca con huellita a la izquierda y, a la derecha, el botón de ajustes
// (con sesión) o los botones de acceso (sin sesión, solo en el inicio).

function LogoHuella() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="12" cy="28" r="7" />
      <circle cx="26" cy="15" r="7" />
      <circle cx="42" cy="15" r="7" />
      <circle cx="56" cy="28" r="7" />
      <path d="M32 31c-10 0-18 9-18 16 0 6 5 9 11 8 3-1 5-2 7-2s4 1 7 2c6 1 11-2 11-8 0-7-8-16-18-16z" />
    </svg>
  );
}

function leerAjustes() {
  try {
    return JSON.parse(localStorage.getItem('ajustes') || '{}');
  } catch {
    return {};
  }
}

function aplicarAjustes(ajustes) {
  document.documentElement.style.fontSize = ajustes.letra || '100%';
  document.documentElement.classList.toggle('contraste', Boolean(ajustes.contraste));
}

function Ajustes() {
  const { cerrarSesion } = useAuth();
  const ventana = useRef(null);
  const [ajustes, setAjustes] = useState(leerAjustes);

  useEffect(() => {
    aplicarAjustes(ajustes);
    try {
      localStorage.setItem('ajustes', JSON.stringify(ajustes));
    } catch {
      // sin almacenamiento disponible: los ajustes valen solo para esta visita
    }
  }, [ajustes]);

  return (
    <>
      <button
        type="button"
        className="boton-icono"
        aria-label="Abrir ajustes"
        onClick={() => ventana.current?.showModal()}
      >
        ⚙️
      </button>

      <dialog ref={ventana} aria-labelledby="ajustes-titulo">
        <div className="dialogo-cab">
          <h2 id="ajustes-titulo">Ajustes</h2>
          <button
            type="button"
            className="boton-icono"
            aria-label="Cerrar ajustes"
            onClick={() => ventana.current?.close()}
          >
            ✕
          </button>
        </div>
        <div className="dialogo-cuerpo">
          <label className="campo">
            <span>Tamaño de letra</span>
            <select
              value={ajustes.letra || '100%'}
              onChange={(e) => setAjustes((a) => ({ ...a, letra: e.target.value }))}
            >
              <option value="100%">Normal</option>
              <option value="115%">Grande</option>
              <option value="130%">Muy grande</option>
            </select>
          </label>
          <label className="campo">
            <span>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={Boolean(ajustes.contraste)}
                onChange={(e) => setAjustes((a) => ({ ...a, contraste: e.target.checked }))}
              />{' '}
              Alto contraste
            </span>
          </label>
          <Link
            to="/inicio"
            className="boton boton-sec"
            onClick={() => {
              ventana.current?.close();
              cerrarSesion();
            }}
          >
            Cerrar sesión
          </Link>
        </div>
      </dialog>
    </>
  );
}

export default function BarraSuperior() {
  const { haySesion } = useAuth();

  // Los ajustes guardados se aplican aunque no haya sesión
  useEffect(() => {
    if (!haySesion) aplicarAjustes(leerAjustes());
  }, [haySesion]);

  return (
    <header className="encabezado">
      <Link to="/" className="marca" aria-label="InkluEdu, ir al inicio">
        InkluEdu <LogoHuella />
      </Link>

      {haySesion && <Ajustes />}
    </header>
  );
}
