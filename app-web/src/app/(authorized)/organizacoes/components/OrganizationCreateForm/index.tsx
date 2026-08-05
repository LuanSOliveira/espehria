'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  OrganizationFormData,
  organizationFormDefaultValues,
  organizationFormResolver,
} from '@/shared/formSchemas';
import { IOrganization, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedOrganizationStore } from '@/store';
import {
  OrganizationMemberDraft,
  OrganizationMemberField,
} from '../OrganizationMemberField';

export interface OrganizationCreateFormProps {
  onSaved: () => void;
}

interface OrganizationMemberPayload {
  characterId: string;
  role: string;
}

interface OrganizationPayload
  extends Omit<OrganizationFormData, 'referenceImage' | 'description'> {
  referenceImage?: string;
  description?: string;
  members: OrganizationMemberPayload[];
}

export const OrganizationCreateForm = ({
  onSaved,
}: OrganizationCreateFormProps) => {
  const selectedOrganization = useSelectedOrganizationStore(
    (state) => state.selectedOrganization,
  );
  const isEditMode = !!selectedOrganization;

  const [members, setMembers] = useState<OrganizationMemberDraft[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: organizationDetail,
    isLoading: isOrganizationDetailLoading,
    isError: isOrganizationDetailError,
    error: organizationDetailError,
  } = useGetEntityById<IOrganization>({
    url: `/organizations/${selectedOrganization?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<OrganizationFormData>({
    resolver: organizationFormResolver,
    defaultValues: organizationFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(organizationFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setMembers([]);
      return;
    }

    if (!organizationDetail) {
      return;
    }

    reset({
      name: organizationDetail.name,
      referenceImage: organizationDetail.referenceImage ?? '',
      tagIds: organizationDetail.tags?.map((tag) => tag.id) ?? [],
      description: organizationDetail.description ?? '',
      privateInformation: organizationDetail.privateInformation ?? '',
    });
    setMembers(
      organizationDetail.members?.map((member) => ({
        character: member.character,
        role: member.role,
      })) ?? [],
    );
  }, [isEditMode, organizationDetail, reset]);

  useEffect(() => {
    if (!isOrganizationDetailError) {
      return;
    }

    showToast({
      message:
        organizationDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da organização.',
      type: 'error',
    });
  }, [isOrganizationDetailError, organizationDetailError]);

  const buildPayload = (
    data: OrganizationFormData,
    members: OrganizationMemberDraft[],
  ): OrganizationPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    tagIds: data.tagIds ?? [],
    description: data.description || undefined,
    members: members.map((member) => ({
      characterId: member.character.id,
      role: member.role,
    })),
  });

  const createOrganizationMutation = usePostEntity<
    IOrganization,
    OrganizationPayload
  >({
    url: '/organizations',
    invalidateQueryKeys: [['/organizations']],
    onSuccess: () => {
      showToast({
        message: 'Organização cadastrada com sucesso.',
        type: 'success',
      });
      reset(organizationFormDefaultValues);
      setMembers([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a organização.',
        type: 'error',
      });
    },
  });

  const updateOrganizationMutation = usePutEntity<
    IOrganization,
    OrganizationPayload
  >({
    url: `/organizations/${selectedOrganization?.id}`,
    invalidateQueryKeys: [['/organizations']],
    onSuccess: () => {
      showToast({
        message: 'Organização atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a organização.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    const payload = buildPayload(data, members);

    if (isEditMode) {
      updateOrganizationMutation.mutate(payload);
      return;
    }

    createOrganizationMutation.mutate(payload);
  };

  const isPending =
    createOrganizationMutation.isPending || updateOrganizationMutation.isPending;

  if (isEditMode && isOrganizationDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da organização...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="organization-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="organization-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<OrganizationFormData, ITag>
          id="organization-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={(tag) => tag.name}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />
      </div>

      <FormRichTextInput
        id="organization-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a organização"
      />

      <OrganizationMemberField value={members} onChange={setMembers} />

      <FormRichTextInput
        id="organization-form-private-information"
        name="privateInformation"
        control={control}
        label="Informações Privadas"
        placeholder="Anotações internas não destinadas ao público"
      />

      <PrimaryButton
        type="submit"
        isLoading={isPending}
        sx={{ marginTop: '8px' }}
      >
        {isEditMode ? 'Salvar' : 'Cadastrar'}
      </PrimaryButton>
    </form>
  );
};
