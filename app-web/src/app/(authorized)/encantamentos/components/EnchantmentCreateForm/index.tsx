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
  EnchantmentFormData,
  enchantmentFormDefaultValues,
  enchantmentFormResolver,
} from '@/shared/formSchemas';
import { IEnchantment } from '@/shared/interfaces';
import { EQUIPMENT_APPLICABLE_TYPE_OPTIONS } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedEnchantmentStore } from '@/store';

export interface EnchantmentCreateFormProps {
  onSaved: () => void;
}

interface EnchantmentPayload extends Omit<EnchantmentFormData, 'type' | 'effect'> {
  type?: EnchantmentFormData['type'];
  effect?: string;
}

export const EnchantmentCreateForm = ({
  onSaved,
}: EnchantmentCreateFormProps) => {
  const selectedEnchantment = useSelectedEnchantmentStore(
    (state) => state.selectedEnchantment,
  );
  const isEditMode = !!selectedEnchantment;

  const {
    data: enchantmentDetail,
    isLoading: isEnchantmentDetailLoading,
    isError: isEnchantmentDetailError,
    error: enchantmentDetailError,
  } = useGetEntityById<IEnchantment>({
    url: `/enchantments/${selectedEnchantment?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<EnchantmentFormData>({
    resolver: enchantmentFormResolver,
    defaultValues: enchantmentFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(enchantmentFormDefaultValues);
      return;
    }

    if (!enchantmentDetail) {
      return;
    }

    reset({
      name: enchantmentDetail.name,
      type: enchantmentDetail.type ?? '',
      effect: enchantmentDetail.effect ?? '',
    });
  }, [isEditMode, enchantmentDetail, reset]);

  useEffect(() => {
    if (!isEnchantmentDetailError) {
      return;
    }

    showToast({
      message:
        enchantmentDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do encantamento.',
      type: 'error',
    });
  }, [isEnchantmentDetailError, enchantmentDetailError]);

  const buildPayload = (data: EnchantmentFormData): EnchantmentPayload => ({
    ...data,
    type: data.type || undefined,
    effect: data.effect || undefined,
  });

  const createEnchantmentMutation = usePostEntity<
    IEnchantment,
    EnchantmentPayload
  >({
    url: '/enchantments',
    invalidateQueryKeys: [['/enchantments']],
    onSuccess: () => {
      showToast({
        message: 'Encantamento cadastrado com sucesso.',
        type: 'success',
      });
      reset(enchantmentFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o encantamento.',
        type: 'error',
      });
    },
  });

  const updateEnchantmentMutation = usePutEntity<
    IEnchantment,
    EnchantmentPayload
  >({
    url: `/enchantments/${selectedEnchantment?.id}`,
    invalidateQueryKeys: [['/enchantments']],
    onSuccess: () => {
      showToast({
        message: 'Encantamento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o encantamento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: EnchantmentFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateEnchantmentMutation.mutate(payload);
      return;
    }

    createEnchantmentMutation.mutate(payload);
  };

  const isPending =
    createEnchantmentMutation.isPending || updateEnchantmentMutation.isPending;

  if (isEditMode && isEnchantmentDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do encantamento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="enchantment-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<
          EnchantmentFormData,
          (typeof EQUIPMENT_APPLICABLE_TYPE_OPTIONS)[number]
        >
          id="enchantment-form-type"
          name="type"
          control={control}
          label="Tipo de encantamento"
          options={EQUIPMENT_APPLICABLE_TYPE_OPTIONS}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          placeholder="Selecione o tipo"
        />
      </div>

      <FormRichTextInput
        id="enchantment-form-effect"
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
