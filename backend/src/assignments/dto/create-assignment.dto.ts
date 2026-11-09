import { IsISO8601, IsUUID } from 'class-validator';

/** Publica una actividad propia hacia un salón o tutoría propia, con fecha límite. */
export class CreateAssignmentDto {
  @IsUUID('4', { message: 'activityId debe ser un UUID válido' })
  activityId!: string;

  @IsUUID('4', { message: 'classroomId debe ser un UUID válido' })
  classroomId!: string;

  @IsISO8601({}, { message: 'dueDate debe ser una fecha ISO 8601 (ej. 2026-11-20T23:59:00Z)' })
  dueDate!: string;
}
