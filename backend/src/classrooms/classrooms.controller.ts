import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles(Role.PROFESOR)
  create(@Req() req: any, @Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(req.user.sub, dto);
  }

  @Post('join')
  @Roles(Role.ESTUDIANTE)
  join(@Req() req: any, @Body() dto: JoinClassroomDto) {
    return this.classroomsService.join(req.user.sub, dto);
  }
}