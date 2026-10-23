import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/v1/health — confirma que la API responde y que PostgreSQL acepta consultas. */
  @Get()
  async check() {
    let database: 'connected' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'down';
    }
    return { status: 'ok', database };
  }
}
