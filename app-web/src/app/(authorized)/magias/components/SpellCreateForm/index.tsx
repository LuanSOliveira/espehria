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
  SpellFormData,
  spellFormDefaultValues,
  spellFormResolver,
} from '@/shared/formSchemas';
import { ISpell, ITag, ITagListFilters } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedSpellStore } from '@/store';

export interface SpellCreateFormProps {
  onSaved: () => void;
}

interface SpellPayload
  extends Omit<SpellFormData, 'referenceImage' | 'description'> {
  referenceImage?: string;
  description?: string;
}

export const SpellCreateForm = ({ onSaved }: SpellCreateFormProps) => {
  const selectedSpell = useSelectedSpellStore((state) => state.selectedSpell);
  const isEditMode = !!selectedSpell;

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

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
    });
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

  const buildPayload = (data: SpellFormData): SpellPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
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
    const payload = buildPayload(data);

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
      </div>

      <FormRichTextInput
        id="spell-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a magia"
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
