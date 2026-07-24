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
  useDivinityCategoriesQuery,
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  DivinityFormData,
  divinityFormDefaultValues,
  divinityFormResolver,
} from '@/shared/formSchemas';
import {
  IDivinity,
  IDivinityCategory,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedDivinityStore } from '@/store';

export interface DivinityCreateFormProps {
  onSaved: () => void;
}

interface DivinityPayload extends Omit<DivinityFormData, 'referenceImage'> {
  referenceImage?: string;
}

export const DivinityCreateForm = ({ onSaved }: DivinityCreateFormProps) => {
  const selectedDivinity = useSelectedDivinityStore(
    (state) => state.selectedDivinity,
  );
  const isEditMode = !!selectedDivinity;

  const { data: categories } = useDivinityCategoriesQuery();

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: divinityDetail,
    isLoading: isDivinityDetailLoading,
    isError: isDivinityDetailError,
    error: divinityDetailError,
  } = useGetEntityById<IDivinity>({
    url: `/divinities/${selectedDivinity?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<DivinityFormData>({
    resolver: divinityFormResolver,
    defaultValues: divinityFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(divinityFormDefaultValues);
      return;
    }

    if (!divinityDetail) {
      return;
    }

    reset({
      name: divinityDetail.name,
      categoryId: divinityDetail.category.id,
      referenceImage: divinityDetail.referenceImage ?? '',
      description: divinityDetail.description ?? '',
      tagIds: divinityDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, divinityDetail, reset]);

  useEffect(() => {
    if (!isDivinityDetailError) {
      return;
    }

    showToast({
      message:
        divinityDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da divindade.',
      type: 'error',
    });
  }, [isDivinityDetailError, divinityDetailError]);

  const buildPayload = (data: DivinityFormData): DivinityPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createDivinityMutation = usePostEntity<IDivinity, DivinityPayload>({
    url: '/divinities',
    invalidateQueryKeys: [['/divinities']],
    onSuccess: () => {
      showToast({
        message: 'Divindade cadastrada com sucesso.',
        type: 'success',
      });
      reset(divinityFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a divindade.',
        type: 'error',
      });
    },
  });

  const updateDivinityMutation = usePutEntity<IDivinity, DivinityPayload>({
    url: `/divinities/${selectedDivinity?.id}`,
    invalidateQueryKeys: [['/divinities']],
    onSuccess: () => {
      showToast({
        message: 'Divindade atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a divindade.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: DivinityFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateDivinityMutation.mutate(payload);
      return;
    }

    createDivinityMutation.mutate(payload);
  };

  const isPending =
    createDivinityMutation.isPending || updateDivinityMutation.isPending;

  if (isEditMode && isDivinityDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da divindade...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="divinity-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<DivinityFormData, IDivinityCategory>
          id="divinity-form-category"
          name="categoryId"
          control={control}
          label="Categoria"
          options={categories ?? []}
          getOptionLabel={(category) => category.name}
          getOptionValue={(category) => category.id}
          placeholder="Selecione a categoria"
        />

        <FormTextInput
          id="divinity-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<DivinityFormData, ITag>
          id="divinity-form-tags"
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
          id="divinity-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a divindade"
        />
      </div>

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
