'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
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
      <FormTextInput
        id="user-form-name"
        name="name"
        control={control}
        label="Nome"
        placeholder="Digite o nome"
        icon={<FiUser />}
      />

      <FormTextInput
        id="user-form-email"
        name="email"
        type="email"
        control={control}
        label="E-mail"
        placeholder="Digite o e-mail"
        icon={<FiMail />}
      />

      <FormPasswordInput
        id="user-form-password"
        name="password"
        control={control}
        label={`Senha${isEditMode ? ' (opcional)' : ''}`}
        placeholder={
          isEditMode ? 'Deixe em branco para manter a atual' : 'Digite a senha'
        }
        icon={<FiLock />}
      />

      <PrimaryButton type="submit" isLoading={isPending} sx={{ marginTop: '8px' }}>
        {isEditMode ? 'Salvar' : 'Cadastrar'}
      </PrimaryButton>
    </form>
  );
};
