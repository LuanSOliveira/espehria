import { jwtDecode, JwtPayload } from 'jwt-decode';
import { NEXT_PUBLIC_AUTH_TOKEN_KEY } from '@/shared/constants';
import { AuthProvider } from '@/shared/interfaces';
import { DecriptyToken } from '../cryptoJs';
import { getCookieAdapter } from '../jsCookie';

export interface IAuthTokenPayload extends JwtPayload {
  provider: AuthProvider;
}

export function decodeToken(token: string): IAuthTokenPayload {
  const decriptedToken = DecriptyToken(token);
  return jwtDecode<IAuthTokenPayload>(decriptedToken);
}

export function getAuthToken(): string | undefined {
  const encryptedToken = getCookieAdapter(NEXT_PUBLIC_AUTH_TOKEN_KEY ?? '');

  if (!encryptedToken) {
    return undefined;
  }

  return DecriptyToken(encryptedToken);
}
