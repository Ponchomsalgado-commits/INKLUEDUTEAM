import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller ('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}  
  
    @Get()
    async check () {
        let database: 'conected' | 'down' = 'down';

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            database = 'conected';
        } catch {
            database = 'down';

    }
    return { status: 'ok', database };
    }
}