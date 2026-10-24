import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const env: Record<string, string> = {
    JWT_ACCESS_SECRET: 'secreto-access',
    JWT_REFRESH_SECRET: 'secreto-refresh',
    JWT_ACCESS_EXPIRES_IN: '30m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };
  const config = { getOrThrow: (key: string) => env[key] } as unknown as ConfigService;
  const jwt = new JwtService();
  const users = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    comparePasswords: jest.fn(),
  };
  const service = new AuthService(users as unknown as UsersService, jwt, config);
  const user = { id: 'u1', email: 'profe@test.com', role: 'PROFESOR', passwordHash: 'hash' };

  beforeEach(() => jest.resetAllMocks());

  it('login correcto devuelve tokens con el rol del usuario', async () => {
    users.findByEmail.mockResolvedValue(user);
    users.comparePasswords.mockResolvedValue(true);

    const { access_token, refresh_token } = await service.login({
      email: user.email,
      password: 'x',
    });

    const payload = await jwt.verifyAsync(access_token, { secret: env.JWT_ACCESS_SECRET });
    expect(payload).toMatchObject({ sub: 'u1', role: 'PROFESOR' });
    expect(refresh_token).toBeTruthy();
  });

  it('correo inexistente y contraseña incorrecta dan el mismo 401', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'no@test.com', password: 'x' })).rejects.toThrow(
      'Invalid credentials',
    );

    users.findByEmail.mockResolvedValue(user);
    users.comparePasswords.mockResolvedValue(false);
    await expect(service.login({ email: user.email, password: 'mala' })).rejects.toThrow(
      'Invalid credentials',
    );
  });

  it('refresh con un token válido devuelve tokens nuevos', async () => {
    users.findById.mockResolvedValue(user);
    const refresh = await jwt.signAsync(
      { sub: 'u1', email: user.email, role: 'PROFESOR' },
      { secret: env.JWT_REFRESH_SECRET },
    );

    await expect(service.refresh({ refresh_token: refresh })).resolves.toHaveProperty(
      'access_token',
    );
    expect(users.findById).toHaveBeenCalledWith('u1');
  });

  it('refresh rechaza un access token usado como refresh token', async () => {
    const access = await jwt.signAsync({ sub: 'u1' }, { secret: env.JWT_ACCESS_SECRET });

    await expect(service.refresh({ refresh_token: access })).rejects.toThrow(UnauthorizedException);
  });
});
