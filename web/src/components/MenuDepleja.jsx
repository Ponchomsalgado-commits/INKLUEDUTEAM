import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

// Menú lateral desplegable para navegar la web con sesión iniciada.
// Cerrado queda una pestaña en el borde izquierdo; abierto se muestra encima del contenido
// y se cierra al elegir una opción, al tocar fuera o con Escape.

const OPCIONES = [
  { to: '/galeria', texto: 'Galería', icono: '🖼️' },
  { to: '/editor', texto: 'Editor', icono: '✏️' },
  { to: '/grupos', texto: 'Grupos', icono: '👥' },
  { to: '/individual', texto: 'Individual', icono: '👤' },
  { to: '/calendario', texto: 'Calendario', icono: '📅' },
];

export default function MenuDepleja() {
  const { pathname } = useLocation();
  // Ruta en la que se abrió el menú (null = cerrado). Si la página cambia, el menú
  // queda cerrado solo, sin necesidad de un efecto.
  const [abiertoEn, setAbiertoEn] = useState(null);
  const abierto = abiertoEn === pathname;
  const cerrar = () => setAbiertoEn(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (e) => {
      if (e.key === 'Escape') setAbiertoEn(null);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto]);

  return (
    <>
      {abierto && <div className="menu-fondo" onClick={cerrar} aria-hidden="true" />}

      <aside className={`menu-lateral${abierto ? ' abierto' : ''}`}>
        <nav
          id="menu-principal"
          className="menu-opciones"
          aria-label="Navegación principal"
          inert={!abierto}
        >
          {OPCIONES.map((op) => (
            <NavLink key={op.to} to={op.to} className="menu-opcion">
              <span className="menu-opcion-icono" aria-hidden="true">
                {op.icono}
              </span>
              <span>{op.texto}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="menu-pestana"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => (abierto ? cerrar() : setAbiertoEn(pathname))}
        >
          <span aria-hidden="true">{abierto ? '‹' : '›'}</span>
        </button>
      </aside>
    </>
  );
}
