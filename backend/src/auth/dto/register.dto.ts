import { Role } from '@prisma/client';
import { IsEmail, IsEnum, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  password!: string;

  // TODO (pendiente de decisión del equipo): hoy cualquier cliente puede registrarse como PROFESOR
  @IsEnum(Role, { message: 'El rol debe ser "PROFESOR" o "ESTUDIANTE"' })
  role!: Role;
}
