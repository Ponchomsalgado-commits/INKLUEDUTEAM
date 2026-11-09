import { PrismaService } from '../prisma/prisma.service';

/** Zona horaria con la que se decide "el mismo día" y los días de racha. */
export const ZONA_HORARIA = process.env.APP_TIMEZONE || 'America/Mexico_City';

/** Día calendario (AAAA-MM-DD) de una fecha en la zona horaria de la app. */
export function diaLocal(fecha: Date, zona = ZONA_HORARIA): string {
  return fecha.toLocaleDateString('en-CA', { timeZone: zona });
}

/** Días seguidos con al menos una entrega, contando hacia atrás desde `hoy` (o desde ayer si hoy no hubo). */
export function rachaActual(dias: Iterable<string>, hoy: string): number {
  const set = new Set(dias);
  const cursor = new Date(`${hoy}T12:00:00Z`);
  if (!set.has(hoy)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let racha = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    racha++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return racha;
}

export interface ContextoIntento {
  studentId: string;
  activityId: string;
  progressId: string;
  score: number;
  total: number;
  submittedAt: Date;
}

/**
 * Una regla decide si el intento otorga (o hace avanzar) su insignia.
 * Devuelve el nuevo `streakCount` o `null` si no aplica. Agregar una regla
 * es agregarla a BADGE_RULES; el código que guarda el progreso no cambia.
 */
export interface BadgeRule {
  badgeCode: string;
  evaluate(ctx: ContextoIntento, actual: number | null, prisma: PrismaService): Promise<number | null>;
}

/** ¿Es la primera entrega del estudiante para esta actividad? (los reintentos no suman) */
async function esPrimeraEntrega(ctx: ContextoIntento, prisma: PrismaService) {
  const previas = await prisma.progress.count({
    where: {
      studentId: ctx.studentId,
      activityId: ctx.activityId,
      id: { not: ctx.progressId },
      submittedAt: { lte: ctx.submittedAt },
    },
  });
  return previas === 0;
}

/** Asignaciones de esta actividad en los salones del estudiante. */
function asignacionesDelAlumno(ctx: ContextoIntento, prisma: PrismaService) {
  return prisma.assignment.findMany({
    where: {
      activityId: ctx.activityId,
      classroom: { members: { some: { studentId: ctx.studentId } } },
    },
    select: { createdAt: true, dueDate: true },
  });
}

export const primerPaso: BadgeRule = {
  badgeCode: 'primer_paso',
  evaluate: async (_ctx, actual) => (actual === null ? 1 : null),
};

export const constanciaDiaria: BadgeRule = {
  badgeCode: 'constancia_diaria',
  async evaluate(ctx, actual, prisma) {
    if (!(await esPrimeraEntrega(ctx, prisma))) return null;
    const dia = diaLocal(ctx.submittedAt);
    const asignaciones = await asignacionesDelAlumno(ctx, prisma);
    const mismoDia = asignaciones.some((a) => diaLocal(a.createdAt) === dia);
    return mismoDia ? (actual ?? 0) + 1 : null;
  },
};

export const entregaPuntual: BadgeRule = {
  badgeCode: 'entrega_puntual',
  async evaluate(ctx, actual, prisma) {
    if (!(await esPrimeraEntrega(ctx, prisma))) return null;
    const asignaciones = await asignacionesDelAlumno(ctx, prisma);
    const aTiempo = asignaciones.some((a) => ctx.submittedAt.getTime() <= a.dueDate.getTime());
    return aTiempo ? (actual ?? 0) + 1 : null;
  },
};

export const todoCorrecto: BadgeRule = {
  badgeCode: 'todo_correcto',
  async evaluate(ctx, actual, prisma) {
    if (ctx.total === 0 || ctx.score !== ctx.total) return null;
    // Cuenta actividades distintas resueltas perfecto, no reintentos de la misma
    const perfectasPrevias = await prisma.progress.findMany({
      where: { studentId: ctx.studentId, activityId: ctx.activityId, id: { not: ctx.progressId } },
      select: { score: true, totalPreguntas: true },
    });
    if (perfectasPrevias.some((p) => p.totalPreguntas > 0 && p.score === p.totalPreguntas)) return null;
    return (actual ?? 0) + 1;
  },
};

export const racha: BadgeRule = {
  badgeCode: 'racha',
  async evaluate(ctx, actual, prisma) {
    const entregas = await prisma.progress.findMany({
      where: { studentId: ctx.studentId },
      select: { submittedAt: true },
    });
    const dias = entregas.map((e) => diaLocal(e.submittedAt));
    const actualRacha = rachaActual(dias, diaLocal(ctx.submittedAt));
    if (actualRacha < 2) return null;
    // Guarda la mejor racha: una insignia nunca "baja"
    return actual !== null && actual >= actualRacha ? null : actualRacha;
  },
};

export const BADGE_RULES: BadgeRule[] = [
  primerPaso,
  constanciaDiaria,
  entregaPuntual,
  todoCorrecto,
  racha,
];
