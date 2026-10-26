import { Role } from '@prisma/client';

/** Contenido de los access y refresh tokens. `sub` es el id del usuario. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
