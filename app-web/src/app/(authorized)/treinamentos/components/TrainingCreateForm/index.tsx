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
  TrainingFormData,
  trainingFormDefaultValues,
  trainingFormResolver,
} from '@/shared/formSchemas';
import { ITag, ITagListFilters, ITraining } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedTrainingStore } from '@/store';

export interface TrainingCreateFormProps {
  onSaved: () => void;
}

interface TrainingPayload extends Omit<TrainingFormData, 'description'> {
  description?: string;
}

export const TrainingCreateForm = ({ onSaved }: TrainingCreateFormProps) => {
  const selectedTraining = useSelectedTrainingStore(
    (state) => state.selectedTraining,
  );
  const isEditMode = !!selectedTraining;

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: trainingDetail,
    isLoading: isTrainingDetailLoading,
    isError: isTrainingDetailError,
    error: trainingDetailError,
  } = useGetEntityById<ITraining>({
    url: `/trainings/${selectedTraining?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TrainingFormData>({
    resolver: trainingFormResolver,
    defaultValues: trainingFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(trainingFormDefaultValues);
      return;
    }

    if (!trainingDetail) {
      return;
    }

    reset({
      name: trainingDetail.name,
      description: trainingDetail.description ?? '',
      tagIds: trainingDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, trainingDetail, reset]);

  useEffect(() => {
    if (!isTrainingDetailError) {
      return;
    }

    showToast({
      message:
        trainingDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do treinamento.',
      type: 'error',
    });
  }, [isTrainingDetailError, trainingDetailError]);

  const buildPayload = (data: TrainingFormData): TrainingPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createTrainingMutation = usePostEntity<ITraining, TrainingPayload>({
    url: '/trainings',
    invalidateQueryKeys: [['/trainings']],
    onSuccess: () => {
      showToast({
        message: 'Treinamento cadastrado com sucesso.',
        type: 'success',
      });
      reset(trainingFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o treinamento.',
        type: 'error',
      });
    },
  });

  const updateTrainingMutation = usePutEntity<ITraining, TrainingPayload>({
    url: `/trainings/${selectedTraining?.id}`,
    invalidateQueryKeys: [['/trainings']],
    onSuccess: () => {
      showToast({
        message: 'Treinamento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o treinamento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TrainingFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateTrainingMutation.mutate(payload);
      return;
    }

    createTrainingMutation.mutate(payload);
  };

  const isPending =
    createTrainingMutation.isPending || updateTrainingMutation.isPending;

  if (isEditMode && isTrainingDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do treinamento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="training-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<TrainingFormData, ITag>
          id="training-form-tags"
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
        id="training-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o treinamento"
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
