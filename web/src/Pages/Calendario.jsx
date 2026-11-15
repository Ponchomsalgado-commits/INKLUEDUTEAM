import { useState } from 'react';
import '../styles/calendario.css';

// Calendario solo visual: todavía no está definido qué eventos mostrará
// (fechas límite de actividades, tutorías, ...). Por ahora solo navega entre meses.

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function diasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const huecos = (primero.getDay() + 6) % 7; // semana empieza en lunes
  const total = new Date(anio, mes + 1, 0).getDate();
  const celdas = Array.from({ length: huecos }, () => null);
  for (let d = 1; d <= total; d += 1) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export default function Calendario() {
  const hoy = new Date();
  const [vista, setVista] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });

  const mover = (delta) =>
    setVista(({ anio, mes }) => {
      const fecha = new Date(anio, mes + delta, 1);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
    });

  const titulo = new Date(vista.anio, vista.mes, 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
  const esMesActual = vista.anio === hoy.getFullYear() && vista.mes === hoy.getMonth();

  return (
    <div className="cal-pagina">
      <h1 className="titulo-pagina">Calendario</h1>
      <p className="cal-intro">Vista previa. Pronto aquí verás las fechas de tus actividades y tutorías.</p>

      <section aria-label={`Calendario de ${titulo}`}>
        <div className="cal-cab">
          <button type="button" className="boton boton-sec" onClick={() => mover(-1)} aria-label="Mes anterior">
            ‹ Anterior
          </button>
          <h2>{titulo}</h2>
          <button type="button" className="boton boton-sec" onClick={() => mover(1)} aria-label="Mes siguiente">
            Siguiente ›
          </button>
        </div>

        <div className="cal">
          {DIAS.map((d) => (
            <div key={d} className="cal-semana">
              {d}
            </div>
          ))}
          {diasDelMes(vista.anio, vista.mes).map((dia, i) => (
            <div
              key={i}
              className={dia ? `cal-dia${esMesActual && dia === hoy.getDate() ? ' hoy' : ''}` : 'cal-vacio'}
            >
              {dia ? <span className="numero">{dia}</span> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
