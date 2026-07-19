'use client';

import { useForm } from 'react-hook-form';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
import { Label } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { usePostEntity } from '@/hooks/Queries';
import {
  UserFormData,
  userFormDefaultValues,
  userFormResolver,
} from '@/shared/formSchemas';
import { IUser } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface UserCreateFormProps {
  onCreated: () => void;
}

export const UserCreateForm = ({ onCreated }: UserCreateFormProps) => {
  const { control, handleSubmit, reset } = useForm<UserFormData>({
    resolver: userFormResolver,
    defaultValues: userFormDefaultValues,
  });

  const createUserMutation = usePostEntity<IUser, UserFormData>({
    url: '/users',
    invalidateQueryKeys: [['/users']],
    onSuccess: () => {
      showToast({
        message: 'Usuário cadastrado com sucesso.',
        type: 'success',
      });
      reset();
      onCreated();
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

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="user-create-name">Nome</Label>
        <FormTextInput
          id="user-create-name"
          name="name"
          control={control}
          placeholder="Digite o nome"
          icon={<FiUser />}
        />
      </div>

      <div>
        <Label htmlFor="user-create-email">E-mail</Label>
        <FormTextInput
          id="user-create-email"
          name="email"
          type="email"
          control={control}
          placeholder="Digite o e-mail"
          icon={<FiMail />}
        />
      </div>

      <div>
        <Label htmlFor="user-create-password">Senha</Label>
        <FormPasswordInput
          id="user-create-password"
          name="password"
          control={control}
          placeholder="Digite a senha"
          icon={<FiLock />}
        />
      </div>

      <PrimaryButton
        type="submit"
        isLoading={createUserMutation.isPending}
        sx={{ marginTop: '8px' }}
      >
        Cadastrar
      </PrimaryButton>
    </form>
  );
};
