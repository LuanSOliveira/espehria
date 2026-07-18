import { NEXT_PUBLIC_ENCRYPT_KEY } from '@/shared/constants';
import CryptoJS from 'crypto-js';

const secretKey = String(NEXT_PUBLIC_ENCRYPT_KEY);

export function EncriptyToken(token: string | null | undefined) {
  const encriptedToken = CryptoJS.AES.encrypt(
    token ? token : '',
    secretKey,
  ).toString();
  return encriptedToken;
}

export function DecriptyToken(token: string | null | undefined) {
  const decriptedToken = CryptoJS.AES.decrypt(token ? token : '', secretKey);
  const utfToken = decriptedToken.toString(CryptoJS.enc.Utf8);
  return utfToken;
}
