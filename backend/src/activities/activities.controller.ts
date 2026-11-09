import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { AssignmentsService } from '../assignments/assignments.service';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly assignments: AssignmentsService,
  ) {}

  /** POST /api/v1/activities — crea una actividad propia a partir de una plantilla. (CLAUDE) */
  @Post()
  @Roles(Role.PROFESOR)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateActivityDto) {
    return this.activitiesService.create(user.sub, dto);
  }

  /** GET /api/v1/activities — "mis actividades" del profesor autenticado.(CLAUDE) */
  @Get()
  @Roles(Role.PROFESOR)
  list(@CurrentUser() user: JwtPayload) {
    return this.activitiesService.findAllOf(user.sub);
  }

  /** GET /api/v1/activities/:id — detalle completo (editar / previsualizar). (CLAUDE)*/
  @Get(':id')
  @Roles(Role.PROFESOR)
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findOneOf(user.sub, id);
  }

  /** PATCH /api/v1/activities/:id — edita una actividad propia (nunca la plantilla). (CLAUDE)*/
  @Patch(':id')
  @Roles(Role.PROFESOR)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(user.sub, id, dto);
  }

  /** GET /api/v1/activities/:id/play — actividad lista para jugar (rol estudiante). (CLAUDE)*/
  @Get(':id/play')
  @Roles(Role.ESTUDIANTE)
  async play(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    // Solo actividades publicadas en alguno de sus salones (Sprint 5)
    await this.assignments.assertStudentCanPlay(user.sub, id);
    return this.activitiesService.findForPlay(id);
  }
}