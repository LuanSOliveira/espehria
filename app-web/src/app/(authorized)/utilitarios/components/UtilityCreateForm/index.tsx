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
  useCurrenciesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  UtilityFormData,
  utilityFormDefaultValues,
  utilityFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IUtility, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedUtilityStore } from '@/store';

export interface UtilityCreateFormProps {
  onSaved: () => void;
}

interface UtilityPayload
  extends Omit<
    UtilityFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const UtilityCreateForm = ({ onSaved }: UtilityCreateFormProps) => {
  const selectedUtility = useSelectedUtilityStore(
    (state) => state.selectedUtility,
  );
  const isEditMode = !!selectedUtility;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: utilityDetail,
    isLoading: isUtilityDetailLoading,
    isError: isUtilityDetailError,
    error: utilityDetailError,
  } = useGetEntityById<IUtility>({
    url: `/utilities/${selectedUtility?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<UtilityFormData>({
    resolver: utilityFormResolver,
    defaultValues: utilityFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(utilityFormDefaultValues);
      return;
    }

    if (!utilityDetail) {
      return;
    }

    reset({
      name: utilityDetail.name,
      referenceImage: utilityDetail.referenceImage ?? '',
      description: utilityDetail.description ?? '',
      price: utilityDetail.price != null ? String(utilityDetail.price) : '',
      currencyId: utilityDetail.currency?.id ?? '',
      privateInformation: utilityDetail.privateInformation ?? '',
      tagIds: utilityDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, utilityDetail, reset]);

  useEffect(() => {
    if (!isUtilityDetailError) {
      return;
    }

    showToast({
      message:
        utilityDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do utilitário.',
      type: 'error',
    });
  }, [isUtilityDetailError, utilityDetailError]);

  const buildPayload = (data: UtilityFormData): UtilityPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createUtilityMutation = usePostEntity<IUtility, UtilityPayload>({
    url: '/utilities',
    invalidateQueryKeys: [['/utilities']],
    onSuccess: () => {
      showToast({
        message: 'Utilitário cadastrado com sucesso.',
        type: 'success',
      });
      reset(utilityFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o utilitário.',
        type: 'error',
      });
    },
  });

  const updateUtilityMutation = usePutEntity<IUtility, UtilityPayload>({
    url: `/utilities/${selectedUtility?.id}`,
    invalidateQueryKeys: [['/utilities']],
    onSuccess: () => {
      showToast({
        message: 'Utilitário atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o utilitário.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: UtilityFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateUtilityMutation.mutate(payload);
      return;
    }

    createUtilityMutation.mutate(payload);
  };

  const isPending =
    createUtilityMutation.isPending || updateUtilityMutation.isPending;

  if (isEditMode && isUtilityDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do utilitário...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="utility-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="utility-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="utility-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<UtilityFormData, ICurrency>
          id="utility-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) =>
            `${currency.abbreviation} - ${currency.name}`
          }
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormMultiAutocompleteInput<UtilityFormData, ITag>
          id="utility-form-tags"
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

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="utility-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o utilitário"
        />
      </div>

      <FormRichTextInput
        id="utility-form-private-information"
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
