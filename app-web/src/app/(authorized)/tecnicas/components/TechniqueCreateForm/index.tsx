'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  TechniqueFormData,
  techniqueFormDefaultValues,
  techniqueFormResolver,
} from '@/shared/formSchemas';
import { ITag, ITagListFilters, ITechnique } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedTechniqueStore } from '@/store';

export interface TechniqueCreateFormProps {
  onSaved: () => void;
}

interface TechniquePayload
  extends Omit<TechniqueFormData, 'referenceImage' | 'description'> {
  referenceImage?: string;
  description?: string;
}

export const TechniqueCreateForm = ({ onSaved }: TechniqueCreateFormProps) => {
  const selectedTechnique = useSelectedTechniqueStore(
    (state) => state.selectedTechnique,
  );
  const isEditMode = !!selectedTechnique;

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: techniqueDetail,
    isLoading: isTechniqueDetailLoading,
    isError: isTechniqueDetailError,
    error: techniqueDetailError,
  } = useGetEntityById<ITechnique>({
    url: `/techniques/${selectedTechnique?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TechniqueFormData>({
    resolver: techniqueFormResolver,
    defaultValues: techniqueFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(techniqueFormDefaultValues);
      return;
    }

    if (!techniqueDetail) {
      return;
    }

    reset({
      name: techniqueDetail.name,
      referenceImage: techniqueDetail.referenceImage ?? '',
      description: techniqueDetail.description ?? '',
      tagIds: techniqueDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, techniqueDetail, reset]);

  useEffect(() => {
    if (!isTechniqueDetailError) {
      return;
    }

    showToast({
      message:
        techniqueDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da técnica.',
      type: 'error',
    });
  }, [isTechniqueDetailError, techniqueDetailError]);

  const buildPayload = (data: TechniqueFormData): TechniquePayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createTechniqueMutation = usePostEntity<ITechnique, TechniquePayload>({
    url: '/techniques',
    invalidateQueryKeys: [['/techniques']],
    onSuccess: () => {
      showToast({
        message: 'Técnica cadastrada com sucesso.',
        type: 'success',
      });
      reset(techniqueFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a técnica.',
        type: 'error',
      });
    },
  });

  const updateTechniqueMutation = usePutEntity<ITechnique, TechniquePayload>({
    url: `/techniques/${selectedTechnique?.id}`,
    invalidateQueryKeys: [['/techniques']],
    onSuccess: () => {
      showToast({
        message: 'Técnica atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a técnica.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TechniqueFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateTechniqueMutation.mutate(payload);
      return;
    }

    createTechniqueMutation.mutate(payload);
  };

  const isPending =
    createTechniqueMutation.isPending || updateTechniqueMutation.isPending;

  if (isEditMode && isTechniqueDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da técnica...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="technique-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="technique-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<TechniqueFormData, ITag>
          id="technique-form-tags"
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

      <FormRichTextInput
        id="technique-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a técnica"
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
