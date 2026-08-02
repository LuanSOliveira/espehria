import { IEntity } from '../Entity';
import { AuthProvider } from '../Auth';

export interface IUser extends IEntity {
  email: string;
  name: string;
  provider: AuthProvider;
  createdAt: string;
}

export interface IUserListFilters {
  email?: string;
  page?: number;
  perPage?: number;
}

export interface IGoogleUserListFilters {
  search?: string;
  page?: number;
  perPage?: number;
}
