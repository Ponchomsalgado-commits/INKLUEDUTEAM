import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Progress, Role } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { estadoDe } from './assignment-status';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

function campoInvalido(message: string, field: string) {
  return new BadRequestException({ error: 'VALIDATION_ERROR', message, field });
}

const conActividad = {
  activity: { include: { template: true } },
  classroom: true,
} satisfies Prisma.AssignmentInclude;

type AsignacionCompleta = Prisma.AssignmentGetPayload<{ include: typeof conActividad }>;

type Intento = Pick<Progress, 'studentId' | 'activityId' | 'score' | 'totalPreguntas' | 'submittedAt'>;

/** Clave estudiante+actividad para quedarnos con el intento más reciente de cada par. */
const clave = (studentId: string, activityId: string) => `${studentId}:${activityId}`;

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /assignments — el profesor publica su actividad hacia su salón con fecha límite. */
  async create(teacherId: string, dto: CreateAssignmentDto) {
    const dueDate = new Date(dto.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw campoInvalido('La fecha límite no es válida.', 'dueDate');
    }
    if (dueDate.getTime() < Date.now()) {
      throw campoInvalido('La fecha límite no puede estar en el pasado.', 'dueDate');
    }

    const activity = await this.prisma.teacherActivity.findFirst({
      where: { id: dto.activityId, teacherId },
    });
    if (!activity) throw new NotFoundException('La actividad no existe.');
    await this.getOwnedClassroom(teacherId, dto.classroomId);

    try {
      const created = await this.prisma.assignment.create({
        data: { activityId: activity.id, classroomId: dto.classroomId, dueDate },
        include: conActividad,
      });
      if (!activity.publishedAt) {
        await this.prisma.teacherActivity.update({
          where: { id: activity.id },
          data: { publishedAt: created.createdAt },
        });
      }
      return this.presentar(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esa actividad ya está publicada en este salón.');
      }
      throw error;
    }
  }

  /** DELETE /assignments/:id — el profesor retira una publicación suya. */
  async remove(teacherId: string, id: string) {
    const asignacion = await this.prisma.assignment.findFirst({
      where: { id, classroom: { teacherId } },
    });
    if (!asignacion) throw new NotFoundException('La asignación no existe.');
    await this.prisma.assignment.delete({ where: { id } });
    return { id };
  }

  /**
   * GET /assignments/me — bandeja del estudiante: solo asignaciones de sus salones,
   * ordenadas por fecha límite, con su estado y su último resultado.
   */
  async listForStudent(studentId: string, classroomId?: string) {
    const asignaciones = await this.prisma.assignment.findMany({
      where: {
        classroom: { members: { some: { studentId } } },
        ...(classroomId ? { classroomId } : {}),
      },
      include: conActividad,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    const intentos = await this.ultimosIntentos(
      [studentId],
      asignaciones.map((a) => a.activityId),
    );

    return asignaciones.map((a) => {
      const intento = intentos.get(clave(studentId, a.activityId));
      return {
        ...this.presentar(a),
        estado: estadoDe(a.dueDate, intento?.submittedAt),
        ultimoIntento: intento
          ? { score: intento.score, total: intento.totalPreguntas, submittedAt: intento.submittedAt }
          : null,
      };
    });
  }

  /**
   * GET /classrooms/:id/assignments — profesor dueño: publicaciones con cuántos entregaron.
   * Estudiante miembro: su bandeja filtrada a ese salón.
   */
  async listForClassroom(user: JwtPayload, classroomId: string) {
    if (user.role === Role.ESTUDIANTE) {
      await this.assertMember(user.sub, classroomId);
      return this.listForStudent(user.sub, classroomId);
    }

    await this.getOwnedClassroom(user.sub, classroomId);
    const [asignaciones, miembros] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { classroomId },
        include: conActividad,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.classroomMember.findMany({ where: { classroomId }, select: { studentId: true } }),
    ]);
    const alumnos = miembros.map((m) => m.studentId);
    const intentos = await this.ultimosIntentos(
      alumnos,
      asignaciones.map((a) => a.activityId),
    );

    return asignaciones.map((a) => {
      const entregados = alumnos.filter((s) => intentos.has(clave(s, a.activityId))).length;
      return {
        ...this.presentar(a),
        totalAlumnos: alumnos.length,
        entregados,
        vencida: a.dueDate.getTime() < Date.now(),
      };
    });
  }

  /** GET /classrooms/:id/progress — tablero del profesor: estado y score de cada alumno por asignación. */
  async classroomProgress(teacherId: string, classroomId: string) {
    const classroom = await this.getOwnedClassroom(teacherId, classroomId);
    const [asignaciones, miembros] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { classroomId },
        include: conActividad,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.classroomMember.findMany({
        where: { classroomId },
        include: { student: { select: { id: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      }),
    ]);
    const intentos = await this.ultimosIntentos(
      miembros.map((m) => m.studentId),
      asignaciones.map((a) => a.activityId),
    );

    return {
      classroom: { id: classroom.id, name: classroom.name, type: classroom.type },
      asignaciones: asignaciones.map((a) => ({
        id: a.id,
        activityId: a.activityId,
        title: a.activity.title,
        dueDate: a.dueDate,
      })),
      alumnos: miembros.map((m) => ({
        student: m.student,
        resultados: asignaciones.map((a) => {
          const intento = intentos.get(clave(m.studentId, a.activityId));
          return {
            assignmentId: a.id,
            estado: estadoDe(a.dueDate, intento?.submittedAt),
            score: intento?.score ?? null,
            total: intento?.totalPreguntas ?? null,
            submittedAt: intento?.submittedAt ?? null,
          };
        }),
      })),
      generadoEn: new Date(),
    };
  }

  /**
   * Un estudiante solo juega y envía actividades publicadas en alguno de sus salones.
   * Responde 404 (no 403) para no revelar que la actividad existe.
   */
  async assertStudentCanPlay(studentId: string, activityId: string) {
    const asignada = await this.prisma.assignment.findFirst({
      where: { activityId, classroom: { members: { some: { studentId } } } },
      select: { id: true },
    });
    if (!asignada) throw new NotFoundException('La actividad no existe o no está asignada a tus salones.');
  }

  async getOwnedClassroom(teacherId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });
    if (!classroom) throw new NotFoundException('El salón no existe.');
    return classroom;
  }

  async assertMember(studentId: string, classroomId: string) {
    const miembro = await this.prisma.classroomMember.findUnique({
      where: { classroomId_studentId: { classroomId, studentId } },
    });
    if (!miembro) throw new ForbiddenException('No perteneces a este salón.');
  }

  /** Último intento de cada par estudiante+actividad. */
  private async ultimosIntentos(studentIds: string[], activityIds: string[]) {
    const mapa = new Map<string, Intento>();
    if (studentIds.length === 0 || activityIds.length === 0) return mapa;
    const filas = await this.prisma.progress.findMany({
      where: { studentId: { in: studentIds }, activityId: { in: activityIds } },
      select: {
        studentId: true,
        activityId: true,
        score: true,
        totalPreguntas: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    for (const fila of filas) {
      const k = clave(fila.studentId, fila.activityId);
      if (!mapa.has(k)) mapa.set(k, fila);
    }
    return mapa;
  }

  private presentar(a: AsignacionCompleta) {
    const contenido = a.activity.contentJson as { preguntas?: unknown[] } | null;
    return {
      id: a.id,
      dueDate: a.dueDate,
      createdAt: a.createdAt,
      classroom: { id: a.classroom.id, name: a.classroom.name, type: a.classroom.type },
      activity: {
        id: a.activity.id,
        title: a.activity.title,
        type: a.activity.template.type,
        skin: a.activity.template.skin,
        totalPreguntas: Array.isArray(contenido?.preguntas) ? contenido.preguntas.length : 0,
        mediaCount: a.activity.mediaUrls.length,
      },
    };
  }
}
