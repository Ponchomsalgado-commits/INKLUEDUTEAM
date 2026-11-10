import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Una respuesta enviada por el estudiante. `opcionId` es el índice de la opción (0..n-1). (CLAUDE) */
export class SubmitAnswerDto {
  @IsString({ message: 'preguntaId debe ser un texto' })
  @IsNotEmpty({ message: 'preguntaId no puede estar vacío' })
  preguntaId!: string;

  @IsInt({ message: 'opcionId debe ser un entero' })
  @Min(0, { message: 'opcionId debe ser mayor o igual a 0' })
  opcionId!: number;
}

export class SubmitAttemptDto {
  @IsUUID('4', { message: 'activityId debe ser un UUID válido' })
  activityId!: string;

  @IsArray({ message: 'respuestas debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'Envía al menos una respuesta' })
  @ArrayMaxSize(50, { message: 'Envía como máximo 50 respuestas' })
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  respuestas!: SubmitAnswerDto[];

  /** UUID generado por el cliente para reintentos idempotentes de sincronización. (CLAUDE) */
  @IsOptional()
  @IsUUID('4', { message: 'attemptId debe ser un UUID válido' })
  attemptId?: string;
}
