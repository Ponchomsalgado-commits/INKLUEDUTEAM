import { useRef, useState } from "react";
import { ICONOS_SKIN } from "./shared/iconosSkin";
import { temaDeSkin } from "./shared/temaSkin";
import { AJUSTES_POR_DEFECTO } from "./shared/ajustesLectura";

// Lienzo: así se ve la actividad (título y preguntas) con el tema de su plantilla.
// Por defecto muestra todas las preguntas como bloques en rejilla (editor).
// Con paginado muestra una pregunta por página con navegación (previsualización de alumno).
export default function LienzoActividad({
  titulo,
  preguntas,
  skin,
  mostrarCorrectas = false,
  paginado = false,
  letra = AJUSTES_POR_DEFECTO.letra,
  espaciado = AJUSTES_POR_DEFECTO.espaciado,
}) {
  const [pagina, setPagina] = useState(0);
  const bloqueRef = useRef(null);

  const total = preguntas.length;
  const actual = Math.min(pagina, Math.max(total - 1, 0));

  const irA = (indice) => {
    setPagina(Math.min(Math.max(indice, 0), total - 1));
    // El foco sigue al contenido nuevo para quien navega con teclado o lector de pantalla
    requestAnimationFrame(() => bloqueRef.current?.focus());
  };

  const bloque = (p, i, conRef = false) => (
    <div
      key={p.id}
      className="bloque"
      ref={conRef ? bloqueRef : undefined}
      tabIndex={conRef ? -1 : undefined}
    >
      <h3>Pregunta {i + 1}</h3>
      <p>{p.pregunta || "Escribe aquí la pregunta."}</p>
      <ul className="bloque-opciones">
        {p.opciones.map((o, j) => (
          <li key={j}>
            {o.texto || `Opción ${j + 1}`}
            {mostrarCorrectas && o.correcta ? " ✓" : ""}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      className={`lienzo tema-${temaDeSkin(skin)}${espaciado ? " amplio" : ""}`}
      style={{ fontSize: `${letra}px` }}
      aria-label="Vista de la actividad"
    >
      <h2>
        <span aria-hidden="true">{ICONOS_SKIN[skin] ?? "🎮"}</span> {titulo || "Sin título"}
      </h2>

      {total === 0 && <p className="vacio">Sin preguntas</p>}

      {paginado && total > 0 ? (
        <>
          <p className="solo-lectores" role="status" aria-live="polite">
            Pregunta {actual + 1} de {total}
          </p>

          <div className="bloques una">{bloque(preguntas[actual], actual, true)}</div>

          <nav className="paginas" aria-label="Preguntas de la actividad">
            <button
              type="button"
              className="boton boton-sec"
              onClick={() => irA(actual - 1)}
              disabled={actual === 0}
            >
              ‹ Anterior
            </button>

            <ol className="paginas-numeros">
              {preguntas.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="pagina-numero"
                    aria-label={`Ir a la pregunta ${i + 1}`}
                    aria-current={i === actual ? "page" : undefined}
                    onClick={() => irA(i)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ol>

            <button
              type="button"
              className="boton boton-sec"
              onClick={() => irA(actual + 1)}
              disabled={actual === total - 1}
            >
              Siguiente ›
            </button>
          </nav>

          <p className="paginas-indicador" aria-hidden="true">
            Pregunta {actual + 1} de {total}
          </p>
        </>
      ) : (
        <div className="bloques">{preguntas.map((p, i) => bloque(p, i))}</div>
      )}
    </section>
  );
}
