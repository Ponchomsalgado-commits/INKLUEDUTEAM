import { BadRequestException, ValidationError } from '@nestjs/common';

interface CampoInvalido {
  field: string;
  message: string;
}

function aplanar(errores: ValidationError[], padre = ''): CampoInvalido[] {
  return errores.flatMap((e) => {
    const field = padre ? `${padre}.${e.property}` : e.property;
    const propios = e.constraints
      ? [{ field, message: Object.values(e.constraints)[0] }]
      : [];
    return [...propios, ...aplanar(e.children ?? [], field)];
  });
}

/**
 * Para ValidationPipe({ exceptionFactory }): convierte los errores de class-validator
 * al formato único { error: 'VALIDATION_ERROR', message, field } (sección 3.12). (CLAUDE)
 */
export function validationExceptionFactory(errores: ValidationError[]) {
  const primero = aplanar(errores)[0];
  return new BadRequestException({
    error: 'VALIDATION_ERROR',
    message: primero?.message ?? 'Los datos enviados no son válidos.',
    field: primero?.field,
  });
}
