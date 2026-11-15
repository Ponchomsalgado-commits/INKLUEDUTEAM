import { useState } from 'react';
import { NavLink } from 'react-router';

// Menú lateral con sesión iniciada. Se contrae a solo iconos con el botón de abajo;
// en pantallas angostas empieza contraído.

const OPCIONES = [
  { to: '/galeria', texto: 'Galería', icono: '🖼️' },
  { to: '/editor', texto: 'Editor', icono: '✏️' },
  { to: '/grupos', texto: 'Grupos', icono: '👥' },
  { to: '/individual', texto: 'Individual', icono: '👤' },
  { to: '/calendario', texto: 'Calendario', icono: '📅' },
];

export default function MenuDepleja() {
  const [cerrado, setCerrado] = useState(() => window.innerWidth < 720);

  return (
    <nav className={`menu${cerrado ? ' cerrado' : ''}`} aria-label="Menú principal">
      {OPCIONES.map((op) => (
        <NavLink key={op.to} to={op.to} title={op.texto}>
          <span className="icono" aria-hidden="true">
            {op.icono}
          </span>
          <span className="texto">{op.texto}</span>
        </NavLink>
      ))}

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={!cerrado}
        aria-label={cerrado ? 'Expandir menú' : 'Contraer menú'}
        onClick={() => setCerrado((v) => !v)}
      >
        {cerrado ? '›' : '‹'}
      </button>
    </nav>
  );
}
