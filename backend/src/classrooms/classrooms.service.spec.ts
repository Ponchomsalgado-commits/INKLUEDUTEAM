import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClassroomType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomsService, CODE_CHARSET, CODE_LENGTH } from './classrooms.service';

describe('ClassroomsService', () => {
  const prisma = {
    classroom: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    classroomMember: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  };
  const service = new ClassroomsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.classroom.create.mockImplementation(({ data }) => Promise.resolve(data));
  });

  it.each(['GRUPO', 'INDIVIDUAL'] as ClassroomType[])(
    'genera un código de la longitud correcta y sin caracteres ambiguos (%s)',
    async (type) => {
      prisma.classroom.findUnique.mockResolvedValue(null);

      const { joinCode } = await service.create('profe-1', { name: 'Salón', type });

      expect(joinCode).toHaveLength(CODE_LENGTH[type]);
      expect([...joinCode].every((c) => CODE_CHARSET.includes(c))).toBe(true);
    },
  );

  it('reintenta si el código generado ya existe', async () => {
    prisma.classroom.findUnique.mockResolvedValueOnce({ id: 'ocupado' }).mockResolvedValue(null);

    await service.create('profe-1', { name: 'Salón', type: 'GRUPO' });

    expect(prisma.classroom.findUnique).toHaveBeenCalledTimes(2);
  });

  it('acepta el código en minúsculas al unirse', async () => {
    prisma.classroom.findUnique.mockResolvedValue({ id: 'salon-1' });
    prisma.classroomMember.findUnique.mockResolvedValue(null);

    await service.join('alumno-1', { joinCode: 'abc234' });

    expect(prisma.classroom.findUnique).toHaveBeenCalledWith({ where: { joinCode: 'ABC234' } });
    expect(prisma.classroomMember.create).toHaveBeenCalled();
  });

  it('rechaza un código inexistente con 404', async () => {
    prisma.classroom.findUnique.mockResolvedValue(null);

    await expect(service.join('alumno-1', { joinCode: 'XXXXXX' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rechaza unirse dos veces al mismo salón con 409', async () => {
    prisma.classroom.findUnique.mockResolvedValue({ id: 'salon-1' });
    prisma.classroomMember.findUnique.mockResolvedValue({ classroomId: 'salon-1' });

    await expect(service.join('alumno-1', { joinCode: 'ABC234' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('lista al profesor los salones que creó', async () => {
    prisma.classroom.findMany.mockResolvedValue([{ id: 'salon-1' }]);

    const r = await service.listMine('profe-1', Role.PROFESOR);

    expect(prisma.classroom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teacherId: 'profe-1' } }),
    );
    expect(r).toEqual([{ id: 'salon-1' }]);
  });

  it('lista al estudiante los salones a los que se unió', async () => {
    prisma.classroomMember.findMany.mockResolvedValue([
      { classroom: { id: 'salon-1' } },
      { classroom: { id: 'tutoria-1' } },
    ]);

    const r = await service.listMine('alumno-1', Role.ESTUDIANTE);

    expect(prisma.classroomMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'alumno-1' } }),
    );
    expect(r).toEqual([{ id: 'salon-1' }, { id: 'tutoria-1' }]);
  });

  it('muestra los miembros solo al profesor dueño del salón', async () => {
    prisma.classroom.findFirst.mockResolvedValue({ id: 'salon-1' });
    prisma.classroomMember.findMany.mockResolvedValue([]);

    await service.listMembers('profe-1', 'salon-1');

    expect(prisma.classroom.findFirst).toHaveBeenCalledWith({
      where: { id: 'salon-1', teacherId: 'profe-1' },
    });
  });

  it('responde 404 a un profesor que no es dueño del salón', async () => {
    prisma.classroom.findFirst.mockResolvedValue(null);

    await expect(service.listMembers('otro-profe', 'salon-1')).rejects.toThrow(NotFoundException);
    expect(prisma.classroomMember.findMany).not.toHaveBeenCalled();
  });
});
