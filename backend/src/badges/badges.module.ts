import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AuthModule } from '../auth/auth.module';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  imports: [AuthModule, AssignmentsModule],
  providers: [BadgesService],
  controllers: [BadgesController],
  exports: [BadgesService], // progress lo invoca tras cada envío
})
export class BadgesModule {}
