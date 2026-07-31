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
import { EntityReferenceListField } from '@/shared/components/EntityReferenceListField';
import {
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  CharacteristicFormData,
  characteristicFormDefaultValues,
  characteristicFormResolver,
} from '@/shared/formSchemas';
import {
  ICharacteristic,
  IEntityReference,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedCharacteristicStore } from '@/store';

export interface CharacteristicCreateFormProps {
  onSaved: () => void;
}

interface EntityReferenceInputPayload {
  entityType: string;
  id: string;
}

interface CharacteristicPayload
  extends Omit<CharacteristicFormData, 'description' | 'level'> {
  description?: string;
  level: number;
  improvedFrom: EntityReferenceInputPayload[];
  requirements: EntityReferenceInputPayload[];
}

export const CharacteristicCreateForm = ({
  onSaved,
}: CharacteristicCreateFormProps) => {
  const selectedCharacteristic = useSelectedCharacteristicStore(
    (state) => state.selectedCharacteristic,
  );
  const isEditMode = !!selectedCharacteristic;

  const [improvedFrom, setImprovedFrom] = useState<IEntityReference[]>([]);
  const [requirements, setRequirements] = useState<IEntityReference[]>([]);

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: characteristicDetail,
    isLoading: isCharacteristicDetailLoading,
    isError: isCharacteristicDetailError,
    error: characteristicDetailError,
  } = useGetEntityById<ICharacteristic>({
    url: `/characteristics/${selectedCharacteristic?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<CharacteristicFormData>({
    resolver: characteristicFormResolver,
    defaultValues: characteristicFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(characteristicFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovedFrom([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setRequirements([]);
      return;
    }

    if (!characteristicDetail) {
      return;
    }

    reset({
      name: characteristicDetail.name,
      description: characteristicDetail.description ?? '',
      tagIds: characteristicDetail.tags?.map((tag) => tag.id) ?? [],
      level: String(characteristicDetail.level),
    });
    setImprovedFrom(characteristicDetail.improvedFrom ?? []);
    setRequirements(characteristicDetail.requirements ?? []);
  }, [isEditMode, characteristicDetail, reset]);

  useEffect(() => {
    if (!isCharacteristicDetailError) {
      return;
    }

    showToast({
      message:
        characteristicDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da característica.',
      type: 'error',
    });
  }, [isCharacteristicDetailError, characteristicDetailError]);

  const buildPayload = (
    data: CharacteristicFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
  ): CharacteristicPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
    level: Number(data.level),
    improvedFrom: improvedFrom.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
    requirements: requirements.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
  });

  const createCharacteristicMutation = usePostEntity<
    ICharacteristic,
    CharacteristicPayload
  >({
    url: '/characteristics',
    invalidateQueryKeys: [['/characteristics']],
    onSuccess: () => {
      showToast({
        message: 'Característica cadastrada com sucesso.',
        type: 'success',
      });
      reset(characteristicFormDefaultValues);
      setImprovedFrom([]);
      setRequirements([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a característica.',
        type: 'error',
      });
    },
  });

  const updateCharacteristicMutation = usePutEntity<
    ICharacteristic,
    CharacteristicPayload
  >({
    url: `/characteristics/${selectedCharacteristic?.id}`,
    invalidateQueryKeys: [['/characteristics']],
    onSuccess: () => {
      showToast({
        message: 'Característica atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a característica.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: CharacteristicFormData) => {
    const payload = buildPayload(data, improvedFrom, requirements);

    if (isEditMode) {
      updateCharacteristicMutation.mutate(payload);
      return;
    }

    createCharacteristicMutation.mutate(payload);
  };

  const isPending =
    createCharacteristicMutation.isPending ||
    updateCharacteristicMutation.isPending;

  if (isEditMode && isCharacteristicDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da característica...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="characteristic-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<CharacteristicFormData, ITag>
          id="characteristic-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={(tag) => tag.name}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />

        <FormTextInput
          id="characteristic-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="characteristic-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a característica"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValue={requirements}
          currentEntityType="characteristic"
          currentEntityId={selectedCharacteristic?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValue={improvedFrom}
          currentEntityType="characteristic"
          currentEntityId={selectedCharacteristic?.id}
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
