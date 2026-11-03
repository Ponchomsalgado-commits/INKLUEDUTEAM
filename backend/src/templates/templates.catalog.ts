import type { TemplateSchema } from '../activities/content-schema/schema-validator';

/**
 * Catálogo fijo de plantillas (lo mantiene el equipo; ver sección 1.11 del documento técnico).
 * Cada tema visual (skin) es una entrada separada del catálogo; type + skin es único.
 * Al arrancar la API, TemplatesService sincroniza esta lista con la tabla game_templates.
 *
 * Agregar un skin nuevo = una entrada aquí + una carpeta de assets en mobile/assets/minigames/<skin>/.
 * Agregar una mecánica nueva (type) = un schema nuevo aquí + un widget nuevo en Flutter.
 *(CLAUDE)
 * */

// Mecánica "toca el objetivo correcto entre 3". La comparten todos los skins de este type.
export const SELECCIONAR_OBJETIVO_SCHEMA: TemplateSchema = {
  type: 'seleccionar_objetivo',
  fields: {
    preguntas: {
      type: 'array',
      minItems: 1,
      maxItems: 10, // máximo de preguntas por actividad (decisión pendiente de confirmar con el equipo)
      items: {
        type: 'object',
        fields: {
          id: { type: 'string', maxLength: 64, autoId: true },
          pregunta: { type: 'string', maxLength: 240 },
          opciones: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            exactlyOne: 'correcta', // exactamente una correcta POR pregunta
            items: {
              type: 'object',
              fields: {
                texto: { type: 'string', maxLength: 120 },
                correcta: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
};

export interface CatalogEntry {
  type: string;
  skin: string;
  displayName: string;
  schemaJson: TemplateSchema;
}

export const TEMPLATE_CATALOG: CatalogEntry[] = [
  {
    type: 'seleccionar_objetivo',
    skin: 'rana_nenufar',
    displayName: 'Rana y sus nenúfares',
    schemaJson: SELECCIONAR_OBJETIVO_SCHEMA,
  },
  {
    type: 'seleccionar_objetivo',
    skin: 'mariposa_flor',
    displayName: 'Mariposa y sus flores',
    schemaJson: SELECCIONAR_OBJETIVO_SCHEMA,
  },
];