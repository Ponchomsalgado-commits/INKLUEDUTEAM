import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

interface OpcionParaCorregir {
  texto: string;
  correcta?: boolean;
}

interface PreguntaParaCorregir {
  id: string;
  pregunta: string;
  opciones: OpcionParaCorregir[];
}

interface DetalleRespuesta {
  preguntaId: string;
  opcionId: number;
  correcta: boolean;
}

type ProgressConRespuestas = {
  score: number;
  totalPreguntas: number;
  answers: DetalleRespuesta[];
};

function campoInvalido(message: string, field: string) {
  return new BadRequestException({ error: 'VALIDATION_ERROR', message, field });
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivitiesService,
  ) {}

  /**
   * Corrige y guarda un intento de actividad de un estudiante.
   * Las preguntas se buscan por `preguntaId` (nunca por índice) y las no enviadas
   * se consideran incorrectas. `attemptId` permite reintentos idempotentes. (CLAUDE)
   */
  async submit(studentId: string, dto: SubmitAttemptDto) {
    if (dto.attemptId) {
      const existente = await this.prisma.progress.findFirst({
        where: { studentId, clientAttemptId: dto.attemptId },
        include: { answers: true },
      });
      if (existente) {
        return this.present(existente);
      }
    }

    const activity = await this.activities.findContentForGrading(dto.activityId);
    const preguntas = this.leerPreguntas(activity.contentJson);
    const total = preguntas.length;
    const preguntasPorId = new Map<string, PreguntaParaCorregir>();
    for (const pregunta of preguntas) {
      if (pregunta.id) preguntasPorId.set(pregunta.id, pregunta);
    }

    const detalle: DetalleRespuesta[] = [];
    const respuestasAGuardar: Prisma.ProgressAnswerCreateWithoutProgressInput[] = [];
    const vistas = new Set<string>();

    for (let i = 0; i < dto.respuestas.length; i++) {
      const respuesta = dto.respuestas[i];

      if (vistas.has(respuesta.preguntaId)) {
        throw campoInvalido(
          `La pregunta ${respuesta.preguntaId} está repetida en el intento.`,
          `respuestas[${i}].preguntaId`,
        );
      }
      vistas.add(respuesta.preguntaId);

      const pregunta = preguntasPorId.get(respuesta.preguntaId);
      if (!pregunta) {
        throw campoInvalido(
          `La pregunta ${respuesta.preguntaId} no existe en la actividad.`,
          `respuestas[${i}].preguntaId`,
        );
      }

      if (
        !Array.isArray(pregunta.opciones) ||
        !Number.isInteger(respuesta.opcionId) ||
        respuesta.opcionId < 0 ||
        respuesta.opcionId >= pregunta.opciones.length
      ) {
        throw campoInvalido(
          `La opción ${respuesta.opcionId} no existe en la pregunta ${respuesta.preguntaId}.`,
          `respuestas[${i}].opcionId`,
        );
      }

      const correcta = pregunta.opciones[respuesta.opcionId].correcta === true;
      detalle.push({ preguntaId: respuesta.preguntaId, opcionId: respuesta.opcionId, correcta });
      respuestasAGuardar.push({
        preguntaId: respuesta.preguntaId,
        opcionId: respuesta.opcionId,
        correcta,
      });
    }

    const score = detalle.filter((respuesta) => respuesta.correcta).length;

    let creado: Awaited<ReturnType<typeof this.crearProgreso>>;
    try {
      creado = await this.crearProgreso(studentId, activity, score, total, dto, respuestasAGuardar);
    } catch (error) {
      // Reintento simultáneo con el mismo attemptId: gana el primero, devolvemos su resultado
      if (
        dto.attemptId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existente = await this.prisma.progress.findFirst({
          where: { studentId, clientAttemptId: dto.attemptId },
          include: { answers: true },
        });
        if (existente) return this.present(existente);
      }
      throw error;
    }
    return this.present(creado);
  }

  private crearProgreso(
    studentId: string,
    activity: { id: string; contentVersion: number },
    score: number,
    total: number,
    dto: SubmitAttemptDto,
    respuestasAGuardar: Prisma.ProgressAnswerCreateWithoutProgressInput[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      return tx.progress.create({
        data: {
          studentId,
          activityId: activity.id,
          score,
          totalPreguntas: total,
          contentVersion: activity.contentVersion,
          clientAttemptId: dto.attemptId ?? null,
          submittedAt: new Date(),
          answers: {
            create: respuestasAGuardar,
          },
        },
        include: { answers: true },
      });
    });
  }

  private leerPreguntas(contentJson: Prisma.JsonValue): PreguntaParaCorregir[] {
    const content = contentJson as unknown as { preguntas?: PreguntaParaCorregir[] };
    return Array.isArray(content?.preguntas) ? content.preguntas : [];
  }

  private present(progress: ProgressConRespuestas) {
    return {
      score: progress.score,
      total: progress.totalPreguntas,
      detalle: progress.answers.map(({ preguntaId, opcionId, correcta }) => ({
        preguntaId,
        opcionId,
        correcta,
      })),
    };
  }
}
