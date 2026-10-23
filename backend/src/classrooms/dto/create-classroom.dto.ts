import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ClassroomType } from '@prisma/client';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ClassroomType, { message: 'Type must be GRUPO or INDIVIDUAL' })
  type!: ClassroomType;
}
