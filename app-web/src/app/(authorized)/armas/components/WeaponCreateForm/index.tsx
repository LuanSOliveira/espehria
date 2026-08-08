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
  WeaponFormData,
  weaponFormDefaultValues,
  weaponFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IWeapon, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedWeaponStore } from '@/store';

export interface WeaponCreateFormProps {
  onSaved: () => void;
}

interface WeaponPayload
  extends Omit<
    WeaponFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const WeaponCreateForm = ({ onSaved }: WeaponCreateFormProps) => {
  const selectedWeapon = useSelectedWeaponStore((state) => state.selectedWeapon);
  const isEditMode = !!selectedWeapon;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: weaponDetail,
    isLoading: isWeaponDetailLoading,
    isError: isWeaponDetailError,
    error: weaponDetailError,
  } = useGetEntityById<IWeapon>({
    url: `/weapons/${selectedWeapon?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<WeaponFormData>({
    resolver: weaponFormResolver,
    defaultValues: weaponFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(weaponFormDefaultValues);
      return;
    }

    if (!weaponDetail) {
      return;
    }

    reset({
      name: weaponDetail.name,
      referenceImage: weaponDetail.referenceImage ?? '',
      description: weaponDetail.description ?? '',
      price: weaponDetail.price != null ? String(weaponDetail.price) : '',
      currencyId: weaponDetail.currency?.id ?? '',
      privateInformation: weaponDetail.privateInformation ?? '',
      tagIds: weaponDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, weaponDetail, reset]);

  useEffect(() => {
    if (!isWeaponDetailError) {
      return;
    }

    showToast({
      message:
        weaponDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da arma.',
      type: 'error',
    });
  }, [isWeaponDetailError, weaponDetailError]);

  const buildPayload = (data: WeaponFormData): WeaponPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createWeaponMutation = usePostEntity<IWeapon, WeaponPayload>({
    url: '/weapons',
    invalidateQueryKeys: [['/weapons']],
    onSuccess: () => {
      showToast({
        message: 'Arma cadastrada com sucesso.',
        type: 'success',
      });
      reset(weaponFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a arma.',
        type: 'error',
      });
    },
  });

  const updateWeaponMutation = usePutEntity<IWeapon, WeaponPayload>({
    url: `/weapons/${selectedWeapon?.id}`,
    invalidateQueryKeys: [['/weapons']],
    onSuccess: () => {
      showToast({
        message: 'Arma atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a arma.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: WeaponFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateWeaponMutation.mutate(payload);
      return;
    }

    createWeaponMutation.mutate(payload);
  };

  const isPending =
    createWeaponMutation.isPending || updateWeaponMutation.isPending;

  if (isEditMode && isWeaponDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da arma...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="weapon-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="weapon-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="weapon-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<WeaponFormData, ICurrency>
          id="weapon-form-currency"
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

        <FormMultiAutocompleteInput<WeaponFormData, ITag>
          id="weapon-form-tags"
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
          id="weapon-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a arma"
        />
      </div>

      <FormRichTextInput
        id="weapon-form-private-information"
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
