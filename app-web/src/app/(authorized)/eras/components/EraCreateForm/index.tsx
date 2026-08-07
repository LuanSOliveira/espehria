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
  useErasAllQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  EraFormData,
  eraFormDefaultValues,
  eraFormResolver,
} from '@/shared/formSchemas';
import { IEra, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedEraStore } from '@/store';

export interface EraCreateFormProps {
  onSaved: () => void;
}

interface EraPayload extends Omit<EraFormData, 'referenceImageUrl' | 'order'> {
  referenceImageUrl?: string;
  order: number;
}

export const EraCreateForm = ({ onSaved }: EraCreateFormProps) => {
  const selectedEra = useSelectedEraStore((state) => state.selectedEra);
  const isEditMode = !!selectedEra;

  const { tagOptions } = useTagOptionsQuery();

  const { data: erasAll } = useErasAllQuery();
  const totalErasCount = erasAll?.length ?? 0;
  const orderOptionsCount = isEditMode ? totalErasCount : totalErasCount + 1;
  const orderOptions = Array.from(
    { length: orderOptionsCount },
    (_, index) => index + 1,
  );

  const {
    data: eraDetail,
    isLoading: isEraDetailLoading,
    isError: isEraDetailError,
    error: eraDetailError,
  } = useGetEntityById<IEra>({
    url: `/eras/${selectedEra?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<EraFormData>({
    resolver: eraFormResolver,
    defaultValues: eraFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(eraFormDefaultValues);
      return;
    }

    if (!eraDetail) {
      return;
    }

    reset({
      name: eraDetail.name,
      referenceImageUrl: eraDetail.referenceImageUrl ?? '',
      description: eraDetail.description ?? '',
      privateInformation: eraDetail.privateInformation ?? '',
      tagIds: eraDetail.tags?.map((tag) => tag.id) ?? [],
      order: String(eraDetail.order),
    });
  }, [isEditMode, eraDetail, reset]);

  useEffect(() => {
    if (!isEraDetailError) {
      return;
    }

    showToast({
      message:
        eraDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da era.',
      type: 'error',
    });
  }, [isEraDetailError, eraDetailError]);

  const buildPayload = (data: EraFormData): EraPayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
    order: Number(data.order),
  });

  const createEraMutation = usePostEntity<IEra, EraPayload>({
    url: '/eras',
    invalidateQueryKeys: [['/eras'], ['/eras/all']],
    onSuccess: () => {
      showToast({
        message: 'Era cadastrada com sucesso.',
        type: 'success',
      });
      reset(eraFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a era.',
        type: 'error',
      });
    },
  });

  const updateEraMutation = usePutEntity<IEra, EraPayload>({
    url: `/eras/${selectedEra?.id}`,
    invalidateQueryKeys: [['/eras'], ['/eras/all']],
    onSuccess: () => {
      showToast({
        message: 'Era atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a era.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: EraFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateEraMutation.mutate(payload);
      return;
    }

    createEraMutation.mutate(payload);
  };

  const isPending = createEraMutation.isPending || updateEraMutation.isPending;

  if (isEditMode && isEraDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da era...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="era-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="era-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormAutocompleteInput<EraFormData, number>
          id="era-form-order"
          name="order"
          control={control}
          label="Ordenação"
          options={orderOptions}
          getOptionLabel={(order) => String(order)}
          getOptionValue={(order) => String(order)}
          placeholder="Selecione a ordenação"
        />

        <FormMultiAutocompleteInput<EraFormData, ITag>
          id="era-form-tags"
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
          id="era-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a era"
        />
      </div>

      <FormRichTextInput
        id="era-form-private-information"
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
