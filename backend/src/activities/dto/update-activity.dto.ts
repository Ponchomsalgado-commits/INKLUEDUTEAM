import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Edición parcial: la plantilla de origen no se puede cambiar (para otra plantilla, crea otra actividad). (CLAUDE)*/
export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(150, { message: 'El título no puede superar 150 caracteres' })
  title?: string;

  @IsOptional()
  @IsObject({ message: 'contentJson debe ser un objeto' })
  contentJson?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Una actividad admite como máximo 10 archivos' })
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  mediaUrls?: string[];
}