import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  /** POST /api/v1/assignments — publica una actividad hacia un salón con fecha límite. */
  @Post()
  @Roles(Role.PROFESOR)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssignmentDto) {
    return this.assignments.create(user.sub, dto);
  }

  /** GET /api/v1/assignments/me[?classroomId=] — bandeja del estudiante. */
  @Get('me')
  @Roles(Role.ESTUDIANTE)
  mine(
    @CurrentUser() user: JwtPayload,
    @Query('classroomId', new ParseUUIDPipe({ optional: true })) classroomId?: string,
  ) {
    return this.assignments.listForStudent(user.sub, classroomId);
  }

  /** DELETE /api/v1/assignments/:id — el profesor retira la publicación. */
  @Delete(':id')
  @Roles(Role.PROFESOR)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignments.remove(user.sub, id);
  }
}

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomAssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  /** GET /api/v1/classrooms/:id/assignments — publicaciones del salón (profesor dueño o alumno miembro). */
  @Get(':id/assignments')
  list(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignments.listForClassroom(user, id);
  }

  /** GET /api/v1/classrooms/:id/progress — tablero de seguimiento del profesor. */
  @Get(':id/progress')
  @Roles(Role.PROFESOR)
  progress(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignments.classroomProgress(user.sub, id);
  }
}
