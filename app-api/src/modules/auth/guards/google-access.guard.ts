import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { AuthProvider } from '../../users/enums/auth-provider.enum';
import {
  GOOGLE_ACCESS_KEY,
  GoogleAccessLevel,
} from '../decorators/google-access.decorator';

@Injectable()
export class GoogleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const level = this.reflector.getAllAndOverride<
      GoogleAccessLevel | undefined
    >(GOOGLE_ACCESS_KEY, [context.getHandler(), context.getClass()]);

    if (!level) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();

    if (request.user.provider !== AuthProvider.GOOGLE) {
      return true;
    }

    if (level === 'blocked') {
      throw new ForbiddenException(
        'Usuários autenticados via Google não possuem acesso a este recurso.',
      );
    }

    if (request.method !== 'GET') {
      throw new ForbiddenException(
        'Usuários autenticados via Google possuem acesso somente de visualização.',
      );
    }

    return true;
  }
}
