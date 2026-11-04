import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomType, Role } from '@prisma/client';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

// Alfabeto sin caracteres ambiguos: excluye 0/O, 1/I/L
export const CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Longitud del código según el tipo (documento técnico, Sprint 2)
export const CODE_LENGTH: Record<ClassroomType, number> = {
  GRUPO: 6,
  INDIVIDUAL: 5,
};

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(length: number): string {
    return Array.from({ length }, () => CODE_CHARSET[randomInt(0, CODE_CHARSET.length)]).join('');
  }

  private async generateUniqueJoinCode(type: ClassroomType): Promise<string> {
    // Reintenta hasta encontrar un código libre; la columna join_code es UNIQUE como respaldo
    let code: string;
    do {
      code = this.generateCode(CODE_LENGTH[type]);
    } while (await this.prisma.classroom.findUnique({ where: { joinCode: code } }));
    return code;
  }

  async create(teacherId: string, dto: CreateClassroomDto) {
    const joinCode = await this.generateUniqueJoinCode(dto.type);

    return this.prisma.classroom.create({
      data: {
        teacherId,
        name: dto.name,
        type: dto.type,
        joinCode,
      },
    });
  }

  async join(studentId: string, dto: JoinClassroomDto) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { joinCode: dto.joinCode.toUpperCase() },
    });

    if (!classroom) {
      throw new NotFoundException('Invalid join code');
    }

    const existingMembership = await this.prisma.classroomMember.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: classroom.id,
          studentId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Already a member of this classroom');
    }

    return this.prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        studentId,
      },
    });
  }

  /** Profesor: los salones que creó. Estudiante: los salones a los que se unió. */
  async listMine(userId: string, role: Role) {
    if (role === Role.PROFESOR) {
      return this.prisma.classroom.findMany({
        where: { teacherId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    const memberships = await this.prisma.classroomMember.findMany({
      where: { studentId: userId },
      include: { classroom: true },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m) => m.classroom);
  }

  /** Solo el dueño del salón ve sus miembros; para otro profesor es 404. Nunca se devuelve passwordHash. */
  async listMembers(teacherId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });
    if (!classroom) {
      throw new NotFoundException('El salón no existe.');
    }

    return this.prisma.classroomMember.findMany({
      where: { classroomId },
      include: {
        student: { select: { id: true, email: true, role: true, createdAt: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
