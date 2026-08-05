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
  useAttributesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  SkillFormData,
  skillFormDefaultValues,
  skillFormResolver,
} from '@/shared/formSchemas';
import { IAttribute, ISkill, ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedSkillStore } from '@/store';
import { SkillSectionsField } from '../SkillSectionsField';

export interface SkillCreateFormProps {
  onSaved: () => void;
}

interface SkillSectionPayload {
  label: string;
  description?: string;
}

interface SkillPayload extends Omit<SkillFormData, 'sections'> {
  sections: SkillSectionPayload[];
}

export const SkillCreateForm = ({ onSaved }: SkillCreateFormProps) => {
  const selectedSkill = useSelectedSkillStore((state) => state.selectedSkill);
  const isEditMode = !!selectedSkill;

  const { data: attributes } = useAttributesQuery();

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: skillDetail,
    isLoading: isSkillDetailLoading,
    isError: isSkillDetailError,
    error: skillDetailError,
  } = useGetEntityById<ISkill>({
    url: `/skills/${selectedSkill?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<SkillFormData>({
    resolver: skillFormResolver,
    defaultValues: skillFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(skillFormDefaultValues);
      return;
    }

    if (!skillDetail) {
      return;
    }

    reset({
      name: skillDetail.name,
      description: skillDetail.description ?? '',
      keyAttributeId: skillDetail.keyAttribute.id,
      tagIds: skillDetail.tags?.map((tag) => tag.id) ?? [],
      sections:
        skillDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
  }, [isEditMode, skillDetail, reset]);

  useEffect(() => {
    if (!isSkillDetailError) {
      return;
    }

    showToast({
      message:
        skillDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da perícia.',
      type: 'error',
    });
  }, [isSkillDetailError, skillDetailError]);

  const buildPayload = (data: SkillFormData): SkillPayload => ({
    ...data,
    tagIds: data.tagIds ?? [],
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
  });

  const createSkillMutation = usePostEntity<ISkill, SkillPayload>({
    url: '/skills',
    invalidateQueryKeys: [['/skills']],
    onSuccess: () => {
      showToast({
        message: 'Perícia cadastrada com sucesso.',
        type: 'success',
      });
      reset(skillFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a perícia.',
        type: 'error',
      });
    },
  });

  const updateSkillMutation = usePutEntity<ISkill, SkillPayload>({
    url: `/skills/${selectedSkill?.id}`,
    invalidateQueryKeys: [['/skills']],
    onSuccess: () => {
      showToast({
        message: 'Perícia atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a perícia.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: SkillFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateSkillMutation.mutate(payload);
      return;
    }

    createSkillMutation.mutate(payload);
  };

  const isPending =
    createSkillMutation.isPending || updateSkillMutation.isPending;

  if (isEditMode && isSkillDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da perícia...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="skill-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<SkillFormData, ITag>
          id="skill-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={(tag) => tag.name}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />

        <FormAutocompleteInput<SkillFormData, IAttribute>
          id="skill-form-key-attribute"
          name="keyAttributeId"
          control={control}
          label="Atributo Chave"
          options={attributes ?? []}
          getOptionLabel={(attribute) => attribute.name}
          getOptionValue={(attribute) => attribute.id}
          placeholder="Selecione o atributo chave"
        />
      </div>

      <FormRichTextInput
        id="skill-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a perícia"
      />

      <SkillSectionsField control={control} />

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
