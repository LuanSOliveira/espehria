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
  ShieldFormData,
  shieldFormDefaultValues,
  shieldFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IShield, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedShieldStore } from '@/store';

export interface ShieldCreateFormProps {
  onSaved: () => void;
}

interface ShieldPayload
  extends Omit<
    ShieldFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const ShieldCreateForm = ({ onSaved }: ShieldCreateFormProps) => {
  const selectedShield = useSelectedShieldStore((state) => state.selectedShield);
  const isEditMode = !!selectedShield;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: shieldDetail,
    isLoading: isShieldDetailLoading,
    isError: isShieldDetailError,
    error: shieldDetailError,
  } = useGetEntityById<IShield>({
    url: `/shields/${selectedShield?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<ShieldFormData>({
    resolver: shieldFormResolver,
    defaultValues: shieldFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(shieldFormDefaultValues);
      return;
    }

    if (!shieldDetail) {
      return;
    }

    reset({
      name: shieldDetail.name,
      referenceImage: shieldDetail.referenceImage ?? '',
      description: shieldDetail.description ?? '',
      price: shieldDetail.price != null ? String(shieldDetail.price) : '',
      currencyId: shieldDetail.currency?.id ?? '',
      privateInformation: shieldDetail.privateInformation ?? '',
      tagIds: shieldDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, shieldDetail, reset]);

  useEffect(() => {
    if (!isShieldDetailError) {
      return;
    }

    showToast({
      message:
        shieldDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do escudo.',
      type: 'error',
    });
  }, [isShieldDetailError, shieldDetailError]);

  const buildPayload = (data: ShieldFormData): ShieldPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createShieldMutation = usePostEntity<IShield, ShieldPayload>({
    url: '/shields',
    invalidateQueryKeys: [['/shields']],
    onSuccess: () => {
      showToast({
        message: 'Escudo cadastrado com sucesso.',
        type: 'success',
      });
      reset(shieldFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o escudo.',
        type: 'error',
      });
    },
  });

  const updateShieldMutation = usePutEntity<IShield, ShieldPayload>({
    url: `/shields/${selectedShield?.id}`,
    invalidateQueryKeys: [['/shields']],
    onSuccess: () => {
      showToast({
        message: 'Escudo atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o escudo.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ShieldFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateShieldMutation.mutate(payload);
      return;
    }

    createShieldMutation.mutate(payload);
  };

  const isPending =
    createShieldMutation.isPending || updateShieldMutation.isPending;

  if (isEditMode && isShieldDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do escudo...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="shield-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="shield-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="shield-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ShieldFormData, ICurrency>
          id="shield-form-currency"
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

        <FormMultiAutocompleteInput<ShieldFormData, ITag>
          id="shield-form-tags"
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

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="shield-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o escudo"
        />
      </div>

      <FormRichTextInput
        id="shield-form-private-information"
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
