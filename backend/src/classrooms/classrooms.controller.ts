import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  /** POST /api/v1/classrooms — el profesor crea un salón (GRUPO) o tutoría (INDIVIDUAL). */
  @Post()
  @Roles(Role.PROFESOR)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(user.sub, dto);
  }

  /** POST /api/v1/classrooms/join — el estudiante se une con el código del salón. */
  @Post('join')
  @Roles(Role.ESTUDIANTE)
  join(@CurrentUser() user: JwtPayload, @Body() dto: JoinClassroomDto) {
    return this.classroomsService.join(user.sub, dto);
  }
}
