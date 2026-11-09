import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssignmentsController, ClassroomAssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [AuthModule],
  providers: [AssignmentsService],
  controllers: [AssignmentsController, ClassroomAssignmentsController],
  exports: [AssignmentsService], // activities (/play) y progress verifican que la actividad esté asignada
})
export class AssignmentsModule {}
