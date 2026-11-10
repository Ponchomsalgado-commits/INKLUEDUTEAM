// Ajustes de lectura del lienzo (tamaño de letra y espacio entre bloques).
// El backend rechaza campos extra en contentJson, así que se guardan en este navegador, por actividad.

export const AJUSTES_POR_DEFECTO = { letra: 20, espaciado: false };

const clave = (actividadId) => `ajustesActividad:${actividadId}`;

export function leerAjustes(actividadId) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(actividadId)));
    if (guardado) return { ...AJUSTES_POR_DEFECTO, ...guardado };
  } catch {
    // sin localStorage o con datos dañados se usan los valores por defecto
  }
  return AJUSTES_POR_DEFECTO;
}

export function guardarAjustes(actividadId, ajustes) {
  try {
    localStorage.setItem(clave(actividadId), JSON.stringify(ajustes));
  } catch {
    // si el navegador no deja guardar, los ajustes solo valen en esta sesión
  }
}
