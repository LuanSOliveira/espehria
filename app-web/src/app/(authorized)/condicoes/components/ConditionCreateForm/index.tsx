'use client';

import { useEffect } from 'react';
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
  ConditionFormData,
  conditionFormDefaultValues,
  conditionFormResolver,
} from '@/shared/formSchemas';
import { ICondition, ITag, ITagListFilters } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedConditionStore } from '@/store';
import { ConditionSectionsField } from '../ConditionSectionsField';

export interface ConditionCreateFormProps {
  onSaved: () => void;
}

interface ConditionSectionPayload {
  label: string;
  description?: string;
}

interface ConditionPayload extends Omit<ConditionFormData, 'sections'> {
  sections: ConditionSectionPayload[];
}

export const ConditionCreateForm = ({ onSaved }: ConditionCreateFormProps) => {
  const selectedCondition = useSelectedConditionStore(
    (state) => state.selectedCondition,
  );
  const isEditMode = !!selectedCondition;

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: conditionDetail,
    isLoading: isConditionDetailLoading,
    isError: isConditionDetailError,
    error: conditionDetailError,
  } = useGetEntityById<ICondition>({
    url: `/conditions/${selectedCondition?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<ConditionFormData>({
    resolver: conditionFormResolver,
    defaultValues: conditionFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(conditionFormDefaultValues);
      return;
    }

    if (!conditionDetail) {
      return;
    }

    reset({
      name: conditionDetail.name,
      description: conditionDetail.description ?? '',
      tagIds: conditionDetail.tags?.map((tag) => tag.id) ?? [],
      sections:
        conditionDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
  }, [isEditMode, conditionDetail, reset]);

  useEffect(() => {
    if (!isConditionDetailError) {
      return;
    }

    showToast({
      message:
        conditionDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da condição.',
      type: 'error',
    });
  }, [isConditionDetailError, conditionDetailError]);

  const buildPayload = (data: ConditionFormData): ConditionPayload => ({
    ...data,
    tagIds: data.tagIds ?? [],
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
  });

  const createConditionMutation = usePostEntity<ICondition, ConditionPayload>({
    url: '/conditions',
    invalidateQueryKeys: [['/conditions']],
    onSuccess: () => {
      showToast({
        message: 'Condição cadastrada com sucesso.',
        type: 'success',
      });
      reset(conditionFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a condição.',
        type: 'error',
      });
    },
  });

  const updateConditionMutation = usePutEntity<ICondition, ConditionPayload>({
    url: `/conditions/${selectedCondition?.id}`,
    invalidateQueryKeys: [['/conditions']],
    onSuccess: () => {
      showToast({
        message: 'Condição atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a condição.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ConditionFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateConditionMutation.mutate(payload);
      return;
    }

    createConditionMutation.mutate(payload);
  };

  const isPending =
    createConditionMutation.isPending || updateConditionMutation.isPending;

  if (isEditMode && isConditionDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da condição...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="condition-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<ConditionFormData, ITag>
          id="condition-form-tags"
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
        id="condition-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a condição"
      />

      <ConditionSectionsField control={control} />

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
