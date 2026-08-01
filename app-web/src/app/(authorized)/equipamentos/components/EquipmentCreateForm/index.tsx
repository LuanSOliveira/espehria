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
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  EquipmentFormData,
  equipmentFormDefaultValues,
  equipmentFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IEquipment, ITag, ITagListFilters } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedEquipmentStore } from '@/store';

export interface EquipmentCreateFormProps {
  onSaved: () => void;
}

interface EquipmentPayload
  extends Omit<
    EquipmentFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const EquipmentCreateForm = ({ onSaved }: EquipmentCreateFormProps) => {
  const selectedEquipment = useSelectedEquipmentStore(
    (state) => state.selectedEquipment,
  );
  const isEditMode = !!selectedEquipment;

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: equipmentDetail,
    isLoading: isEquipmentDetailLoading,
    isError: isEquipmentDetailError,
    error: equipmentDetailError,
  } = useGetEntityById<IEquipment>({
    url: `/equipment/${selectedEquipment?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<EquipmentFormData>({
    resolver: equipmentFormResolver,
    defaultValues: equipmentFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(equipmentFormDefaultValues);
      return;
    }

    if (!equipmentDetail) {
      return;
    }

    reset({
      name: equipmentDetail.name,
      referenceImage: equipmentDetail.referenceImage ?? '',
      description: equipmentDetail.description ?? '',
      price:
        equipmentDetail.price != null ? String(equipmentDetail.price) : '',
      currencyId: equipmentDetail.currency?.id ?? '',
      privateInformation: equipmentDetail.privateInformation ?? '',
      tagIds: equipmentDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, equipmentDetail, reset]);

  useEffect(() => {
    if (!isEquipmentDetailError) {
      return;
    }

    showToast({
      message:
        equipmentDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do equipamento.',
      type: 'error',
    });
  }, [isEquipmentDetailError, equipmentDetailError]);

  const buildPayload = (data: EquipmentFormData): EquipmentPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createEquipmentMutation = usePostEntity<IEquipment, EquipmentPayload>({
    url: '/equipment',
    invalidateQueryKeys: [['/equipment']],
    onSuccess: () => {
      showToast({
        message: 'Equipamento cadastrado com sucesso.',
        type: 'success',
      });
      reset(equipmentFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o equipamento.',
        type: 'error',
      });
    },
  });

  const updateEquipmentMutation = usePutEntity<IEquipment, EquipmentPayload>({
    url: `/equipment/${selectedEquipment?.id}`,
    invalidateQueryKeys: [['/equipment']],
    onSuccess: () => {
      showToast({
        message: 'Equipamento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o equipamento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateEquipmentMutation.mutate(payload);
      return;
    }

    createEquipmentMutation.mutate(payload);
  };

  const isPending =
    createEquipmentMutation.isPending || updateEquipmentMutation.isPending;

  if (isEditMode && isEquipmentDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do equipamento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="equipment-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="equipment-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="equipment-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<EquipmentFormData, ICurrency>
          id="equipment-form-currency"
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

        <FormMultiAutocompleteInput<EquipmentFormData, ITag>
          id="equipment-form-tags"
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
          id="equipment-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o equipamento"
        />
      </div>

      <FormRichTextInput
        id="equipment-form-private-information"
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
