import {IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty({message: 'La contraseña no puede estar vacía'})
  password!: string;
}