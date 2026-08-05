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
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  SpellFormData,
  spellFormDefaultValues,
  spellFormResolver,
} from '@/shared/formSchemas';
import { IEntityReference, ISpell, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedSpellStore } from '@/store';

export interface SpellCreateFormProps {
  onSaved: () => void;
}

interface EntityReferenceInputPayload {
  entityType: string;
  id: string;
}

interface SpellPayload
  extends Omit<SpellFormData, 'referenceImage' | 'description' | 'level'> {
  referenceImage?: string;
  description?: string;
  level: number;
  improvedFrom: EntityReferenceInputPayload[];
  requirements: EntityReferenceInputPayload[];
}

export const SpellCreateForm = ({ onSaved }: SpellCreateFormProps) => {
  const selectedSpell = useSelectedSpellStore((state) => state.selectedSpell);
  const isEditMode = !!selectedSpell;

  const [improvedFrom, setImprovedFrom] = useState<IEntityReference[]>([]);
  const [requirements, setRequirements] = useState<IEntityReference[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: spellDetail,
    isLoading: isSpellDetailLoading,
    isError: isSpellDetailError,
    error: spellDetailError,
  } = useGetEntityById<ISpell>({
    url: `/spells/${selectedSpell?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<SpellFormData>({
    resolver: spellFormResolver,
    defaultValues: spellFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(spellFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovedFrom([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setRequirements([]);
      return;
    }

    if (!spellDetail) {
      return;
    }

    reset({
      name: spellDetail.name,
      referenceImage: spellDetail.referenceImage ?? '',
      description: spellDetail.description ?? '',
      tagIds: spellDetail.tags?.map((tag) => tag.id) ?? [],
      level: String(spellDetail.level),
    });
    setImprovedFrom(spellDetail.improvedFrom ?? []);
    setRequirements(spellDetail.requirements ?? []);
  }, [isEditMode, spellDetail, reset]);

  useEffect(() => {
    if (!isSpellDetailError) {
      return;
    }

    showToast({
      message:
        spellDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da magia.',
      type: 'error',
    });
  }, [isSpellDetailError, spellDetailError]);

  const buildPayload = (
    data: SpellFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
  ): SpellPayload => ({
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

  const createSpellMutation = usePostEntity<ISpell, SpellPayload>({
    url: '/spells',
    invalidateQueryKeys: [['/spells']],
    onSuccess: () => {
      showToast({
        message: 'Magia cadastrada com sucesso.',
        type: 'success',
      });
      reset(spellFormDefaultValues);
      setImprovedFrom([]);
      setRequirements([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a magia.',
        type: 'error',
      });
    },
  });

  const updateSpellMutation = usePutEntity<ISpell, SpellPayload>({
    url: `/spells/${selectedSpell?.id}`,
    invalidateQueryKeys: [['/spells']],
    onSuccess: () => {
      showToast({
        message: 'Magia atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a magia.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: SpellFormData) => {
    const payload = buildPayload(data, improvedFrom, requirements);

    if (isEditMode) {
      updateSpellMutation.mutate(payload);
      return;
    }

    createSpellMutation.mutate(payload);
  };

  const isPending =
    createSpellMutation.isPending || updateSpellMutation.isPending;

  if (isEditMode && isSpellDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da magia...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="spell-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="spell-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<SpellFormData, ITag>
          id="spell-form-tags"
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
          id="spell-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="spell-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a magia"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValues={[requirements]}
          currentEntityType="spell"
          currentEntityId={selectedSpell?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValues={[improvedFrom]}
          currentEntityType="spell"
          currentEntityId={selectedSpell?.id}
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
