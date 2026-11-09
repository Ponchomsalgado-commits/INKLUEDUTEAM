import { BadRequestException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ProgressService } from './progress.service';

const actividad = {
  id: 'act-1',
  contentVersion: 3,
  title: 'Sumas',
  contentJson: {
    preguntas: [
      {
        id: 'p-1',
        pregunta: '¿2 + 2?',
        opciones: [
          { texto: '3', correcta: false },
          { texto: '4', correcta: true },
          { texto: '5', correcta: false },
        ],
      },
      {
        id: 'p-2',
        pregunta: '¿1 + 1?',
        opciones: [
          { texto: '2', correcta: true },
          { texto: '11', correcta: false },
        ],
      },
      {
        id: 'p-3',
        pregunta: '¿5 - 3?',
        opciones: [
          { texto: '1', correcta: false },
          { texto: '3', correcta: false },
          { texto: '2', correcta: true },
        ],
      },
    ],
  },
};

describe('ProgressService', () => {
  const prisma = {
    progress: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const activities = { findContentForGrading: jest.fn() };
  const service = new ProgressService(
    prisma as unknown as PrismaService,
    activities as unknown as ActivitiesService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    activities.findContentForGrading.mockResolvedValue(actividad);
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
    prisma.progress.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'prog-1',
        ...data,
        answers: data.answers.create.map(
          (respuesta: { preguntaId: string; opcionId: number; correcta: boolean }) => ({
            ...respuesta,
          }),
        ),
      }),
    );
  });

  const dtoBase: SubmitAttemptDto = {
    activityId: 'act-1',
    respuestas: [
      { preguntaId: 'p-1', opcionId: 1 },
      { preguntaId: 'p-2', opcionId: 0 },
      { preguntaId: 'p-3', opcionId: 2 },
    ],
  };

  it('calcula el score por preguntaId aunque las respuestas vengan desordenadas', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [
        { preguntaId: 'p-3', opcionId: 2 },
        { preguntaId: 'p-1', opcionId: 1 },
        { preguntaId: 'p-2', opcionId: 0 },
      ],
    };

    await expect(service.submit('alumno-1', dto)).resolves.toEqual({
      id: 'prog-1',
      score: 3,
      total: 3,
      detalle: [
        { preguntaId: 'p-3', opcionId: 2, correcta: true },
        { preguntaId: 'p-1', opcionId: 1, correcta: true },
        { preguntaId: 'p-2', opcionId: 0, correcta: true },
      ],
    });
    expect(activities.findContentForGrading).toHaveBeenCalledWith('act-1');
    expect(prisma.progress.create).toHaveBeenCalledTimes(1);
    expect(prisma.progress.create.mock.calls[0][0].data).toMatchObject({
      studentId: 'alumno-1',
      activityId: 'act-1',
      score: 3,
      totalPreguntas: 3,
      contentVersion: 3,
    });
  });

  it('rechaza un preguntaId desconocido con error VALIDATION_ERROR', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [{ preguntaId: 'p-404', opcionId: 0 }],
    };

    await expect(service.submit('alumno-1', dto)).rejects.toMatchObject({
      response: { error: 'VALIDATION_ERROR', field: 'respuestas[0].preguntaId' },
    });
    expect(prisma.progress.create).not.toHaveBeenCalled();
  });

  it('rechaza un preguntaId repetido con error VALIDATION_ERROR', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [
        { preguntaId: 'p-1', opcionId: 1 },
        { preguntaId: 'p-1', opcionId: 0 },
      ],
    };

    await expect(service.submit('alumno-1', dto)).rejects.toMatchObject({
      response: { error: 'VALIDATION_ERROR', field: 'respuestas[1].preguntaId' },
    });
    expect(prisma.progress.create).not.toHaveBeenCalled();
  });

  it('rechaza un opcionId fuera de rango con error VALIDATION_ERROR', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [{ preguntaId: 'p-1', opcionId: 9 }],
    };

    await expect(service.submit('alumno-1', dto)).rejects.toMatchObject({
      response: { error: 'VALIDATION_ERROR', field: 'respuestas[0].opcionId' },
    });
    expect(prisma.progress.create).not.toHaveBeenCalled();
  });

  it('cuenta las preguntas no respondidas como incorrectas', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [{ preguntaId: 'p-2', opcionId: 0 }],
    };

    await expect(service.submit('alumno-1', dto)).resolves.toEqual({
      id: 'prog-1',
      score: 1,
      total: 3,
      detalle: [{ preguntaId: 'p-2', opcionId: 0, correcta: true }],
    });
    expect(prisma.progress.create.mock.calls[0][0].data).toMatchObject({
      score: 1,
      totalPreguntas: 3,
    });
  });

  it('reconstruye el resultado guardado si se repite el attemptId del estudiante', async () => {
    prisma.progress.findFirst.mockResolvedValue({
      id: 'prog-ya-existente',
      studentId: 'alumno-1',
      activityId: 'act-1',
      score: 2,
      totalPreguntas: 3,
      contentVersion: 3,
      clientAttemptId: '11111111-1111-4111-8111-111111111111',
      answers: [
        { preguntaId: 'p-1', opcionId: 1, correcta: true },
        { preguntaId: 'p-3', opcionId: 0, correcta: false },
      ],
    });

    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      attemptId: '11111111-1111-4111-8111-111111111111',
      respuestas: [{ preguntaId: 'p-2', opcionId: 0 }],
    };

    await expect(service.submit('alumno-1', dto)).resolves.toEqual({
      id: 'prog-ya-existente',
      score: 2,
      total: 3,
      detalle: [
        { preguntaId: 'p-1', opcionId: 1, correcta: true },
        { preguntaId: 'p-3', opcionId: 0, correcta: false },
      ],
    });
    expect(prisma.progress.findFirst).toHaveBeenCalledWith({
      where: { studentId: 'alumno-1', clientAttemptId: dto.attemptId },
      include: { answers: true },
    });
    expect(activities.findContentForGrading).not.toHaveBeenCalled();
    expect(prisma.progress.create).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException en los errores de validación del intento', async () => {
    const dto: SubmitAttemptDto = {
      activityId: 'act-1',
      respuestas: [{ preguntaId: 'p-x', opcionId: 0 }],
    };

    await expect(service.submit('alumno-1', dto)).rejects.toThrow(BadRequestException);
  });
});
