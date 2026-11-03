import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
  ValidationError,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { validationExceptionFactory } from './validation-exception.factory';

describe('AllExceptionsFilter', () => {
  const filtro = new AllExceptionsFilter();

  it('mapea los errores HTTP al formato único con su código', () => {
    expect(filtro.build(new UnauthorizedException('Invalid credentials'))).toEqual({
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Invalid credentials',
    });
    expect(filtro.build(new ForbiddenException()).error).toBe('FORBIDDEN');
    expect(filtro.build(new NotFoundException('No existe')).error).toBe('NOT_FOUND');
    expect(filtro.build(new ConflictException('Email already in use')).error).toBe('CONFLICT');
  });

  it('respeta el código y el campo cuando el error los trae', () => {
    const e = new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: "El campo 'pregunta' es requerido.",
      field: 'pregunta',
    });
    expect(filtro.build(e)).toEqual({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: "El campo 'pregunta' es requerido.",
      field: 'pregunta',
    });
  });

  it('el mensaje siempre es texto (une los arreglos de Nest)', () => {
    const body = filtro.build(new BadRequestException(['a', 'b']));
    expect(body.message).toBe('a b');
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('413 muestra un mensaje amigable', () => {
    expect(filtro.build(new PayloadTooLargeException()).message).toContain('tamaño máximo');
  });

  it('un error inesperado devuelve 500 genérico sin filtrar detalles', () => {
    const body = filtro.build(new Error('password=secreta en la consulta'));
    expect(body.statusCode).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('secreta');
  });
});

describe('validationExceptionFactory', () => {
  it('devuelve el primer campo inválido, también en objetos anidados', () => {
    const errores = [
      {
        property: 'contentJson',
        constraints: undefined,
        children: [{ property: 'x', constraints: { isString: 'x debe ser texto' }, children: [] }],
      },
    ] as unknown as ValidationError[];

    const e = validationExceptionFactory(errores);
    expect(e.getResponse()).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: 'x debe ser texto',
      field: 'contentJson.x',
    });
  });
});