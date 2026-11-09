import { formatearFechaCorta } from "./shared/fechas";

// Íconos de las insignias: el backend manda palabras genéricas (rocket, calendar, clock, star, flame)
const ICONOS_INSIGNIA = {
  rocket: "🚀",
  calendar: "📅",
  clock: "⏰",
  star: "⭐",
  flame: "🔥",
};

function iconoInsignia(icono) {
  return ICONOS_INSIGNIA[icono] ?? "🏅";
}

// Insignias de un alumno como "chips". Con conDescripcion muestra el texto motivador de cada una.
export default function ListaInsignias({ insignias, conDescripcion = false, textoVacio }) {
  if (!insignias || insignias.length === 0) {
    return <p className="insignias-vacio">{textoVacio ?? "Sus insignias aparecerán aquí."}</p>;
  }

  return (
    <ul className="lista-insignias">
      {insignias.map((insignia) => (
        <li key={insignia.code} className="insignia">
          <span className="insignia-icono" aria-hidden="true">
            {iconoInsignia(insignia.icon)}
          </span>
          <span className="insignia-texto">
            <strong>{insignia.name}</strong>
            {insignia.streakCount > 1 && <span className="insignia-veces"> ×{insignia.streakCount}</span>}
            {conDescripcion && insignia.description && <small>{insignia.description}</small>}
            <small>Obtenida el {formatearFechaCorta(insignia.awardedAt)}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
