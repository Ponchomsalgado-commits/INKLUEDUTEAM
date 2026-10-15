import { Injectable, ConflictException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service';
import {Role} from '@prisma/client'; 

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, SALT_ROUNDS);
    }

    async comparePasswords(
        plainPassword: string,
        passwordHash: string,
    ): Promise<boolean> {
        return bcrypt.compare(plainPassword, passwordHash);
    }

      async create(email: string, plainPassword: string, role: Role) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.hashPassword(plainPassword);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

