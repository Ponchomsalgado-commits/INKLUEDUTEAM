import { SELECCIONAR_OBJETIVO_SCHEMA } from '../../templates/templates.catalog';
import { ContentValidationError, validateContent } from './schema-validator';

const opciones = (correctas: boolean[]) =>
  correctas.map((correcta, i) => ({ texto: `Opción ${i + 1}`, correcta }));

const pregunta = (correctas: boolean[] = [true, false, false]) => ({
  pregunta: '¿Cuál es la capital de Francia?',
  opciones: opciones(correctas),
});

const validar = (content: unknown) => validateContent(SELECCIONAR_OBJETIVO_SCHEMA, content);

function errorDe(content: unknown): ContentValidationError {
  try {
    validar(content);
  } catch (e) {
    return e as ContentValidationError;
  }
  throw new Error('Se esperaba un error de validación');
}

describe('validateContent (seleccionar_objetivo)', () => {
  it('acepta un contenido válido, recorta textos y genera un id por pregunta', () => {
    const r = validar({ preguntas: [{ ...pregunta(), pregunta: '  ¿Capital?  ' }, pregunta([false, true, false])] });
    const preguntas = r.preguntas as Array<{ id: string; pregunta: string }>;

    expect(preguntas).toHaveLength(2);
    expect(preguntas[0].pregunta).toBe('¿Capital?');
    expect(preguntas[0].id).toBeTruthy();
    expect(preguntas[0].id).not.toBe(preguntas[1].id);
  });

  it('conserva los ids que ya traían las preguntas (edición estable)', () => {
    const r = validar({ preguntas: [{ id: 'p-1', ...pregunta() }] });
    expect((r.preguntas as Array<{ id: string }>)[0].id).toBe('p-1');
  });

  it('rechaza ids repetidos', () => {
    const e = errorDe({ preguntas: [{ id: 'x', ...pregunta() }, { id: 'x', ...pregunta() }] });
    expect(e.field).toBe('preguntas[1].id');
  });

  it('dice exactamente qué campo falta', () => {
    const e = errorDe({ preguntas: [{ opciones: opciones([true, false, false]) }] });
    expect(e.field).toBe('preguntas[0].pregunta');
    expect(e.message).toContain("'preguntas[0].pregunta'");
  });

  it('aplica exactamente_una_correcta por CADA pregunta, no una vez global', () => {
    // La pregunta 0 está bien; la 1 tiene dos correctas: el error debe señalar la 1
    const e = errorDe({ preguntas: [pregunta([true, false, false]), pregunta([true, true, false])] });
    expect(e.field).toBe('preguntas[1].opciones');
    expect(e.message).toContain('exactamente una opción correcta');
  });

  it('rechaza una pregunta sin ninguna opción correcta', () => {
    expect(errorDe({ preguntas: [pregunta([false, false, false])] }).field).toBe('preguntas[0].opciones');
  });

  it('exige al menos 1 pregunta y respeta el máximo de la plantilla', () => {
    expect(errorDe({ preguntas: [] }).field).toBe('preguntas');
    const demasiadas = Array.from({ length: 11 }, () => pregunta());
    expect(errorDe({ preguntas: demasiadas }).message).toContain('como máximo 10');
  });

  it('acepta de 2 a 5 opciones por pregunta', () => {
    expect(() => validar({ preguntas: [{ pregunta: 'X', opciones: opciones([true, false]) }] })).not.toThrow();
    expect(() =>
      validar({ preguntas: [{ pregunta: 'X', opciones: opciones([true, false, false, false, false]) }] }),
    ).not.toThrow();
  });

  it('rechaza una pregunta con 1 opción o con más de 5', () => {
    expect(errorDe({ preguntas: [{ pregunta: 'X', opciones: opciones([true]) }] }).field).toBe('preguntas[0].opciones');
    const e = errorDe({
      preguntas: [{ pregunta: 'X', opciones: opciones([true, false, false, false, false, false]) }],
    });
    expect(e.field).toBe('preguntas[0].opciones');
    expect(e.message).toContain('como máximo 5');
  });

  it('rechaza textos vacíos, demasiado largos y tipos incorrectos', () => {
    expect(errorDe({ preguntas: [{ ...pregunta(), pregunta: '   ' }] }).message).toContain('vacío');
    expect(errorDe({ preguntas: [{ ...pregunta(), pregunta: 'a'.repeat(241) }] }).message).toContain('240');
    const mala = { pregunta: 'X', opciones: [{ texto: 'a', correcta: 'si' }, ...opciones([false, false])] };
    expect(errorDe({ preguntas: [mala] }).field).toBe('preguntas[0].opciones[0].correcta');
  });

  it('rechaza campos que la plantilla no define (incluido el campo "skin")', () => {
    expect(errorDe({ preguntas: [pregunta()], skin: 'rana_nenufar' }).field).toBe('skin');
    expect(errorDe({ preguntas: [{ ...pregunta(), extra: 1 }] }).field).toBe('preguntas[0].extra');
  });

  it('rechaza contenido que no es un objeto', () => {
    expect(errorDe(null).field).toBe('contentJson');
    expect(errorDe([]).field).toBe('contentJson');
  });
});
