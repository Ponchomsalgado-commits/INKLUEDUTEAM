import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  const contextWithUser = (user?: { role: Role }) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('deja pasar si la ruta no declara @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWithUser({ role: 'ESTUDIANTE' }))).toBe(true);
  });

  it('deja pasar al rol permitido', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROFESOR']);
    expect(guard.canActivate(contextWithUser({ role: 'PROFESOR' }))).toBe(true);
  });

  it('bloquea a un rol no permitido', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROFESOR']);
    expect(guard.canActivate(contextWithUser({ role: 'ESTUDIANTE' }))).toBe(false);
  });

  it('bloquea si no hay usuario autenticado', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROFESOR']);
    expect(guard.canActivate(contextWithUser(undefined))).toBe(false);
  });
});
