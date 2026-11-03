import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /** GET /api/v1/templates — catálogo de plantillas (cada skin es una entrada). (CLAUDE)*/
  @Get()
  @Roles(Role.PROFESOR)
  list() {
    return this.templatesService.findAll();
  }

  /** GET /api/v1/templates/:id — una plantilla con su schemaJson (para armar el editor).(CLAUDE) */
  @Get(':id')
  @Roles(Role.PROFESOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }
}