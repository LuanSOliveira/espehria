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
  TalentFormData,
  talentFormDefaultValues,
  talentFormResolver,
} from '@/shared/formSchemas';
import {
  IEntityReference,
  ITag,
  ITagListFilters,
  ITalent,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedTalentStore } from '@/store';

export interface TalentCreateFormProps {
  onSaved: () => void;
}

interface EntityReferenceInputPayload {
  entityType: string;
  id: string;
}

interface TalentPayload extends Omit<TalentFormData, 'description'> {
  description?: string;
  improvedFrom: EntityReferenceInputPayload[];
  requirements: EntityReferenceInputPayload[];
}

export const TalentCreateForm = ({ onSaved }: TalentCreateFormProps) => {
  const selectedTalent = useSelectedTalentStore((state) => state.selectedTalent);
  const isEditMode = !!selectedTalent;

  const [improvedFrom, setImprovedFrom] = useState<IEntityReference[]>([]);
  const [requirements, setRequirements] = useState<IEntityReference[]>([]);

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: talentDetail,
    isLoading: isTalentDetailLoading,
    isError: isTalentDetailError,
    error: talentDetailError,
  } = useGetEntityById<ITalent>({
    url: `/talents/${selectedTalent?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TalentFormData>({
    resolver: talentFormResolver,
    defaultValues: talentFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(talentFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovedFrom([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setRequirements([]);
      return;
    }

    if (!talentDetail) {
      return;
    }

    reset({
      name: talentDetail.name,
      description: talentDetail.description ?? '',
      tagIds: talentDetail.tags?.map((tag) => tag.id) ?? [],
    });
    setImprovedFrom(talentDetail.improvedFrom ?? []);
    setRequirements(talentDetail.requirements ?? []);
  }, [isEditMode, talentDetail, reset]);

  useEffect(() => {
    if (!isTalentDetailError) {
      return;
    }

    showToast({
      message:
        talentDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do talento.',
      type: 'error',
    });
  }, [isTalentDetailError, talentDetailError]);

  const buildPayload = (
    data: TalentFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
  ): TalentPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
    improvedFrom: improvedFrom.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
    requirements: requirements.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
  });

  const createTalentMutation = usePostEntity<ITalent, TalentPayload>({
    url: '/talents',
    invalidateQueryKeys: [['/talents']],
    onSuccess: () => {
      showToast({
        message: 'Talento cadastrado com sucesso.',
        type: 'success',
      });
      reset(talentFormDefaultValues);
      setImprovedFrom([]);
      setRequirements([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o talento.',
        type: 'error',
      });
    },
  });

  const updateTalentMutation = usePutEntity<ITalent, TalentPayload>({
    url: `/talents/${selectedTalent?.id}`,
    invalidateQueryKeys: [['/talents']],
    onSuccess: () => {
      showToast({
        message: 'Talento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o talento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TalentFormData) => {
    const payload = buildPayload(data, improvedFrom, requirements);

    if (isEditMode) {
      updateTalentMutation.mutate(payload);
      return;
    }

    createTalentMutation.mutate(payload);
  };

  const isPending =
    createTalentMutation.isPending || updateTalentMutation.isPending;

  if (isEditMode && isTalentDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do talento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="talent-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<TalentFormData, ITag>
          id="talent-form-tags"
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
        id="talent-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o talento"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValue={requirements}
          currentEntityType="talent"
          currentEntityId={selectedTalent?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValue={improvedFrom}
          currentEntityType="talent"
          currentEntityId={selectedTalent?.id}
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
