import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { TemplatesModule } from '../templates/templates.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [AuthModule, TemplatesModule, MediaModule, AssignmentsModule],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [ActivitiesService], // lo usarán assignments y progress (Sprints 4 y 5)
})
export class ActivitiesModule {}