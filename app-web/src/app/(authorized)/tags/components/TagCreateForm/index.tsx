'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiTag } from 'react-icons/fi';
import { FormColorInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { usePostEntity, usePutEntity } from '@/hooks/Queries';
import {
  TagFormData,
  tagFormDefaultValues,
  tagFormResolver,
} from '@/shared/formSchemas';
import { ITag } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedTagStore } from '@/store';

export interface TagCreateFormProps {
  onSaved: () => void;
}

export const TagCreateForm = ({ onSaved }: TagCreateFormProps) => {
  const selectedTag = useSelectedTagStore((state) => state.selectedTag);
  const isEditMode = !!selectedTag;

  const { control, handleSubmit, reset } = useForm<TagFormData>({
    resolver: tagFormResolver,
    defaultValues: tagFormDefaultValues,
  });

  useEffect(() => {
    reset(
      selectedTag
        ? { name: selectedTag.name, color: selectedTag.color }
        : tagFormDefaultValues,
    );
  }, [selectedTag, reset]);

  const createTagMutation = usePostEntity<ITag, TagFormData>({
    url: '/tags',
    invalidateQueryKeys: [['/tags']],
    onSuccess: () => {
      showToast({
        message: 'Tag cadastrada com sucesso.',
        type: 'success',
      });
      reset(tagFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a tag.',
        type: 'error',
      });
    },
  });

  const updateTagMutation = usePutEntity<ITag, TagFormData>({
    url: `/tags/${selectedTag?.id}`,
    invalidateQueryKeys: [['/tags']],
    onSuccess: () => {
      showToast({
        message: 'Tag atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a tag.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TagFormData) => {
    if (isEditMode) {
      updateTagMutation.mutate(data);
      return;
    }

    createTagMutation.mutate(data);
  };

  const isPending =
    createTagMutation.isPending || updateTagMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormTextInput
        id="tag-form-name"
        name="name"
        control={control}
        label="Nome"
        placeholder="Digite o nome da tag"
        icon={<FiTag />}
      />

      <FormColorInput
        id="tag-form-color"
        name="color"
        control={control}
        label="Cor"
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
