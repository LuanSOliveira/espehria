import { jwtDecode } from 'jwt-decode';
import { DecriptyToken } from '../cryptoJs';

export function decodeToken(token: string) {
  const decriptedToken = DecriptyToken(token);
  return jwtDecode(decriptedToken);
}
