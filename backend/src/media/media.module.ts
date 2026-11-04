import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { maxBytesFrom } from './media.rules';
import { MediaService } from './media.service';

@Module({
  imports: [
    AuthModule,
    // El límite de tamaño puede ediatrse en el .env (MAGA28)
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: { fileSize: maxBytesFrom(config.get('MEDIA_MAX_MB')) },
      }),
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}