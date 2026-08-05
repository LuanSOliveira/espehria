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
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  PlannedSessionFormData,
  plannedSessionFormDefaultValues,
  plannedSessionFormResolver,
} from '@/shared/formSchemas';
import { IPlannedSession, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedPlannedSessionStore } from '@/store';
import { PlannedSessionSectionsField } from '../PlannedSessionSectionsField';

export interface PlannedSessionCreateFormProps {
  campaignId: string;
  onSaved: () => void;
}

interface PlannedSessionSectionPayload {
  label: string;
  description?: string;
}

interface PlannedSessionPayload
  extends Omit<PlannedSessionFormData, 'sections'> {
  sections: PlannedSessionSectionPayload[];
}

export const PlannedSessionCreateForm = ({
  campaignId,
  onSaved,
}: PlannedSessionCreateFormProps) => {
  const selectedPlannedSession = useSelectedPlannedSessionStore(
    (state) => state.selectedPlannedSession,
  );
  const isEditMode = !!selectedPlannedSession;

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: plannedSessionDetail,
    isLoading: isPlannedSessionDetailLoading,
    isError: isPlannedSessionDetailError,
    error: plannedSessionDetailError,
  } = useGetEntityById<IPlannedSession>({
    url: `/campaigns/${campaignId}/planned-sessions/${selectedPlannedSession?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<PlannedSessionFormData>({
    resolver: plannedSessionFormResolver,
    defaultValues: plannedSessionFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(plannedSessionFormDefaultValues);
      return;
    }

    if (!plannedSessionDetail) {
      return;
    }

    reset({
      name: plannedSessionDetail.name,
      introduction: plannedSessionDetail.introduction ?? '',
      tagIds: plannedSessionDetail.tags?.map((tag) => tag.id) ?? [],
      sections:
        plannedSessionDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
  }, [isEditMode, plannedSessionDetail, reset]);

  useEffect(() => {
    if (!isPlannedSessionDetailError) {
      return;
    }

    showToast({
      message:
        plannedSessionDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da sessão planejada.',
      type: 'error',
    });
  }, [isPlannedSessionDetailError, plannedSessionDetailError]);

  const buildPayload = (
    data: PlannedSessionFormData,
  ): PlannedSessionPayload => ({
    ...data,
    tagIds: data.tagIds ?? [],
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
  });

  const createPlannedSessionMutation = usePostEntity<
    IPlannedSession,
    PlannedSessionPayload
  >({
    url: `/campaigns/${campaignId}/planned-sessions`,
    invalidateQueryKeys: [[`/campaigns/${campaignId}/planned-sessions`]],
    onSuccess: () => {
      showToast({
        message: 'Sessão planejada cadastrada com sucesso.',
        type: 'success',
      });
      reset(plannedSessionFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a sessão planejada.',
        type: 'error',
      });
    },
  });

  const updatePlannedSessionMutation = usePutEntity<
    IPlannedSession,
    PlannedSessionPayload
  >({
    url: `/campaigns/${campaignId}/planned-sessions/${selectedPlannedSession?.id}`,
    invalidateQueryKeys: [[`/campaigns/${campaignId}/planned-sessions`]],
    onSuccess: () => {
      showToast({
        message: 'Sessão planejada atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a sessão planejada.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: PlannedSessionFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updatePlannedSessionMutation.mutate(payload);
      return;
    }

    createPlannedSessionMutation.mutate(payload);
  };

  const isPending =
    createPlannedSessionMutation.isPending ||
    updatePlannedSessionMutation.isPending;

  if (isEditMode && isPlannedSessionDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da sessão planejada...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="planned-session-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<PlannedSessionFormData, ITag>
          id="planned-session-form-tags"
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
        id="planned-session-form-introduction"
        name="introduction"
        control={control}
        label="Introdução"
        placeholder="Descreva a introdução da sessão"
      />

      <PlannedSessionSectionsField control={control} />

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
