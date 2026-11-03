import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateActivityDto {
  /** Plantilla de origen (GET /templates). Define type, skin y el schema contra el que se valida. (CLAUDE) */
  @IsUUID('4', { message: 'templateId debe ser el id de una plantilla' })
  templateId!: string;

  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(150, { message: 'El título no puede superar 150 caracteres' })
  title!: string;

  /** Contenido del minijuego. Su forma la define schemaJson de la plantilla; la valida el servicio. (CLAUDE)*/
  @IsObject({ message: 'contentJson debe ser un objeto' })
  contentJson!: Record<string, unknown>;

  /** Claves devueltas por POST /media/upload (campo "key"). (CLAUDE)*/
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Una actividad admite como máximo 10 archivos' })
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  mediaUrls?: string[];
}