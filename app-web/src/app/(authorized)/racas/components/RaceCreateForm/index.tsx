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
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
  useRaceCategoriesQuery,
} from '@/hooks/Queries';
import {
  RaceFormData,
  raceFormDefaultValues,
  raceFormResolver,
} from '@/shared/formSchemas';
import {
  IRace,
  IRaceCategory,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedRaceStore } from '@/store';

export interface RaceCreateFormProps {
  onSaved: () => void;
}

interface RacePayload extends Omit<RaceFormData, 'referenceImageUrl'> {
  referenceImageUrl?: string;
}

export const RaceCreateForm = ({ onSaved }: RaceCreateFormProps) => {
  const selectedRace = useSelectedRaceStore((state) => state.selectedRace);
  const isEditMode = !!selectedRace;

  const { data: categories } = useRaceCategoriesQuery();

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: raceDetail,
    isLoading: isRaceDetailLoading,
    isError: isRaceDetailError,
    error: raceDetailError,
  } = useGetEntityById<IRace>({
    url: `/races/${selectedRace?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<RaceFormData>({
    resolver: raceFormResolver,
    defaultValues: raceFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(raceFormDefaultValues);
      return;
    }

    if (!raceDetail) {
      return;
    }

    reset({
      name: raceDetail.name,
      categoryId: raceDetail.category.id,
      referenceImageUrl: raceDetail.referenceImageUrl ?? '',
      physicalCharacteristics: raceDetail.physicalCharacteristics ?? '',
      description: raceDetail.description ?? '',
      tagIds: raceDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, raceDetail, reset]);

  useEffect(() => {
    if (!isRaceDetailError) {
      return;
    }

    showToast({
      message:
        raceDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da raça.',
      type: 'error',
    });
  }, [isRaceDetailError, raceDetailError]);

  const buildPayload = (data: RaceFormData): RacePayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createRaceMutation = usePostEntity<IRace, RacePayload>({
    url: '/races',
    invalidateQueryKeys: [['/races']],
    onSuccess: () => {
      showToast({
        message: 'Raça cadastrada com sucesso.',
        type: 'success',
      });
      reset(raceFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a raça.',
        type: 'error',
      });
    },
  });

  const updateRaceMutation = usePutEntity<IRace, RacePayload>({
    url: `/races/${selectedRace?.id}`,
    invalidateQueryKeys: [['/races']],
    onSuccess: () => {
      showToast({
        message: 'Raça atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a raça.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: RaceFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateRaceMutation.mutate(payload);
      return;
    }

    createRaceMutation.mutate(payload);
  };

  const isPending =
    createRaceMutation.isPending || updateRaceMutation.isPending;

  if (isEditMode && isRaceDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da raça...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="race-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<RaceFormData, IRaceCategory>
          id="race-form-category"
          name="categoryId"
          control={control}
          label="Categoria"
          options={categories ?? []}
          getOptionLabel={(category) => category.name}
          getOptionValue={(category) => category.id}
          placeholder="Selecione a categoria"
        />

        <FormTextInput
          id="race-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<RaceFormData, ITag>
          id="race-form-tags"
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormRichTextInput
          id="race-form-physical-characteristics"
          name="physicalCharacteristics"
          control={control}
          label="Características Físicas"
          placeholder="Descreva as características físicas"
        />

        <FormRichTextInput
          id="race-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a raça"
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
