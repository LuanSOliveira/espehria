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
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  CampaignFormData,
  campaignFormDefaultValues,
  campaignFormResolver,
} from '@/shared/formSchemas';
import { ICampaign, ITag, ITagListFilters, IUser } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedCampaignStore } from '@/store';
import { CampaignSectionsField } from '../CampaignSectionsField';
import { CampaignAllowedUsersField } from '../CampaignAllowedUsersField';

export interface CampaignCreateFormProps {
  onSaved: () => void;
}

interface CampaignSectionPayload {
  label: string;
  description?: string;
}

interface CampaignPayload
  extends Omit<CampaignFormData, 'referenceImageUrl' | 'sections'> {
  referenceImageUrl?: string;
  sections: CampaignSectionPayload[];
  allowedUserIds: string[];
}

export const CampaignCreateForm = ({ onSaved }: CampaignCreateFormProps) => {
  const selectedCampaign = useSelectedCampaignStore(
    (state) => state.selectedCampaign,
  );
  const isEditMode = !!selectedCampaign;

  const [allowedUsers, setAllowedUsers] = useState<IUser[]>([]);

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: campaignDetail,
    isLoading: isCampaignDetailLoading,
    isError: isCampaignDetailError,
    error: campaignDetailError,
  } = useGetEntityById<ICampaign>({
    url: `/campaigns/${selectedCampaign?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<CampaignFormData>({
    resolver: campaignFormResolver,
    defaultValues: campaignFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(campaignFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setAllowedUsers([]);
      return;
    }

    if (!campaignDetail) {
      return;
    }

    reset({
      name: campaignDetail.name,
      referenceImageUrl: campaignDetail.referenceImageUrl ?? '',
      description: campaignDetail.description ?? '',
      tagIds: campaignDetail.tags?.map((tag) => tag.id) ?? [],
      sections:
        campaignDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
    setAllowedUsers(campaignDetail.allowedUsers ?? []);
  }, [isEditMode, campaignDetail, reset]);

  useEffect(() => {
    if (!isCampaignDetailError) {
      return;
    }

    showToast({
      message:
        campaignDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da campanha.',
      type: 'error',
    });
  }, [isCampaignDetailError, campaignDetailError]);

  const buildPayload = (
    data: CampaignFormData,
    allowedUsers: IUser[],
  ): CampaignPayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
    allowedUserIds: allowedUsers.map((user) => user.id),
  });

  const createCampaignMutation = usePostEntity<ICampaign, CampaignPayload>({
    url: '/campaigns',
    invalidateQueryKeys: [['/campaigns']],
    onSuccess: () => {
      showToast({
        message: 'Campanha cadastrada com sucesso.',
        type: 'success',
      });
      reset(campaignFormDefaultValues);
      setAllowedUsers([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a campanha.',
        type: 'error',
      });
    },
  });

  const updateCampaignMutation = usePutEntity<ICampaign, CampaignPayload>({
    url: `/campaigns/${selectedCampaign?.id}`,
    invalidateQueryKeys: [['/campaigns']],
    onSuccess: () => {
      showToast({
        message: 'Campanha atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a campanha.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    const payload = buildPayload(data, allowedUsers);

    if (isEditMode) {
      updateCampaignMutation.mutate(payload);
      return;
    }

    createCampaignMutation.mutate(payload);
  };

  const isPending =
    createCampaignMutation.isPending || updateCampaignMutation.isPending;

  if (isEditMode && isCampaignDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da campanha...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="campaign-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="campaign-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<CampaignFormData, ITag>
          id="campaign-form-tags"
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
        id="campaign-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a campanha"
      />

      <CampaignAllowedUsersField
        value={allowedUsers}
        onChange={setAllowedUsers}
      />

      <CampaignSectionsField control={control} />

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
