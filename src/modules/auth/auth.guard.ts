import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import AuthService, { AuthModel } from './auth.service'; // Import AuthService to validate the token

@Injectable()
export default class AuthGuard implements CanActivate {
  constructor(
    private _reflector: Reflector,
    private _authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract authorization metadata from the route handler
    const requiredAuthorization = this._reflector.get<boolean>(
      'authorization',
      context.getHandler(),
    );
    const roles = this._reflector.get<UserType[]>(
      'roles',
      context.getHandler(),
    );

    if (requiredAuthorization) {
      const token = request.headers['authorization']; // Get the token from headers
      if (!token) {
        throw new UnauthorizedException('Token not provided');
      }

      // Validate the token and get the user session
      let auth: AuthModel = await this._authService.GetSession(token);
      if (!auth || !auth.user) {
        throw new UnauthorizedException('Invalid token or user session');
      }

      // Check if user has the required role
      if (roles?.length && !roles.includes(auth.user.type)) {
        throw new UnauthorizedException('User does not have the required role');
      }

      // Attach the user to the request object for further use
      request.user = auth.user;
    }

    return true;
  }
}
