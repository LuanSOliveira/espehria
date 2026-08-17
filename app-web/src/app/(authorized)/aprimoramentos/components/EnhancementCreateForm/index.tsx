'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import { useGetEntityById, usePostEntity, usePutEntity } from '@/hooks/Queries';
import {
  EnhancementFormData,
  enhancementFormDefaultValues,
  enhancementFormResolver,
} from '@/shared/formSchemas';
import { IEnhancement } from '@/shared/interfaces';
import { EQUIPMENT_APPLICABLE_TYPE_OPTIONS } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEnhancementStore } from '@/store';

export interface EnhancementCreateFormProps {
  onSaved: () => void;
}

interface EnhancementPayload extends Omit<EnhancementFormData, 'type' | 'effect'> {
  type?: EnhancementFormData['type'];
  effect?: string;
}

export const EnhancementCreateForm = ({
  onSaved,
}: EnhancementCreateFormProps) => {
  const selectedEnhancement = useSelectedEnhancementStore(
    (state) => state.selectedEnhancement,
  );
  const isEditMode = !!selectedEnhancement;

  const {
    data: enhancementDetail,
    isLoading: isEnhancementDetailLoading,
    isError: isEnhancementDetailError,
    error: enhancementDetailError,
  } = useGetEntityById<IEnhancement>({
    url: `/enhancements/${selectedEnhancement?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<EnhancementFormData>({
    resolver: enhancementFormResolver,
    defaultValues: enhancementFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(enhancementFormDefaultValues);
      return;
    }

    if (!enhancementDetail) {
      return;
    }

    reset({
      name: enhancementDetail.name,
      type: enhancementDetail.type ?? '',
      effect: enhancementDetail.effect ?? '',
    });
  }, [isEditMode, enhancementDetail, reset]);

  useEffect(() => {
    if (!isEnhancementDetailError) {
      return;
    }

    showToast({
      message:
        enhancementDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do aprimoramento.',
      type: 'error',
    });
  }, [isEnhancementDetailError, enhancementDetailError]);

  const buildPayload = (data: EnhancementFormData): EnhancementPayload => ({
    ...data,
    type: data.type || undefined,
    effect: data.effect || undefined,
  });

  const createEnhancementMutation = usePostEntity<
    IEnhancement,
    EnhancementPayload
  >({
    url: '/enhancements',
    invalidateQueryKeys: [['/enhancements']],
    onSuccess: () => {
      showToast({
        message: 'Aprimoramento cadastrado com sucesso.',
        type: 'success',
      });
      reset(enhancementFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o aprimoramento.',
        type: 'error',
      });
    },
  });

  const updateEnhancementMutation = usePutEntity<
    IEnhancement,
    EnhancementPayload
  >({
    url: `/enhancements/${selectedEnhancement?.id}`,
    invalidateQueryKeys: [['/enhancements']],
    onSuccess: () => {
      showToast({
        message: 'Aprimoramento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o aprimoramento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: EnhancementFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateEnhancementMutation.mutate(payload);
      return;
    }

    createEnhancementMutation.mutate(payload);
  };

  const isPending =
    createEnhancementMutation.isPending || updateEnhancementMutation.isPending;

  if (isEditMode && isEnhancementDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do aprimoramento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="enhancement-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<
          EnhancementFormData,
          (typeof EQUIPMENT_APPLICABLE_TYPE_OPTIONS)[number]
        >
          id="enhancement-form-type"
          name="type"
          control={control}
          label="Tipo de aprimoramento"
          options={EQUIPMENT_APPLICABLE_TYPE_OPTIONS}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          placeholder="Selecione o tipo"
        />
      </div>

      <FormRichTextInput
        id="enhancement-form-effect"
        name="effect"
        control={control}
        label="Efeito"
        placeholder="Descreva o efeito"
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
