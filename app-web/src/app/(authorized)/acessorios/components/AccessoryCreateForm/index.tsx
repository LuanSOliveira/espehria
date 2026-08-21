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
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import {
  useCurrenciesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  AccessoryFormData,
  accessoryFormDefaultValues,
  accessoryFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IAccessory, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedAccessoryStore } from '@/store';

export interface AccessoryCreateFormProps {
  onSaved: () => void;
}

interface EmbeddedEffectPayload {
  name: string;
  effect?: string;
}

interface AccessoryPayload
  extends Omit<
    AccessoryFormData,
    | 'referenceImage'
    | 'description'
    | 'price'
    | 'currencyId'
    | 'privateInformation'
    | 'volume'
    | 'enchantments'
    | 'enhancements'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
  volume?: number | null;
  enchantments: EmbeddedEffectPayload[];
  enhancements: EmbeddedEffectPayload[];
}

export const AccessoryCreateForm = ({ onSaved }: AccessoryCreateFormProps) => {
  const selectedAccessory = useSelectedAccessoryStore(
    (state) => state.selectedAccessory,
  );
  const isEditMode = !!selectedAccessory;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: accessoryDetail,
    isLoading: isAccessoryDetailLoading,
    isError: isAccessoryDetailError,
    error: accessoryDetailError,
  } = useGetEntityById<IAccessory>({
    url: `/accessories/${selectedAccessory?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<AccessoryFormData>({
    resolver: accessoryFormResolver,
    defaultValues: accessoryFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(accessoryFormDefaultValues);
      return;
    }

    if (!accessoryDetail) {
      return;
    }

    reset({
      name: accessoryDetail.name,
      referenceImage: accessoryDetail.referenceImage ?? '',
      description: accessoryDetail.description ?? '',
      price: accessoryDetail.price != null ? String(accessoryDetail.price) : '',
      currencyId: accessoryDetail.currency?.id ?? '',
      volume:
        accessoryDetail.volume != null ? String(accessoryDetail.volume) : '',
      privateInformation: accessoryDetail.privateInformation ?? '',
      tagIds: accessoryDetail.tags?.map((tag) => tag.id) ?? [],
      enchantments: (accessoryDetail.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
      enhancements: (accessoryDetail.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
    });
  }, [isEditMode, accessoryDetail, reset]);

  useEffect(() => {
    if (!isAccessoryDetailError) {
      return;
    }

    showToast({
      message:
        accessoryDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do acessório.',
      type: 'error',
    });
  }, [isAccessoryDetailError, accessoryDetailError]);

  const buildEmbeddedEffectPayload = (
    items: AccessoryFormData['enchantments'],
  ): EmbeddedEffectPayload[] =>
    items.map((item) => ({
      name: item.name,
      effect: item.effect || undefined,
    }));

  const buildPayload = (data: AccessoryFormData): AccessoryPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    volume: data.volume ? Number(data.volume) : null,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
    enchantments: buildEmbeddedEffectPayload(data.enchantments),
    enhancements: buildEmbeddedEffectPayload(data.enhancements),
  });

  const createAccessoryMutation = usePostEntity<IAccessory, AccessoryPayload>({
    url: '/accessories',
    invalidateQueryKeys: [['/accessories']],
    onSuccess: () => {
      showToast({
        message: 'Acessório cadastrado com sucesso.',
        type: 'success',
      });
      reset(accessoryFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o acessório.',
        type: 'error',
      });
    },
  });

  const updateAccessoryMutation = usePutEntity<IAccessory, AccessoryPayload>({
    url: `/accessories/${selectedAccessory?.id}`,
    invalidateQueryKeys: [['/accessories']],
    onSuccess: () => {
      showToast({
        message: 'Acessório atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o acessório.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: AccessoryFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateAccessoryMutation.mutate(payload);
      return;
    }

    createAccessoryMutation.mutate(payload);
  };

  const isPending =
    createAccessoryMutation.isPending || updateAccessoryMutation.isPending;

  if (isEditMode && isAccessoryDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do acessório...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="accessory-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="accessory-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="accessory-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<AccessoryFormData, ICurrency>
          id="accessory-form-currency"
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

        <FormMultiAutocompleteInput<AccessoryFormData, ITag>
          id="accessory-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />

        <FormTextInput
          id="accessory-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />
      </div>

      <EmbeddedEffectsField control={control} applicableType="accessory" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="accessory-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o acessório"
        />
      </div>

      <FormRichTextInput
        id="accessory-form-private-information"
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
