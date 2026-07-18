'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { ApiAuthFactory } from '@/services/api';
import { EncriptyToken } from '@/services/cryptoJs';
import { setCookieAdapter } from '@/services/jsCookie';
import {
  IAuthResponse,
  IAxioDataError,
  IGoogleLoginPayload,
  ILoginPayload,
} from '@/shared/interfaces';
import { NEXT_PUBLIC_AUTH_TOKEN_KEY } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';
import { showToast } from '@/shared/util';

const DEFAULT_LOGIN_ERROR_MESSAGE = 'Usuário ou senha inválidos.';
const DEFAULT_GOOGLE_LOGIN_ERROR_MESSAGE =
  'Não foi possível entrar com o Google.';

const persistSession = (accessToken: string) => {
  const encryptedToken = EncriptyToken(accessToken);
  setCookieAdapter(NEXT_PUBLIC_AUTH_TOKEN_KEY ?? '', encryptedToken);
};

export const useLoginMutation = () => {
  const router = useRouter();

  return useMutation<IAuthResponse, AxiosError<IAxioDataError>, ILoginPayload>({
    mutationFn: async (payload) => {
      const api = ApiAuthFactory();
      const { data } = await api.post<IAuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      persistSession(data.accessToken);
      router.push(APP_ROUTES.private.home);
    },
    onError: (error) => {
      showToast({
        message: error.response?.data?.message ?? DEFAULT_LOGIN_ERROR_MESSAGE,
        type: 'error',
      });
    },
  });
};

export const useGoogleLoginMutation = () => {
  const router = useRouter();

  return useMutation<
    IAuthResponse,
    AxiosError<IAxioDataError>,
    IGoogleLoginPayload
  >({
    mutationFn: async (payload) => {
      const api = ApiAuthFactory();
      const { data } = await api.post<IAuthResponse>('/auth/google', payload);
      return data;
    },
    onSuccess: (data) => {
      persistSession(data.accessToken);
      router.push(APP_ROUTES.private.home);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? DEFAULT_GOOGLE_LOGIN_ERROR_MESSAGE,
        type: 'error',
      });
    },
  });
};
