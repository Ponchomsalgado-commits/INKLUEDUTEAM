import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/v1/auth/registro — crea la cuenta y devuelve { access_token, refresh_token }. */
  @Post('registro')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** POST /api/v1/auth/login — devuelve { access_token, refresh_token }. */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** POST /api/v1/auth/refrescar — cambia un refresh_token válido por un par de tokens nuevo. */
  @Post('refrescar')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  /** GET /api/v1/auth/perfil — devuelve el contenido del access token. */
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
