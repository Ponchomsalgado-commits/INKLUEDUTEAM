import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TEMPLATE_CATALOG } from './templates.catalog';

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** El catálogo vive en código (templates.catalog.ts) y se sincroniza solo en cada arranque. */
  async onModuleInit() {
    await this.syncCatalog();
  }

  async syncCatalog() {
    for (const entry of TEMPLATE_CATALOG) {
      const schemaJson = entry.schemaJson as unknown as Prisma.InputJsonValue;
      await this.prisma.gameTemplate.upsert({
        where: { type_skin: { type: entry.type, skin: entry.skin } },
        update: { displayName: entry.displayName, schemaJson },
        create: { type: entry.type, skin: entry.skin, displayName: entry.displayName, schemaJson },
      });
    }
    this.logger.log(`Catálogo de plantillas sincronizado (${TEMPLATE_CATALOG.length})`);
  }

  findAll() {
    return this.prisma.gameTemplate.findMany({ orderBy: [{ type: 'asc' }, { skin: 'asc' }] });
  }

  async findOne(id: string) {
    const template = await this.prisma.gameTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('La plantilla no existe.');
    }
    return template;
  }
}