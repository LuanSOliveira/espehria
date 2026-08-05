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
  ConsumableFormData,
  consumableFormDefaultValues,
  consumableFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IConsumable, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedConsumableStore } from '@/store';

export interface ConsumableCreateFormProps {
  onSaved: () => void;
}

interface ConsumablePayload
  extends Omit<
    ConsumableFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const ConsumableCreateForm = ({
  onSaved,
}: ConsumableCreateFormProps) => {
  const selectedConsumable = useSelectedConsumableStore(
    (state) => state.selectedConsumable,
  );
  const isEditMode = !!selectedConsumable;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: consumableDetail,
    isLoading: isConsumableDetailLoading,
    isError: isConsumableDetailError,
    error: consumableDetailError,
  } = useGetEntityById<IConsumable>({
    url: `/consumables/${selectedConsumable?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<ConsumableFormData>({
    resolver: consumableFormResolver,
    defaultValues: consumableFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(consumableFormDefaultValues);
      return;
    }

    if (!consumableDetail) {
      return;
    }

    reset({
      name: consumableDetail.name,
      referenceImage: consumableDetail.referenceImage ?? '',
      description: consumableDetail.description ?? '',
      price:
        consumableDetail.price != null ? String(consumableDetail.price) : '',
      currencyId: consumableDetail.currency?.id ?? '',
      privateInformation: consumableDetail.privateInformation ?? '',
      tagIds: consumableDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, consumableDetail, reset]);

  useEffect(() => {
    if (!isConsumableDetailError) {
      return;
    }

    showToast({
      message:
        consumableDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do consumível.',
      type: 'error',
    });
  }, [isConsumableDetailError, consumableDetailError]);

  const buildPayload = (data: ConsumableFormData): ConsumablePayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createConsumableMutation = usePostEntity<
    IConsumable,
    ConsumablePayload
  >({
    url: '/consumables',
    invalidateQueryKeys: [['/consumables']],
    onSuccess: () => {
      showToast({
        message: 'Consumível cadastrado com sucesso.',
        type: 'success',
      });
      reset(consumableFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o consumível.',
        type: 'error',
      });
    },
  });

  const updateConsumableMutation = usePutEntity<
    IConsumable,
    ConsumablePayload
  >({
    url: `/consumables/${selectedConsumable?.id}`,
    invalidateQueryKeys: [['/consumables']],
    onSuccess: () => {
      showToast({
        message: 'Consumível atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o consumível.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ConsumableFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateConsumableMutation.mutate(payload);
      return;
    }

    createConsumableMutation.mutate(payload);
  };

  const isPending =
    createConsumableMutation.isPending || updateConsumableMutation.isPending;

  if (isEditMode && isConsumableDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do consumível...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="consumable-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="consumable-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="consumable-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ConsumableFormData, ICurrency>
          id="consumable-form-currency"
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

        <FormMultiAutocompleteInput<ConsumableFormData, ITag>
          id="consumable-form-tags"
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
          id="consumable-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o consumível"
        />
      </div>

      <FormRichTextInput
        id="consumable-form-private-information"
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
