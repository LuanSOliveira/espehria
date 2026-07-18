/* eslint-disable @typescript-eslint/no-explicit-any */

import { NEXT_PUBLIC_API_URL } from '@/shared/constants';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface Api {
  get: <T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D> | undefined,
  ) => Promise<R>;
  post: <T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D | undefined,
    config?: AxiosRequestConfig<D> | undefined,
  ) => Promise<R>;
  put: <T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D | undefined,
    config?: AxiosRequestConfig<D> | undefined,
  ) => Promise<R>;
  patch: <T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D | undefined,
    config?: AxiosRequestConfig<D> | undefined,
  ) => Promise<R>;
  delete: <T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D> | undefined,
  ) => Promise<R>;
}

export const ApiFactory = (token?: string | null): Api => {
  const axiosInstace = axios.create({
    baseURL: NEXT_PUBLIC_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    get: axiosInstace.get,
    post: axiosInstace.post,
    put: axiosInstace.put,
    patch: axiosInstace.patch,
    delete: axiosInstace.delete,
  };
};

export const ApiAuthFactory = (): Api => {
  const axiosInstace = axios.create({
    baseURL: NEXT_PUBLIC_API_URL,
  });

  return {
    get: axiosInstace.get,
    post: axiosInstace.post,
    put: axiosInstace.put,
    patch: axiosInstace.patch,
    delete: axiosInstace.delete,
  };
};
