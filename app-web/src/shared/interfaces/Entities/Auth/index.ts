import { IEntity } from '../Entity';

export type AuthProvider = 'local' | 'google';

export interface IAuthUser extends IEntity {
  email: string;
  name: string;
  provider: AuthProvider;
}

export interface IAuthResponse {
  accessToken: string;
  user: IAuthUser;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
}
