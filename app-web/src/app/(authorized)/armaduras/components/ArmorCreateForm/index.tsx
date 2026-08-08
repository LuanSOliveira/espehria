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
  ArmorFormData,
  armorFormDefaultValues,
  armorFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IArmor, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedArmorStore } from '@/store';

export interface ArmorCreateFormProps {
  onSaved: () => void;
}

interface ArmorPayload
  extends Omit<
    ArmorFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const ArmorCreateForm = ({ onSaved }: ArmorCreateFormProps) => {
  const selectedArmor = useSelectedArmorStore((state) => state.selectedArmor);
  const isEditMode = !!selectedArmor;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: armorDetail,
    isLoading: isArmorDetailLoading,
    isError: isArmorDetailError,
    error: armorDetailError,
  } = useGetEntityById<IArmor>({
    url: `/armors/${selectedArmor?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<ArmorFormData>({
    resolver: armorFormResolver,
    defaultValues: armorFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(armorFormDefaultValues);
      return;
    }

    if (!armorDetail) {
      return;
    }

    reset({
      name: armorDetail.name,
      referenceImage: armorDetail.referenceImage ?? '',
      description: armorDetail.description ?? '',
      price: armorDetail.price != null ? String(armorDetail.price) : '',
      currencyId: armorDetail.currency?.id ?? '',
      privateInformation: armorDetail.privateInformation ?? '',
      tagIds: armorDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, armorDetail, reset]);

  useEffect(() => {
    if (!isArmorDetailError) {
      return;
    }

    showToast({
      message:
        armorDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da armadura.',
      type: 'error',
    });
  }, [isArmorDetailError, armorDetailError]);

  const buildPayload = (data: ArmorFormData): ArmorPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createArmorMutation = usePostEntity<IArmor, ArmorPayload>({
    url: '/armors',
    invalidateQueryKeys: [['/armors']],
    onSuccess: () => {
      showToast({
        message: 'Armadura cadastrada com sucesso.',
        type: 'success',
      });
      reset(armorFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a armadura.',
        type: 'error',
      });
    },
  });

  const updateArmorMutation = usePutEntity<IArmor, ArmorPayload>({
    url: `/armors/${selectedArmor?.id}`,
    invalidateQueryKeys: [['/armors']],
    onSuccess: () => {
      showToast({
        message: 'Armadura atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a armadura.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ArmorFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateArmorMutation.mutate(payload);
      return;
    }

    createArmorMutation.mutate(payload);
  };

  const isPending =
    createArmorMutation.isPending || updateArmorMutation.isPending;

  if (isEditMode && isArmorDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da armadura...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="armor-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="armor-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="armor-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ArmorFormData, ICurrency>
          id="armor-form-currency"
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

        <FormMultiAutocompleteInput<ArmorFormData, ITag>
          id="armor-form-tags"
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
          id="armor-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a armadura"
        />
      </div>

      <FormRichTextInput
        id="armor-form-private-information"
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
