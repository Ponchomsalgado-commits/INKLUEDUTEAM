import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { TemplatesModule } from './templates/templates.module';
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
    TemplatesModule,
    MediaModule,
    ActivitiesModule,
    ProgressModule,
  ],
  controllers: [AppController],
})
export class AppModule {}