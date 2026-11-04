import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

/** Codigos de error por estado HTTP, documento seccion 3.12 (maga28) */
const HTTP_ERROR_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',          // Error de validacion de datos
  401: 'UNAUTHORIZED',              // Error de autenticacion
  403: 'FORBIDDEN',                 // Error de autorizacion
  404: 'NOT_FOUND',                 // Recurso no encontrado
  409: 'CONFLICT',                  // Conflicto de datos (por ejemplo, al intentar crear un recurso que ya existe)
  413: 'PAYLOAD_TOO_LARGE',         // Payload demasiado grande
  415: 'UNSUPPORTED_MEDIA_TYPE',    // Tipo de medio no soportado
  503: 'SERVICE_UNAVAILABLE',       // Servicio no disponible
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  field?: string;
}

/**
 * Todo error de la API responde con la misma forma:
 * { statusCode, error, message, field? }. Así web y móvil usan un solo manejador de errores.
 * Los errores no controlados devuelven un 500 genérico: nunca se filtra el stack al cliente.
 *(CLAUDE)
 **/

 @Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const body = this.build(exception);

    if (body.statusCode >= 500) {
      // Solo el mensaje y el stack del error; nunca el cuerpo de la petición (puede traer contraseñas) (CLAUDE)
      const detalle = exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);
      this.logger.error(detalle);
    }

    response.status(body.statusCode).json(body);
  }

  build(exception: unknown): ApiErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: 500,
        error: 'INTERNAL_ERROR',
        message: 'Algo salió mal en el servidor. Intenta de nuevo.',
      };
    }

    const statusCode = exception.getStatus();
    const raw = exception.getResponse();
    let error = HTTP_ERROR_CODES[statusCode] ?? 'ERROR';
    let message = exception.message;
    let field: string | undefined;

    if (typeof raw === 'string') {
      message = raw;
    } else if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      // Código propio (p. ej. 'VALIDATION_ERROR'); el 'Bad Request' que pone Nest por defecto se ignora (CLAUDE)
      if (typeof r.error === 'string' && /^[A-Z_]+$/.test(r.error)) error = r.error;
      if (typeof r.message === 'string') message = r.message;
      else if (Array.isArray(r.message)) message = r.message.map(String).join(' ');
      if (typeof r.field === 'string') field = r.field;
    }

    if (statusCode === 413) message = 'El archivo supera el tamaño máximo permitido.';

    return field ? { statusCode, error, message, field } : { statusCode, error, message };
  }
}