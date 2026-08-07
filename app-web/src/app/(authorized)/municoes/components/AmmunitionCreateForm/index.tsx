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
  AmmunitionFormData,
  ammunitionFormDefaultValues,
  ammunitionFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IAmmunition, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedAmmunitionStore } from '@/store';

export interface AmmunitionCreateFormProps {
  onSaved: () => void;
}

interface AmmunitionPayload
  extends Omit<
    AmmunitionFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const AmmunitionCreateForm = ({
  onSaved,
}: AmmunitionCreateFormProps) => {
  const selectedAmmunition = useSelectedAmmunitionStore(
    (state) => state.selectedAmmunition,
  );
  const isEditMode = !!selectedAmmunition;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: ammunitionDetail,
    isLoading: isAmmunitionDetailLoading,
    isError: isAmmunitionDetailError,
    error: ammunitionDetailError,
  } = useGetEntityById<IAmmunition>({
    url: `/ammunition/${selectedAmmunition?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<AmmunitionFormData>({
    resolver: ammunitionFormResolver,
    defaultValues: ammunitionFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(ammunitionFormDefaultValues);
      return;
    }

    if (!ammunitionDetail) {
      return;
    }

    reset({
      name: ammunitionDetail.name,
      referenceImage: ammunitionDetail.referenceImage ?? '',
      description: ammunitionDetail.description ?? '',
      price:
        ammunitionDetail.price != null ? String(ammunitionDetail.price) : '',
      currencyId: ammunitionDetail.currency?.id ?? '',
      privateInformation: ammunitionDetail.privateInformation ?? '',
      tagIds: ammunitionDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, ammunitionDetail, reset]);

  useEffect(() => {
    if (!isAmmunitionDetailError) {
      return;
    }

    showToast({
      message:
        ammunitionDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da munição.',
      type: 'error',
    });
  }, [isAmmunitionDetailError, ammunitionDetailError]);

  const buildPayload = (data: AmmunitionFormData): AmmunitionPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createAmmunitionMutation = usePostEntity<
    IAmmunition,
    AmmunitionPayload
  >({
    url: '/ammunition',
    invalidateQueryKeys: [['/ammunition']],
    onSuccess: () => {
      showToast({
        message: 'Munição cadastrada com sucesso.',
        type: 'success',
      });
      reset(ammunitionFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a munição.',
        type: 'error',
      });
    },
  });

  const updateAmmunitionMutation = usePutEntity<
    IAmmunition,
    AmmunitionPayload
  >({
    url: `/ammunition/${selectedAmmunition?.id}`,
    invalidateQueryKeys: [['/ammunition']],
    onSuccess: () => {
      showToast({
        message: 'Munição atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a munição.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: AmmunitionFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateAmmunitionMutation.mutate(payload);
      return;
    }

    createAmmunitionMutation.mutate(payload);
  };

  const isPending =
    createAmmunitionMutation.isPending || updateAmmunitionMutation.isPending;

  if (isEditMode && isAmmunitionDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da munição...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="ammunition-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="ammunition-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="ammunition-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<AmmunitionFormData, ICurrency>
          id="ammunition-form-currency"
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

        <FormMultiAutocompleteInput<AmmunitionFormData, ITag>
          id="ammunition-form-tags"
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
          id="ammunition-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a munição"
        />
      </div>

      <FormRichTextInput
        id="ammunition-form-private-information"
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
