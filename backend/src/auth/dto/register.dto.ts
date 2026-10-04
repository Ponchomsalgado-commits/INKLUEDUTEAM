import {IsEmail, IsEnum, MinLength} from 'class-validator';
import {Role} from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6, {message: 'La contraseña debe tener al menos 6 caracteres'})
  password!: string;

  @IsEnum(Role ,{message: 'El rol debe ser "PROFESOR" o "ESTUDIANTE"'})
  role!: Role;
}