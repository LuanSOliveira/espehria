'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormAutocompleteInput,
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
  useTraitTypesQuery,
} from '@/hooks/Queries';
import {
  TraitFormData,
  traitFormDefaultValues,
  traitFormResolver,
} from '@/shared/formSchemas';
import { ITag, ITrait, ITraitType } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedTraitStore } from '@/store';

export interface TraitCreateFormProps {
  onSaved: () => void;
}

interface TraitPayload extends Omit<TraitFormData, 'traitTypeId' | 'description'> {
  traitTypeId?: string;
  description?: string;
}

export const TraitCreateForm = ({ onSaved }: TraitCreateFormProps) => {
  const selectedTrait = useSelectedTraitStore((state) => state.selectedTrait);
  const isEditMode = !!selectedTrait;

  const { tagOptions } = useTagOptionsQuery();
  const { data: traitTypesData } = useTraitTypesQuery();
  const traitTypeOptions = traitTypesData ?? [];

  const {
    data: traitDetail,
    isLoading: isTraitDetailLoading,
    isError: isTraitDetailError,
    error: traitDetailError,
  } = useGetEntityById<ITrait>({
    url: `/traits/${selectedTrait?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TraitFormData>({
    resolver: traitFormResolver,
    defaultValues: traitFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(traitFormDefaultValues);
      return;
    }

    if (!traitDetail) {
      return;
    }

    reset({
      name: traitDetail.name,
      traitTypeId: traitDetail.traitType?.id ?? '',
      tagIds: traitDetail.tags?.map((tag) => tag.id) ?? [],
      description: traitDetail.description ?? '',
    });
  }, [isEditMode, traitDetail, reset]);

  useEffect(() => {
    if (!isTraitDetailError) {
      return;
    }

    showToast({
      message:
        traitDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do traço.',
      type: 'error',
    });
  }, [isTraitDetailError, traitDetailError]);

  const buildPayload = (data: TraitFormData): TraitPayload => ({
    ...data,
    traitTypeId: data.traitTypeId || undefined,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createTraitMutation = usePostEntity<ITrait, TraitPayload>({
    url: '/traits',
    invalidateQueryKeys: [['/traits']],
    onSuccess: () => {
      showToast({
        message: 'Traço cadastrado com sucesso.',
        type: 'success',
      });
      reset(traitFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar o traço.',
        type: 'error',
      });
    },
  });

  const updateTraitMutation = usePutEntity<ITrait, TraitPayload>({
    url: `/traits/${selectedTrait?.id}`,
    invalidateQueryKeys: [['/traits']],
    onSuccess: () => {
      showToast({
        message: 'Traço atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar o traço.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TraitFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateTraitMutation.mutate(payload);
      return;
    }

    createTraitMutation.mutate(payload);
  };

  const isPending =
    createTraitMutation.isPending || updateTraitMutation.isPending;

  if (isEditMode && isTraitDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do traço...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="trait-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<TraitFormData, ITraitType>
          id="trait-form-trait-type"
          name="traitTypeId"
          control={control}
          label="Tipo de Traço"
          options={traitTypeOptions}
          getOptionLabel={(traitType) => traitType.name}
          getOptionValue={(traitType) => traitType.id}
          placeholder="Selecione o tipo de traço"
        />

        <FormMultiAutocompleteInput<TraitFormData, ITag>
          id="trait-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />
      </div>

      <FormRichTextInput
        id="trait-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o traço"
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
