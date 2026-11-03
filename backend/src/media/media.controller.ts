import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { isOwnedKey } from './media.rules';
import type { UploadedMedia } from './media.rules';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(Role.PROFESOR)
  @UseInterceptors(FileInterceptor('file'))
  upload(@CurrentUser() user: JwtPayload, @UploadedFile() file: UploadedMedia | undefined) {
    return this.mediaService.upload(user.sub, file);
  }

  @Get('url')
  @Roles(Role.PROFESOR)
  async signedUrl(@CurrentUser() user: JwtPayload, @Query('key') key: string) {
    if (!isOwnedKey(user.sub, key)) {
      throw new NotFoundException('El archivo no existe.');
    }
    return this.mediaService.describe(key);
  }
}