import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /** POST /api/v1/progress — el estudiante envía un intento y recibe su corrección. (CLAUDE) */
  @Post()
  @Roles(Role.ESTUDIANTE)
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitAttemptDto) {
    return this.progressService.submit(user.sub, dto);
  }
}
