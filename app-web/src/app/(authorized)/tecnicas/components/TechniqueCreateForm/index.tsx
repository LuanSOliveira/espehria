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
  TechniqueFormData,
  techniqueFormDefaultValues,
  techniqueFormResolver,
} from '@/shared/formSchemas';
import {
  IEntityReference,
  ITag,
  ITagListFilters,
  ITechnique,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedTechniqueStore } from '@/store';

export interface TechniqueCreateFormProps {
  onSaved: () => void;
}

interface EntityReferenceInputPayload {
  entityType: string;
  id: string;
}

interface TechniquePayload
  extends Omit<TechniqueFormData, 'referenceImage' | 'description' | 'level'> {
  referenceImage?: string;
  description?: string;
  level: number;
  improvedFrom: EntityReferenceInputPayload[];
  requirements: EntityReferenceInputPayload[];
}

export const TechniqueCreateForm = ({ onSaved }: TechniqueCreateFormProps) => {
  const selectedTechnique = useSelectedTechniqueStore(
    (state) => state.selectedTechnique,
  );
  const isEditMode = !!selectedTechnique;

  const [improvedFrom, setImprovedFrom] = useState<IEntityReference[]>([]);
  const [requirements, setRequirements] = useState<IEntityReference[]>([]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovedFrom([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setRequirements([]);
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
      level: String(techniqueDetail.level),
    });
    setImprovedFrom(techniqueDetail.improvedFrom ?? []);
    setRequirements(techniqueDetail.requirements ?? []);
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

  const buildPayload = (
    data: TechniqueFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
  ): TechniquePayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
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

  const createTechniqueMutation = usePostEntity<ITechnique, TechniquePayload>({
    url: '/techniques',
    invalidateQueryKeys: [['/techniques']],
    onSuccess: () => {
      showToast({
        message: 'Técnica cadastrada com sucesso.',
        type: 'success',
      });
      reset(techniqueFormDefaultValues);
      setImprovedFrom([]);
      setRequirements([]);
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
    const payload = buildPayload(data, improvedFrom, requirements);

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

        <FormTextInput
          id="technique-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="technique-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a técnica"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValues={[requirements]}
          currentEntityType="technique"
          currentEntityId={selectedTechnique?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValues={[improvedFrom]}
          currentEntityType="technique"
          currentEntityId={selectedTechnique?.id}
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
