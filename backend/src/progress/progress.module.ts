import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AuthModule } from '../auth/auth.module';
import { BadgesModule } from '../badges/badges.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [AuthModule, ActivitiesModule, AssignmentsModule, BadgesModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
