import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClassroomType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomsService, CODE_CHARSET, CODE_LENGTH } from './classrooms.service';

describe('ClassroomsService', () => {
  const prisma = {
    classroom: { findUnique: jest.fn(), create: jest.fn() },
    classroomMember: { findUnique: jest.fn(), create: jest.fn() },
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
});
