import apiClient from "./apiClient";

// llamadas al backend para el catálogo de plantillas de minijuego (game_templates)

// Plantillas fijas mientras el backend no tenga la ruta. Mismo formato que devolverá
// GET /templates: { id, type, skin, display_name, schema_json }.
// schema_json describe de forma declarativa el formulario que llena el profesor:
// cada campo de "fields" tiene type ("text" | "number" | "list"), label y reglas opcionales.
// Provisional: reemplazar cuando esté definida la estructura final.
export const PLANTILLAS_PROVISIONALES = [
  {
    id: "rana",
    type: "SALTO",
    skin: "rana",
    display_name: "Rana saltarina",
    schema_json: {
      fields: {
        title: { type: "text", label: "Título del juego", required: true },
        question: { type: "text", label: "Pregunta", required: true },
        options: { type: "list", label: "Respuestas (nenúfares)", min: 2, max: 4 },
        correctOption: { type: "number", label: "Número de la respuesta correcta", min: 1 },
      },
    },
  },
  {
    id: "mariposa",
    type: "RECOLECTAR",
    skin: "mariposa",
    display_name: "Mariposa viajera",
    schema_json: {
      fields: {
        title: { type: "text", label: "Título del juego", required: true },
        instruction: { type: "text", label: "Instrucción", required: true },
        items: { type: "list", label: "Flores a recolectar", min: 1, max: 6 },
        timeLimit: { type: "number", label: "Tiempo límite (segundos)", min: 10 },
      },
    },
  },
];

// GET /templates -> lista las plantillas de minijuego disponibles.
// Pendiente en backend: hoy no existe esta ruta, así que si la petición falla
// se usan las plantillas provisionales.(claude)
export async function obtenerPlantillas() {
  try {
    const response = await apiClient.get("/templates");
    return Array.isArray(response.data) ? response.data : PLANTILLAS_PROVISIONALES;
  } catch {
    return PLANTILLAS_PROVISIONALES;
  }
}
