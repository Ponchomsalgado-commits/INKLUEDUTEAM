import { useState } from 'react';
import { Link } from 'react-router';
import '../styles/publico.css';

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

export default function Inicio() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div>
      <div className="pub-barra">
        <button
          type="button"
          className="boton-icono"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          aria-controls="panel-hamb"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          ☰
        </button>
        <nav
          className="pub-panel-hamb"
          id="panel-hamb"
          aria-label="Secciones de la página"
          hidden={!menuAbierto}
          onClick={() => setMenuAbierto(false)}
        >
          <a href="#que-somos">Qué somos</a>
          <a href="#como-empezamos">Cómo empezamos</a>
          <a href="#objetivo">Nuestro objetivo</a>
        </nav>
        <div className="pub-acciones">
          <Link className="boton boton-sec" to="/login">
            Iniciar sesión
          </Link>
          <Link className="boton" to="/register">
            Crear cuenta
          </Link>
        </div>
      </div>

      <header className="pub-hero">
        <h1>InkluEdu</h1>
        <LogoHuella />
        <p>Un proyecto educativo e inclusivo para todos.</p>
        <Link className="boton" to="/register">
          Empezar ahora
        </Link>
      </header>

      <section className="pub-seccion izq" id="que-somos">
        <h2>Qué somos</h2>
        <p>
          InkluEdu es una plataforma web para docentes y estudiantes. Permite crear materiales con
          diseños claros, organizar grupos y seguir el avance de cada alumno, pensando en quienes
          tienen TDAH y otras formas de aprender.
        </p>
      </section>

      <section className="pub-seccion der" id="como-empezamos">
        <h2>Cómo empezamos</h2>
        <p>
          Empezamos como un proyecto escolar en equipo, con una pregunta sencilla: ¿cómo hacer que
          una actividad sea más fácil de seguir para un alumno que se distrae con facilidad? De esa
          pregunta salieron las plantillas, el calendario y el seguimiento individual.
        </p>
      </section>

      <section className="pub-seccion izq" id="objetivo">
        <h2>Nuestro objetivo</h2>
        <p>
          Que cada alumno aprenda a su ritmo y que cada docente dedique menos tiempo a preparar
          materiales y más tiempo a acompañar.
        </p>
      </section>

      <footer className="pub-pie">InkluEdu · Proyecto educativo</footer>
    </div>
  );
}
