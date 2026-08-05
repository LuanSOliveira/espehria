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
  MaterialFormData,
  materialFormDefaultValues,
  materialFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IMaterial, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedMaterialStore } from '@/store';

export interface MaterialCreateFormProps {
  onSaved: () => void;
}

interface MaterialPayload
  extends Omit<
    MaterialFormData,
    'referenceImage' | 'description' | 'price' | 'currencyId' | 'privateInformation'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
}

export const MaterialCreateForm = ({ onSaved }: MaterialCreateFormProps) => {
  const selectedMaterial = useSelectedMaterialStore(
    (state) => state.selectedMaterial,
  );
  const isEditMode = !!selectedMaterial;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: materialDetail,
    isLoading: isMaterialDetailLoading,
    isError: isMaterialDetailError,
    error: materialDetailError,
  } = useGetEntityById<IMaterial>({
    url: `/materials/${selectedMaterial?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<MaterialFormData>({
    resolver: materialFormResolver,
    defaultValues: materialFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(materialFormDefaultValues);
      return;
    }

    if (!materialDetail) {
      return;
    }

    reset({
      name: materialDetail.name,
      referenceImage: materialDetail.referenceImage ?? '',
      description: materialDetail.description ?? '',
      price: materialDetail.price != null ? String(materialDetail.price) : '',
      currencyId: materialDetail.currency?.id ?? '',
      privateInformation: materialDetail.privateInformation ?? '',
      tagIds: materialDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, materialDetail, reset]);

  useEffect(() => {
    if (!isMaterialDetailError) {
      return;
    }

    showToast({
      message:
        materialDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do material.',
      type: 'error',
    });
  }, [isMaterialDetailError, materialDetailError]);

  const buildPayload = (data: MaterialFormData): MaterialPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createMaterialMutation = usePostEntity<IMaterial, MaterialPayload>({
    url: '/materials',
    invalidateQueryKeys: [['/materials']],
    onSuccess: () => {
      showToast({
        message: 'Material cadastrado com sucesso.',
        type: 'success',
      });
      reset(materialFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o material.',
        type: 'error',
      });
    },
  });

  const updateMaterialMutation = usePutEntity<IMaterial, MaterialPayload>({
    url: `/materials/${selectedMaterial?.id}`,
    invalidateQueryKeys: [['/materials']],
    onSuccess: () => {
      showToast({
        message: 'Material atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o material.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateMaterialMutation.mutate(payload);
      return;
    }

    createMaterialMutation.mutate(payload);
  };

  const isPending =
    createMaterialMutation.isPending || updateMaterialMutation.isPending;

  if (isEditMode && isMaterialDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do material...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="material-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="material-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="material-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<MaterialFormData, ICurrency>
          id="material-form-currency"
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

        <FormMultiAutocompleteInput<MaterialFormData, ITag>
          id="material-form-tags"
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
          id="material-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o material"
        />
      </div>

      <FormRichTextInput
        id="material-form-private-information"
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
