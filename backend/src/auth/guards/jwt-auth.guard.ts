import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
 import { JwtService } from '@nestjs/jwt';
 import {ConfigService} from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader: string | undefined = request.headers['authorization'];

        if (!authHeader) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid authorization header format');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            });
            request.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return true;
    }
}