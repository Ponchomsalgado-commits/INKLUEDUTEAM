import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomType } from '@prisma/client';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

// Alfabeto sin caracteres ambiguos: excluye 0/O, 1/I/L
const CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      const index = randomInt(0, CODE_CHARSET.length);
      code += CODE_CHARSET[index];
    }
    return code;
  }

  private async generateUniqueJoinCode(type: ClassroomType): Promise<string> {
    const length = type === 'GRUPO' ? 6 : 5;

    let code: string;
    let exists = true;

    do {
      code = this.generateCode(length);
      const existing = await this.prisma.classroom.findUnique({
        where: { joinCode: code },
      });
      exists = !!existing;
    } while (exists);

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
}