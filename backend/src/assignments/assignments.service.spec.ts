import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from './assignments.service';

const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000;

describe('AssignmentsService', () => {
  const prisma = {
    teacherActivity: { findFirst: jest.fn(), update: jest.fn() },
    classroom: { findFirst: jest.fn() },
    classroomMember: { findMany: jest.fn(), findUnique: jest.fn() },
    assignment: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    progress: { findMany: jest.fn() },
  };
  const service = new AssignmentsService(prisma as unknown as PrismaService);

  const actividad = {
    id: 'act-1',
    title: 'Sumas',
    publishedAt: null,
    mediaUrls: ['media/p/a.txt'],
    contentJson: { preguntas: [{}, {}] },
    template: { type: 'seleccionar_objetivo', skin: 'espacio' },
  };
  const salon = { id: 'salon-1', name: '3°A', type: 'GRUPO' };
  const asignacion = (extra: Record<string, unknown> = {}) => ({
    id: 'asig-1',
    activityId: 'act-1',
    classroomId: 'salon-1',
    dueDate: new Date(Date.now() + UNA_SEMANA),
    createdAt: new Date(),
    activity: actividad,
    classroom: salon,
    ...extra,
  });
  const dto = () => ({
    activityId: 'act-1',
    classroomId: 'salon-1',
    dueDate: new Date(Date.now() + UNA_SEMANA).toISOString(),
  });

  beforeEach(() => jest.clearAllMocks());

  describe('publicar', () => {
    it('crea la asignación y marca la actividad como publicada', async () => {
      prisma.teacherActivity.findFirst.mockResolvedValue(actividad);
      prisma.classroom.findFirst.mockResolvedValue(salon);
      prisma.assignment.create.mockResolvedValue(asignacion());

      const r = await service.create('profe-1', dto());

      expect(r.activity).toMatchObject({ id: 'act-1', totalPreguntas: 2, mediaCount: 1 });
      expect(prisma.teacherActivity.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'act-1' } }),
      );
    });

    it('rechaza una fecha límite en el pasado', async () => {
      await expect(
        service.create('profe-1', { ...dto(), dueDate: '2020-01-01T00:00:00Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('no publica actividades de otro profesor', async () => {
      prisma.teacherActivity.findFirst.mockResolvedValue(null);
      await expect(service.create('profe-1', dto())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('no publica en salones de otro profesor', async () => {
      prisma.teacherActivity.findFirst.mockResolvedValue(actividad);
      prisma.classroom.findFirst.mockResolvedValue(null);
      await expect(service.create('profe-1', dto())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('publicar dos veces en el mismo salón es 409', async () => {
      prisma.teacherActivity.findFirst.mockResolvedValue(actividad);
      prisma.classroom.findFirst.mockResolvedValue(salon);
      prisma.assignment.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      await expect(service.create('profe-1', dto())).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('bandeja del estudiante', () => {
    it('marca completado con el último intento y atrasado si venció sin entregar', async () => {
      prisma.assignment.findMany.mockResolvedValue([
        asignacion(),
        asignacion({ id: 'asig-2', activityId: 'act-2', dueDate: new Date(Date.now() - 1000) }),
      ]);
      prisma.progress.findMany.mockResolvedValue([
        { studentId: 'alu-1', activityId: 'act-1', score: 2, totalPreguntas: 2, submittedAt: new Date() },
      ]);

      const r = await service.listForStudent('alu-1');

      expect(r[0]).toMatchObject({ estado: 'completado', ultimoIntento: { score: 2, total: 2 } });
      expect(r[1]).toMatchObject({ estado: 'atrasado', ultimoIntento: null });
      expect(prisma.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classroom: { members: { some: { studentId: 'alu-1' } } } },
        }),
      );
    });
  });

  describe('tablero del profesor', () => {
    it('da el estado de cada alumno en cada asignación', async () => {
      prisma.classroom.findFirst.mockResolvedValue(salon);
      prisma.assignment.findMany.mockResolvedValue([asignacion()]);
      prisma.classroomMember.findMany.mockResolvedValue([
        { studentId: 'alu-1', student: { id: 'alu-1', email: 'a@x' } },
        { studentId: 'alu-2', student: { id: 'alu-2', email: 'b@x' } },
      ]);
      prisma.progress.findMany.mockResolvedValue([
        { studentId: 'alu-1', activityId: 'act-1', score: 1, totalPreguntas: 2, submittedAt: new Date() },
      ]);

      const r = await service.classroomProgress('profe-1', 'salon-1');

      expect(r.alumnos[0].resultados[0]).toMatchObject({ estado: 'completado', score: 1, total: 2 });
      expect(r.alumnos[1].resultados[0]).toMatchObject({ estado: 'pendiente', score: null });
    });
  });

  describe('acceso del estudiante', () => {
    it('404 si la actividad no está asignada a sus salones', async () => {
      prisma.assignment.findFirst.mockResolvedValue(null);
      await expect(service.assertStudentCanPlay('alu-1', 'act-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('un alumno que no es miembro no ve las asignaciones del salón', async () => {
      prisma.classroomMember.findUnique.mockResolvedValue(null);
      await expect(
        service.listForClassroom({ sub: 'alu-1', email: 'a@x', role: Role.ESTUDIANTE }, 'salon-1'),
      ).rejects.toThrow('No perteneces a este salón.');
    });
  });
});
