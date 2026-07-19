'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
import { Label } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { usePostEntity, usePutEntity } from '@/hooks/Queries';
import {
  UserFormData,
  userEditFormResolver,
  userFormDefaultValues,
  userFormResolver,
} from '@/shared/formSchemas';
import { IUser } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedUserStore } from '@/store';

export interface UserCreateFormProps {
  onSaved: () => void;
}

interface UpdateUserPayload {
  name: string;
  email: string;
  password?: string;
}

export const UserCreateForm = ({ onSaved }: UserCreateFormProps) => {
  const selectedUser = useSelectedUserStore((state) => state.selectedUser);
  const isEditMode = !!selectedUser;

  const { control, handleSubmit, reset } = useForm<UserFormData>({
    resolver: isEditMode ? userEditFormResolver : userFormResolver,
    defaultValues: userFormDefaultValues,
  });

  useEffect(() => {
    reset(
      selectedUser
        ? { name: selectedUser.name, email: selectedUser.email, password: '' }
        : userFormDefaultValues,
    );
  }, [selectedUser, reset]);

  const createUserMutation = usePostEntity<IUser, UserFormData>({
    url: '/users',
    invalidateQueryKeys: [['/users']],
    onSuccess: () => {
      showToast({
        message: 'Usuário cadastrado com sucesso.',
        type: 'success',
      });
      reset(userFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o usuário.',
        type: 'error',
      });
    },
  });

  const updateUserMutation = usePutEntity<IUser, UpdateUserPayload>({
    url: `/users/${selectedUser?.id}`,
    invalidateQueryKeys: [['/users']],
    onSuccess: () => {
      showToast({
        message: 'Usuário atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o usuário.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditMode) {
      updateUserMutation.mutate({
        name: data.name,
        email: data.email,
        ...(data.password ? { password: data.password } : {}),
      });
      return;
    }

    createUserMutation.mutate(data);
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="user-form-name">Nome</Label>
        <FormTextInput
          id="user-form-name"
          name="name"
          control={control}
          placeholder="Digite o nome"
          icon={<FiUser />}
        />
      </div>

      <div>
        <Label htmlFor="user-form-email">E-mail</Label>
        <FormTextInput
          id="user-form-email"
          name="email"
          type="email"
          control={control}
          placeholder="Digite o e-mail"
          icon={<FiMail />}
        />
      </div>

      <div>
        <Label htmlFor="user-form-password">
          Senha{isEditMode ? ' (opcional)' : ''}
        </Label>
        <FormPasswordInput
          id="user-form-password"
          name="password"
          control={control}
          placeholder={
            isEditMode ? 'Deixe em branco para manter a atual' : 'Digite a senha'
          }
          icon={<FiLock />}
        />
      </div>

      <PrimaryButton type="submit" isLoading={isPending} sx={{ marginTop: '8px' }}>
        {isEditMode ? 'Salvar' : 'Cadastrar'}
      </PrimaryButton>
    </form>
  );
};
