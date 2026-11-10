import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';

// Barra superior: logo de InkluEdu a la izquierda y, a la derecha, el engrane de ajustes
// (con sesión) o los botones Unirse/Registrarse (sin sesión, solo en el inicio).

function LogoHuella() {
  return (
    <svg className="logo-huella" viewBox="0 0 64 56" aria-hidden="true">
      <circle cx="12" cy="20" r="7" />
      <circle cx="26" cy="9" r="7" />
      <circle cx="40" cy="9" r="7" />
      <circle cx="54" cy="20" r="7" />
      <ellipse cx="33" cy="39" rx="16" ry="14" />
    </svg>
  );
}

function MenuAjustes() {
  const { cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClicFuera = (e) => {
      if (!contenedor.current?.contains(e.target)) setAbierto(false);
    };
    const alPresionar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    window.addEventListener('keydown', alPresionar);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      window.removeEventListener('keydown', alPresionar);
    };
  }, [abierto]);

  return (
    <div className="ajustes" ref={contenedor}>
      <button
        type="button"
        className="btn-ajustes"
        aria-label="Ajustes"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={() => setAbierto((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.47.47 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
        </svg>
      </button>

      {abierto && (
        <div className="ajustes-menu" role="menu">
          <Link to="/inicio" role="menuitem" onClick={cerrarSesion}>
            Cerrar sesión
          </Link>
        </div>
      )}
    </div>
  );
}

export default function BarraSuperior({ mostrarAcceso }) {
  const { haySesion } = useAuth();

  return (
    <header className="barra-app">
      <Link to="/" className="logo-app" aria-label="InkluEdu, ir al inicio">
        <span className="logo-texto">INKLUEDU</span>
        <LogoHuella />
      </Link>

      {haySesion ? (
        <MenuAjustes />
      ) : (
        mostrarAcceso && (
          <nav className="inicio-acciones" aria-label="Acceso">
            <Link to="/login" className="btn-inicio btn-inicio-secundario">
              Unirse
            </Link>
            <Link to="/register" className="btn-inicio btn-inicio-principal">
              Registrarse
            </Link>
          </nav>
        )
      )}
    </header>
  );
}
