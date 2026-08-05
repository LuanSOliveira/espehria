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
  EventFormData,
  eventFormDefaultValues,
  eventFormResolver,
} from '@/shared/formSchemas';
import { IEraOption, IEvent, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedEventStore } from '@/store';

export interface EventCreateFormProps {
  onSaved: () => void;
}

interface EventPayload
  extends Omit<
    EventFormData,
    'referenceImageUrl' | 'startYear' | 'endYear' | 'eraId'
  > {
  referenceImageUrl?: string;
  startYear?: number;
  endYear?: number;
  eraId?: string;
}

export const EventCreateForm = ({ onSaved }: EventCreateFormProps) => {
  const selectedEvent = useSelectedEventStore((state) => state.selectedEvent);
  const isEditMode = !!selectedEvent;

  const { tagOptions } = useTagOptionsQuery();

  const { data: eras } = useErasAllQuery();

  const {
    data: eventDetail,
    isLoading: isEventDetailLoading,
    isError: isEventDetailError,
    error: eventDetailError,
  } = useGetEntityById<IEvent>({
    url: `/events/${selectedEvent?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<EventFormData>({
    resolver: eventFormResolver,
    defaultValues: eventFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(eventFormDefaultValues);
      return;
    }

    if (!eventDetail) {
      return;
    }

    reset({
      name: eventDetail.name,
      referenceImageUrl: eventDetail.referenceImageUrl ?? '',
      startYear:
        eventDetail.startYear !== null && eventDetail.startYear !== undefined
          ? String(eventDetail.startYear)
          : '',
      endYear:
        eventDetail.endYear !== null && eventDetail.endYear !== undefined
          ? String(eventDetail.endYear)
          : '',
      description: eventDetail.description ?? '',
      privateInformation: eventDetail.privateInformation ?? '',
      tagIds: eventDetail.tags?.map((tag) => tag.id) ?? [],
      eraId: eventDetail.era?.id ?? '',
    });
  }, [isEditMode, eventDetail, reset]);

  useEffect(() => {
    if (!isEventDetailError) {
      return;
    }

    showToast({
      message:
        eventDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do evento.',
      type: 'error',
    });
  }, [isEventDetailError, eventDetailError]);

  const buildPayload = (data: EventFormData): EventPayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    startYear: data.startYear ? Number(data.startYear) : undefined,
    endYear: data.endYear ? Number(data.endYear) : undefined,
    eraId: data.eraId || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createEventMutation = usePostEntity<IEvent, EventPayload>({
    url: '/events',
    invalidateQueryKeys: [['/events']],
    onSuccess: () => {
      showToast({
        message: 'Evento cadastrado com sucesso.',
        type: 'success',
      });
      reset(eventFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o evento.',
        type: 'error',
      });
    },
  });

  const updateEventMutation = usePutEntity<IEvent, EventPayload>({
    url: `/events/${selectedEvent?.id}`,
    invalidateQueryKeys: [['/events']],
    onSuccess: () => {
      showToast({
        message: 'Evento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o evento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateEventMutation.mutate(payload);
      return;
    }

    createEventMutation.mutate(payload);
  };

  const isPending =
    createEventMutation.isPending || updateEventMutation.isPending;

  if (isEditMode && isEventDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do evento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="event-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<EventFormData, IEraOption>
          id="event-form-era"
          name="eraId"
          control={control}
          label="Era"
          options={eras ?? []}
          getOptionLabel={(era) => era.name}
          getOptionValue={(era) => era.id}
          placeholder="Selecione a era"
        />

        <FormTextInput
          id="event-form-start-year"
          name="startYear"
          control={control}
          label="Ano Início"
          placeholder="Digite o ano de início"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="event-form-end-year"
          name="endYear"
          control={control}
          label="Ano Fim"
          placeholder="Digite o ano de fim"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="event-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<EventFormData, ITag>
          id="event-form-tags"
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
          id="event-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o evento"
        />
      </div>

      <FormRichTextInput
        id="event-form-private-information"
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
