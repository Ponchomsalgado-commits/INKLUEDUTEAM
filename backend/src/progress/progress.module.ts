import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [AuthModule, ActivitiesModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
