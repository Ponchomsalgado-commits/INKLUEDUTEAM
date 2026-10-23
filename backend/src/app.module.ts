import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // En Docker las variables llegan por env_file; fuera de Docker se lee el .env de la raíz
      envFilePath: ['../.env', '.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ClassroomsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
