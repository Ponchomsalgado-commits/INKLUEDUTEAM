import { estadoDe } from '../assignments/assignment-status';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContextoIntento,
  constanciaDiaria,
  diaLocal,
  entregaPuntual,
  primerPaso,
  racha,
  rachaActual,
  todoCorrecto,
} from './badge-rules';

const ctx = (extra: Partial<ContextoIntento> = {}): ContextoIntento => ({
  studentId: 'alumno-1',
  activityId: 'act-1',
  progressId: 'prog-1',
  score: 2,
  total: 3,
  submittedAt: new Date('2026-11-10T18:00:00Z'), // 12:00 en Ciudad de México
  ...extra,
});

function prismaFalso(datos: {
  previas?: number;
  asignaciones?: { createdAt: Date; dueDate: Date }[];
  intentosMismaActividad?: { score: number; totalPreguntas: number }[];
  entregas?: Date[];
}) {
  return {
    progress: {
      count: jest.fn().mockResolvedValue(datos.previas ?? 0),
      findMany: jest.fn().mockImplementation(({ where }: { where: { activityId?: string } }) =>
        Promise.resolve(
          where.activityId
            ? (datos.intentosMismaActividad ?? [])
            : (datos.entregas ?? []).map((submittedAt) => ({ submittedAt })),
        ),
      ),
    },
    assignment: { findMany: jest.fn().mockResolvedValue(datos.asignaciones ?? []) },
  } as unknown as PrismaService;
}

describe('estado de una asignación', () => {
  const vence = new Date('2026-11-10T00:00:00Z');
  it('entregada es completado aunque esté vencida', () => {
    expect(estadoDe(vence, new Date('2026-11-12'), new Date('2026-11-12'))).toBe('completado');
  });
  it('sin entregar y vencida es atrasado', () => {
    expect(estadoDe(vence, null, new Date('2026-11-11'))).toBe('atrasado');
  });
  it('sin entregar y a tiempo es pendiente', () => {
    expect(estadoDe(vence, null, new Date('2026-11-09'))).toBe('pendiente');
  });
});

describe('días y rachas', () => {
  it('usa el día de la zona horaria de la app, no el de UTC', () => {
    // 02:00 UTC del 11 todavía es el 10 en Ciudad de México
    expect(diaLocal(new Date('2026-11-11T02:00:00Z'), 'America/Mexico_City')).toBe('2026-11-10');
  });
  it('cuenta días seguidos hacia atrás desde hoy', () => {
    expect(rachaActual(['2026-11-08', '2026-11-09', '2026-11-10'], '2026-11-10')).toBe(3);
  });
  it('si hoy no hubo entrega, la racha de ayer sigue viva', () => {
    expect(rachaActual(['2026-11-08', '2026-11-09'], '2026-11-10')).toBe(2);
  });
  it('un hueco corta la racha', () => {
    expect(rachaActual(['2026-11-06', '2026-11-08'], '2026-11-08')).toBe(1);
  });
  it('sin entregas la racha es 0', () => {
    expect(rachaActual([], '2026-11-08')).toBe(0);
  });
});

describe('reglas de insignias', () => {
  it('primer paso se otorga una sola vez', async () => {
    expect(await primerPaso.evaluate(ctx(), null, prismaFalso({}))).toBe(1);
    expect(await primerPaso.evaluate(ctx(), 1, prismaFalso({}))).toBeNull();
  });

  it('al día: suma si se resolvió el mismo día de la publicación', async () => {
    const prisma = prismaFalso({
      asignaciones: [{ createdAt: new Date('2026-11-10T15:00:00Z'), dueDate: new Date('2026-11-20') }],
    });
    expect(await constanciaDiaria.evaluate(ctx(), 2, prisma)).toBe(3);
  });

  it('al día: no suma si se publicó otro día', async () => {
    const prisma = prismaFalso({
      asignaciones: [{ createdAt: new Date('2026-11-08T15:00:00Z'), dueDate: new Date('2026-11-20') }],
    });
    expect(await constanciaDiaria.evaluate(ctx(), null, prisma)).toBeNull();
  });

  it('al día y puntual: los reintentos de la misma actividad no suman', async () => {
    const prisma = prismaFalso({
      previas: 1,
      asignaciones: [{ createdAt: new Date('2026-11-10T15:00:00Z'), dueDate: new Date('2026-11-20') }],
    });
    expect(await constanciaDiaria.evaluate(ctx(), null, prisma)).toBeNull();
    expect(await entregaPuntual.evaluate(ctx(), null, prisma)).toBeNull();
  });

  it('puntual: solo antes de la fecha límite', async () => {
    const aTiempo = prismaFalso({
      asignaciones: [{ createdAt: new Date('2026-11-01'), dueDate: new Date('2026-11-11') }],
    });
    const tarde = prismaFalso({
      asignaciones: [{ createdAt: new Date('2026-11-01'), dueDate: new Date('2026-11-09') }],
    });
    expect(await entregaPuntual.evaluate(ctx(), null, aTiempo)).toBe(1);
    expect(await entregaPuntual.evaluate(ctx(), null, tarde)).toBeNull();
  });

  it('todo correcto: solo con score perfecto y sin contar reintentos ya perfectos', async () => {
    expect(await todoCorrecto.evaluate(ctx(), null, prismaFalso({}))).toBeNull();
    expect(await todoCorrecto.evaluate(ctx({ score: 3 }), 1, prismaFalso({}))).toBe(2);
    const yaPerfecta = prismaFalso({ intentosMismaActividad: [{ score: 3, totalPreguntas: 3 }] });
    expect(await todoCorrecto.evaluate(ctx({ score: 3 }), 1, yaPerfecta)).toBeNull();
  });

  it('racha: desde 2 días seguidos y nunca baja', async () => {
    const dosDias = prismaFalso({
      entregas: [new Date('2026-11-09T18:00:00Z'), new Date('2026-11-10T18:00:00Z')],
    });
    expect(await racha.evaluate(ctx(), null, dosDias)).toBe(2);
    expect(await racha.evaluate(ctx(), 5, dosDias)).toBeNull();
    const unDia = prismaFalso({ entregas: [new Date('2026-11-10T18:00:00Z')] });
    expect(await racha.evaluate(ctx(), null, unDia)).toBeNull();
  });
});
