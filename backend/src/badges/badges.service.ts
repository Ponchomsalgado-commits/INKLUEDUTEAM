import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { AssignmentsService } from '../assignments/assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BADGE_RULES, BadgeRule, ContextoIntento, diaLocal, rachaActual } from './badge-rules';
import { BADGE_CATALOG } from './badges.catalog';

interface PreguntaGuardada {
  id?: string;
  pregunta?: string;
}

@Injectable()
export class BadgesService implements OnModuleInit {
  private readonly logger = new Logger(BadgesService.name);
  private readonly rules: BadgeRule[] = BADGE_RULES;

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  async onModuleInit() {
    await this.syncCatalog();
  }

  async syncCatalog() {
    for (const b of BADGE_CATALOG) {
      await this.prisma.badge.upsert({
        where: { code: b.code },
        update: { name: b.name, description: b.description, icon: b.icon },
        create: b,
      });
    }
    this.logger.log(`Catálogo de insignias sincronizado (${BADGE_CATALOG.length})`);
  }

  /**
   * Se llama después de guardar un intento, sin esperar: el cálculo de insignias
   * nunca retrasa la respuesta al estudiante (criterio del Sprint 6).
   */
  evaluarEnSegundoPlano(ctx: ContextoIntento) {
    setImmediate(() => {
      this.evaluateRules(ctx).catch((error: unknown) =>
        this.logger.error(`No se pudieron evaluar las insignias: ${String(error)}`),
      );
    });
  }

  /** Aplica cada regla y otorga/avanza las insignias que correspondan. Devuelve los códigos otorgados. */
  async evaluateRules(ctx: ContextoIntento): Promise<string[]> {
    const badges = await this.prisma.badge.findMany();
    const porCodigo = new Map(badges.map((b) => [b.code, b]));
    const obtenidas = await this.prisma.studentBadge.findMany({ where: { studentId: ctx.studentId } });
    const rachaPorBadge = new Map(obtenidas.map((o) => [o.badgeId, o.streakCount]));
    const otorgadas: string[] = [];

    for (const rule of this.rules) {
      const badge = porCodigo.get(rule.badgeCode);
      if (!badge) continue;
      const actual = rachaPorBadge.get(badge.id) ?? null;
      const nuevo = await rule.evaluate(ctx, actual, this.prisma);
      if (nuevo === null) continue;
      await this.prisma.studentBadge.upsert({
        where: { studentId_badgeId: { studentId: ctx.studentId, badgeId: badge.id } },
        update: { streakCount: nuevo },
        create: { studentId: ctx.studentId, badgeId: badge.id, streakCount: nuevo },
      });
      otorgadas.push(rule.badgeCode);
    }
    return otorgadas;
  }

  /** GET /students/me/badges — insignias obtenidas, las que faltan por descubrir y la racha actual. */
  async myBadges(studentId: string) {
    const [catalogo, obtenidas, entregas] = await Promise.all([
      this.prisma.badge.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.studentBadge.findMany({
        where: { studentId },
        include: { badge: true },
        orderBy: { awardedAt: 'asc' },
      }),
      this.prisma.progress.findMany({ where: { studentId }, select: { submittedAt: true } }),
    ]);
    const idsObtenidas = new Set(obtenidas.map((o) => o.badgeId));
    const dias = entregas.map((e) => diaLocal(e.submittedAt));

    return {
      rachaActual: rachaActual(dias, diaLocal(new Date())),
      actividadesCompletadas: entregas.length,
      badges: obtenidas.map((o) => ({
        code: o.badge.code,
        name: o.badge.name,
        description: o.badge.description,
        icon: o.badge.icon,
        streakCount: o.streakCount,
        awardedAt: o.awardedAt,
        updatedAt: o.updatedAt,
      })),
      porDescubrir: catalogo
        .filter((b) => !idsObtenidas.has(b.id))
        .map((b) => ({ code: b.code, name: b.name, description: b.description, icon: b.icon })),
    };
  }

  /** GET /classrooms/:id/badges-summary — insignias de cada alumno del salón (sin rankings). */
  async classroomSummary(teacherId: string, classroomId: string) {
    await this.assignments.getOwnedClassroom(teacherId, classroomId);
    const miembros = await this.prisma.classroomMember.findMany({
      where: { classroomId },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            badges: { include: { badge: true }, orderBy: { awardedAt: 'asc' } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return miembros.map((m) => ({
      student: { id: m.student.id, email: m.student.email },
      badges: m.student.badges.map((sb) => ({
        code: sb.badge.code,
        name: sb.badge.name,
        icon: sb.badge.icon,
        streakCount: sb.streakCount,
        awardedAt: sb.awardedAt,
      })),
    }));
  }

  /**
   * GET /classrooms/:id/students/:studentId — detalle de un alumno para su profesor:
   * insignias, intentos en las actividades del salón y qué preguntas tiende a fallar.
   */
  async studentInsights(teacherId: string, classroomId: string, studentId: string) {
    await this.assignments.getOwnedClassroom(teacherId, classroomId);
    const miembro = await this.prisma.classroomMember.findUnique({
      where: { classroomId_studentId: { classroomId, studentId } },
      include: { student: { select: { id: true, email: true } } },
    });
    if (!miembro) throw new NotFoundException('El alumno no pertenece a este salón.');

    const asignaciones = await this.prisma.assignment.findMany({
      where: { classroomId },
      include: { activity: { select: { id: true, title: true, contentJson: true } } },
    });
    const actividades = new Map(asignaciones.map((a) => [a.activityId, a.activity]));

    const [intentos, badges] = await Promise.all([
      this.prisma.progress.findMany({
        where: { studentId, activityId: { in: [...actividades.keys()] } },
        include: { answers: true },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.studentBadge.findMany({
        where: { studentId },
        include: { badge: true },
        orderBy: { awardedAt: 'asc' },
      }),
    ]);

    const conteo = new Map<
      string,
      { activityId: string; preguntaId: string; fallos: number; respuestas: number }
    >();
    for (const intento of intentos) {
      for (const r of intento.answers) {
        const k = `${intento.activityId}:${r.preguntaId}`;
        const fila = conteo.get(k) ?? {
          activityId: intento.activityId,
          preguntaId: r.preguntaId,
          fallos: 0,
          respuestas: 0,
        };
        fila.respuestas++;
        if (!r.correcta) fila.fallos++;
        conteo.set(k, fila);
      }
    }

    const textoDe = (activityId: string, preguntaId: string) => {
      const contenido = actividades.get(activityId)?.contentJson as { preguntas?: PreguntaGuardada[] };
      return contenido?.preguntas?.find((p) => p.id === preguntaId)?.pregunta ?? '(pregunta eliminada)';
    };

    return {
      student: miembro.student,
      badges: badges.map((sb) => ({
        code: sb.badge.code,
        name: sb.badge.name,
        description: sb.badge.description,
        icon: sb.badge.icon,
        streakCount: sb.streakCount,
        awardedAt: sb.awardedAt,
      })),
      intentos: intentos.map((i) => ({
        id: i.id,
        activityId: i.activityId,
        activityTitle: actividades.get(i.activityId)?.title ?? '',
        score: i.score,
        total: i.totalPreguntas,
        submittedAt: i.submittedAt,
      })),
      preguntasFalladas: [...conteo.values()]
        .filter((f) => f.fallos > 0)
        .sort((a, b) => b.fallos / b.respuestas - a.fallos / a.respuestas || b.fallos - a.fallos)
        .map((f) => ({
          ...f,
          activityTitle: actividades.get(f.activityId)?.title ?? '',
          pregunta: textoDe(f.activityId, f.preguntaId),
        })),
    };
  }
}
