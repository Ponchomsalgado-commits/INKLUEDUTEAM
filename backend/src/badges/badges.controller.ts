import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { BadgesService } from './badges.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  /** GET /api/v1/students/me/badges — perfil del estudiante: insignias y racha actual. */
  @Get('students/me/badges')
  @Roles(Role.ESTUDIANTE)
  mine(@CurrentUser() user: JwtPayload) {
    return this.badges.myBadges(user.sub);
  }

  /** GET /api/v1/classrooms/:id/badges-summary — insignias de cada alumno del salón. */
  @Get('classrooms/:id/badges-summary')
  @Roles(Role.PROFESOR)
  summary(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.badges.classroomSummary(user.sub, id);
  }

  /** GET /api/v1/classrooms/:id/students/:studentId — detalle de un alumno para su profesor. */
  @Get('classrooms/:id/students/:studentId')
  @Roles(Role.PROFESOR)
  student(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.badges.studentInsights(user.sub, id, studentId);
  }
}
