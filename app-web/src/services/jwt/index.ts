import { jwtDecode } from 'jwt-decode';
import { NEXT_PUBLIC_AUTH_TOKEN_KEY } from '@/shared/constants';
import { DecriptyToken } from '../cryptoJs';
import { getCookieAdapter } from '../jsCookie';

export function decodeToken(token: string) {
  const decriptedToken = DecriptyToken(token);
  return jwtDecode(decriptedToken);
}

export function getAuthToken(): string | undefined {
  const encryptedToken = getCookieAdapter(NEXT_PUBLIC_AUTH_TOKEN_KEY ?? '');

  if (!encryptedToken) {
    return undefined;
  }

  return DecriptyToken(encryptedToken);
}
