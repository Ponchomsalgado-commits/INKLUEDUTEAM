import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { obtenerActividad } from "../services/activityService";
import LienzoActividad from "../components/LienzoActividad";
import { leerAjustes } from "../components/shared/ajustesLectura";
import "../styles/editor.css";

// Vista previa de solo lectura tal como la verá el alumno: preguntas y opciones, sin respuesta correcta ni envío.
// Se abre desde "Editar" o "Mis actividades" con ?actividad=ID.(claude)

export default function PrevisualizarActividad() {
  const [params] = useSearchParams();
  const actividadId = params.get("actividad");
  const [actividad, setActividad] = useState(null);
  // Sin ID no hay nada que cargar: se arranca ya en "no cargando" en vez de cambiarlo dentro del efecto.
  const [cargando, setCargando] = useState(Boolean(actividadId));

  useEffect(() => {
    if (!actividadId) return;

    obtenerActividad(actividadId)
      .then(setActividad)
      .catch(() => setActividad(null))
      .finally(() => setCargando(false));
  }, [actividadId]);

  const enlaceVolver = (
    <Link to="/galeria" className="volver">
      ← Volver a la Galería
    </Link>
  );

  if (cargando) {
    return (
      <div className="actividad-pagina">
        <p role="status">Cargando vista previa...</p>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="actividad-pagina">
        {enlaceVolver}
        <p className="vacio">No encontramos esa actividad.</p>
      </div>
    );
  }

  const preguntas = actividad.contentJson?.preguntas ?? [];
  const ajustes = leerAjustes(actividadId);

  return (
    <div className="actividad-pagina">
      {enlaceVolver}

      <p className="vacio">Vista previa de alumno · solo lectura</p>
      <LienzoActividad
        titulo={actividad.title}
        preguntas={preguntas}
        paginado
        skin={actividad.template?.skin}
        letra={ajustes.letra}
        espaciado={ajustes.espaciado}
      />
    </div>
  );
}
