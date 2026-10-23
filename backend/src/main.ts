import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Todas las rutas quedan bajo /api/v1 (ver documento técnico, sección 1.7)
  app.setGlobalPrefix('api/v1');

  // CORS_ORIGINS: lista separada por comas. Vacío = acepta cualquier origen (solo desarrollo)
  const origins = config.get<string>('CORS_ORIGINS', '');
  app.enableCors({
    origin: origins
      ? origins
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`API escuchando en el puerto ${port}`, 'Bootstrap');
}
bootstrap();
