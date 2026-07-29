'use client';

import { useEffect, useState } from 'react';
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
  LocationFormData,
  locationFormDefaultValues,
  locationFormResolver,
} from '@/shared/formSchemas';
import {
  ILocation,
  ILocationSummary,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedLocationStore } from '@/store';
import { LocationPointsOfInterestField } from '../LocationPointsOfInterestField';
import { LocationSectionsField } from '../LocationSectionsField';

export interface LocationCreateFormProps {
  onSaved: () => void;
}

interface LocationSectionPayload {
  label: string;
  description?: string;
}

interface LocationPayload
  extends Omit<LocationFormData, 'referenceImageUrl' | 'sections'> {
  referenceImageUrl?: string;
  pointsOfInterestIds: string[];
  sections: LocationSectionPayload[];
}

export const LocationCreateForm = ({ onSaved }: LocationCreateFormProps) => {
  const selectedLocation = useSelectedLocationStore(
    (state) => state.selectedLocation,
  );
  const isEditMode = !!selectedLocation;

  const [pointsOfInterest, setPointsOfInterest] = useState<ILocationSummary[]>(
    [],
  );

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: locationDetail,
    isLoading: isLocationDetailLoading,
    isError: isLocationDetailError,
    error: locationDetailError,
  } = useGetEntityById<ILocation>({
    url: `/locations/${selectedLocation?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<LocationFormData>({
    resolver: locationFormResolver,
    defaultValues: locationFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(locationFormDefaultValues);
      return;
    }

    if (!locationDetail) {
      return;
    }

    reset({
      name: locationDetail.name,
      type: locationDetail.type ?? '',
      referenceImageUrl: locationDetail.referenceImageUrl ?? '',
      description: locationDetail.description ?? '',
      privateInformation: locationDetail.privateInformation ?? '',
      tagIds: locationDetail.tags?.map((tag) => tag.id) ?? [],
      sections:
        locationDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
    setPointsOfInterest(locationDetail.pointsOfInterest ?? []);
  }, [isEditMode, locationDetail, reset]);

  useEffect(() => {
    if (!isLocationDetailError) {
      return;
    }

    showToast({
      message:
        locationDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do local.',
      type: 'error',
    });
  }, [isLocationDetailError, locationDetailError]);

  const buildPayload = (
    data: LocationFormData,
    pointsOfInterest: ILocationSummary[],
  ): LocationPayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
    pointsOfInterestIds: pointsOfInterest.map((location) => location.id),
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
  });

  const createLocationMutation = usePostEntity<ILocation, LocationPayload>({
    url: '/locations',
    invalidateQueryKeys: [['/locations']],
    onSuccess: () => {
      showToast({
        message: 'Local cadastrado com sucesso.',
        type: 'success',
      });
      reset(locationFormDefaultValues);
      setPointsOfInterest([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o local.',
        type: 'error',
      });
    },
  });

  const updateLocationMutation = usePutEntity<ILocation, LocationPayload>({
    url: `/locations/${selectedLocation?.id}`,
    invalidateQueryKeys: [['/locations']],
    onSuccess: () => {
      showToast({
        message: 'Local atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o local.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: LocationFormData) => {
    const payload = buildPayload(data, pointsOfInterest);

    if (isEditMode) {
      updateLocationMutation.mutate(payload);
      return;
    }

    createLocationMutation.mutate(payload);
  };

  const isPending =
    createLocationMutation.isPending || updateLocationMutation.isPending;

  if (isEditMode && isLocationDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do local...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="location-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="location-form-type"
          name="type"
          control={control}
          label="Tipo"
          placeholder="Digite o tipo"
        />

        <FormTextInput
          id="location-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<LocationFormData, ITag>
          id="location-form-tags"
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
        id="location-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o local"
      />

      <LocationSectionsField control={control} />

      <LocationPointsOfInterestField
        value={pointsOfInterest}
        onChange={setPointsOfInterest}
        excludeLocationId={selectedLocation?.id}
      />

      <FormRichTextInput
        id="location-form-private-information"
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
