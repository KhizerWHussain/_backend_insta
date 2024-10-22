import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import AuthService, { AuthModel } from './auth.service';

@Injectable()
export default class AuthGuard implements CanActivate {
    constructor(private _reflector: Reflector, private _authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const requiredAuthorization = this._reflector.get<string[]>(
            'authorization',
            context.getHandler(),
        );
        const roles = this._reflector.get<UserType[]>('roles', context.getHandler());

        if (requiredAuthorization) {
            const token = request.headers['authorization'];
            if (!token) {
                throw new UnauthorizedException();
            }

            let auth: AuthModel = await this._authService.GetSession(token);
            if (
                !auth ||
                (auth && !auth.user) ||
                (roles.length && !roles.includes(auth?.user?.type))
            ) {
                throw new UnauthorizedException();
            }

            request.user = auth.user;
        }

        return true;
    }
}
