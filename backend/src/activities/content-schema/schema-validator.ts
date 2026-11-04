import { randomUUID } from 'crypto';

/**
 * Validador del content_json contra el schema_json de su plantilla (Sprint 3).
 * No depende de NestJS ni de la base de datos: es lógica pura y se prueba con Jest sin nada más.
 *
 * Formato de schema_json (compatible con el TemplateEditor de la web, que recorre `schema.fields`):
 *   { type: 'seleccionar_objetivo', fields: { preguntas: { type: 'array', minItems, maxItems, items: {...} } } }
 *
 * Reglas por campo: todos son obligatorios salvo `required: false`.
 *   string  -> minLength (1 por defecto: no se aceptan textos vacíos), maxLength
 *   integer / number -> min, max
 *   boolean
 *   array   -> minItems, maxItems, items, exactlyOne
 *   object  -> fields
 * Reglas especiales:
 *   exactlyOne: 'correcta'  -> en CADA arreglo, exactamente un elemento tiene esa clave en true
 *   autoId: true            -> si el cliente no manda el campo, el backend genera un UUID estable
 *                              (Sprint 4 valida respuestas por preguntaId, no por índice)
 * (CLAUDE)
 * */
export type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minItems?: number;
  maxItems?: number;
  items?: FieldDef;
  fields?: Record<string, FieldDef>;
  exactlyOne?: string;
  autoId?: boolean;
}

export interface TemplateSchema {
  type: string;
  fields: Record<string, FieldDef>;
}

/** `field` es la ruta dentro del contenido, p. ej. "preguntas[1].opciones". */
export class ContentValidationError extends Error {
  constructor(
    message: string,
    readonly field: string,
  ) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

const tieneClave = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const unirClave = (padre: string, clave: string) => (padre ? `${padre}.${clave}` : clave);

function falla(message: string, field: string): never {
  throw new ContentValidationError(message, field);
}

/** Devuelve el contenido normalizado (textos recortados, ids generados) o lanza ContentValidationError. */
export function validateContent(schema: TemplateSchema, content: unknown): Record<string, unknown> {
  if (!esObjeto(content)) {
    falla('El contenido debe ser un objeto JSON.', 'contentJson');
  }
  return validarObjeto({ type: 'object', fields: schema.fields }, content, '');
}

function validarObjeto(
  def: FieldDef,
  valor: Record<string, unknown>,
  ruta: string,
): Record<string, unknown> {
  const campos = def.fields ?? {};

  for (const clave of Object.keys(valor)) {
    if (!tieneClave(campos, clave)) {
      const campo = unirClave(ruta, clave);
      falla(`El campo '${campo}' no está permitido en esta plantilla.`, campo);
    }
  }

  const salida: Record<string, unknown> = {};
  for (const [clave, campoDef] of Object.entries(campos)) {
    let crudo = valor[clave];
    if (crudo === undefined && campoDef.autoId) crudo = randomUUID();
    const limpio = validarValor(campoDef, crudo, unirClave(ruta, clave));
    if (limpio !== undefined) salida[clave] = limpio;
  }
  return salida;
}

function validarValor(def: FieldDef, valor: unknown, ruta: string): unknown {
  if (valor === undefined || valor === null) {
    if (def.required === false) return undefined;
    falla(`El campo '${ruta}' es requerido.`, ruta);
  }

  switch (def.type) {
    case 'string':
      return validarTexto(def, valor, ruta);
    case 'integer':
    case 'number':
      return validarNumero(def, valor, ruta);
    case 'boolean':
      if (typeof valor !== 'boolean') falla(`El campo '${ruta}' debe ser verdadero o falso.`, ruta);
      return valor;
    case 'array':
      return validarArreglo(def, valor, ruta);
    case 'object':
      if (!esObjeto(valor)) falla(`El campo '${ruta}' debe ser un objeto.`, ruta);
      return validarObjeto(def, valor, ruta);
    default:
      throw new Error(`Tipo de campo desconocido en schema_json: ${String(def.type)}`);
  }
}

function validarTexto(def: FieldDef, valor: unknown, ruta: string): string {
  if (typeof valor !== 'string') falla(`El campo '${ruta}' debe ser texto.`, ruta);
  const texto = valor.trim();
  const minimo = def.minLength ?? 1;
  if (texto.length < minimo) {
    falla(
      minimo === 1
        ? `El campo '${ruta}' no puede estar vacío.`
        : `El campo '${ruta}' debe tener al menos ${minimo} caracteres.`,
      ruta,
    );
  }
  if (def.maxLength !== undefined && texto.length > def.maxLength) {
    falla(`El campo '${ruta}' no puede superar ${def.maxLength} caracteres.`, ruta);
  }
  return texto;
}

function validarNumero(def: FieldDef, valor: unknown, ruta: string): number {
  const valido =
    typeof valor === 'number' &&
    (def.type === 'integer' ? Number.isInteger(valor) : Number.isFinite(valor));
  if (!valido) {
    falla(`El campo '${ruta}' debe ser un número${def.type === 'integer' ? ' entero' : ''}.`, ruta);
  }
  const n = valor as number;
  if (def.min !== undefined && n < def.min) falla(`El campo '${ruta}' debe ser al menos ${def.min}.`, ruta);
  if (def.max !== undefined && n > def.max) falla(`El campo '${ruta}' no puede ser mayor que ${def.max}.`, ruta);
  return n;
}

function validarArreglo(def: FieldDef, valor: unknown, ruta: string): unknown[] {
  if (!Array.isArray(valor)) falla(`El campo '${ruta}' debe ser una lista.`, ruta);
  if (def.minItems !== undefined && valor.length < def.minItems) {
    falla(`El campo '${ruta}' debe tener al menos ${def.minItems} elemento(s).`, ruta);
  }
  if (def.maxItems !== undefined && valor.length > def.maxItems) {
    falla(`El campo '${ruta}' admite como máximo ${def.maxItems} elemento(s).`, ruta);
  }
  if (!def.items) throw new Error(`El schema_json del arreglo '${ruta}' no define "items".`);

  const elementos = valor.map((el, i) => validarValor(def.items as FieldDef, el, `${ruta}[${i}]`));

  // Regla exactamente_una_correcta: se aplica a ESTE arreglo (una vez por pregunta, no global)
  if (def.exactlyOne) {
    const marcadas = elementos.filter((el) => esObjeto(el) && el[def.exactlyOne as string] === true).length;
    if (marcadas !== 1) {
      falla(
        `El campo '${ruta}' debe tener exactamente una opción correcta (tiene ${marcadas}).`,
        ruta,
      );
    }
  }

  // Los campos autoId (p. ej. el id de cada pregunta) no pueden repetirse dentro del mismo arreglo
  for (const [clave, campoDef] of Object.entries(def.items.fields ?? {})) {
    if (!campoDef.autoId) continue;
    const vistos = new Set<unknown>();
    elementos.forEach((el, i) => {
      const id = esObjeto(el) ? el[clave] : undefined;
      if (vistos.has(id)) {
        falla(`El campo '${ruta}[${i}].${clave}' está repetido.`, `${ruta}[${i}].${clave}`);
      }
      vistos.add(id);
    });
  }

  return elementos;
}
