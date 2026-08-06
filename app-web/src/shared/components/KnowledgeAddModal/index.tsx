'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { FormModal } from '@/shared/components/Modals';
import { FormAutocompleteInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useProficiencyGradationsQuery } from '@/hooks/Queries';
import {
  KnowledgeFormData,
  knowledgeFormDefaultValues,
  knowledgeFormResolver,
} from '@/shared/formSchemas';
import { IKnowledgeItem, IProficiencyGradation } from '@/shared/interfaces';

export interface KnowledgeAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: IKnowledgeItem) => void;
}

export const KnowledgeAddModal = ({
  open,
  onClose,
  onAdd,
}: KnowledgeAddModalProps) => {
  const { data: gradations } = useProficiencyGradationsQuery();

  const { control, handleSubmit, reset } = useForm<KnowledgeFormData>({
    resolver: knowledgeFormResolver,
    defaultValues: knowledgeFormDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(knowledgeFormDefaultValues);
  }, [open, reset]);

  const onSubmit = (data: KnowledgeFormData) => {
    const gradation = gradations?.find(
      (option) => option.id === data.gradationId,
    );

    if (!gradation) {
      return;
    }

    // Identificador local apenas para uso em keys/estado antes de o item ser
    // persistido — descartado ao montar o payload de criação/edição.
    onAdd({ id: uuidv4(), title: data.title.trim(), gradation });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Adicionar Saber"
      size="default"
    >
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          void handleSubmit(onSubmit)(event);
        }}
        className="flex flex-col gap-4"
      >
        <FormTextInput
          id="knowledge-form-title"
          name="title"
          control={control}
          label="Título"
          placeholder="Digite o título"
        />

        <FormAutocompleteInput<KnowledgeFormData, IProficiencyGradation>
          id="knowledge-form-gradation"
          name="gradationId"
          control={control}
          label="Graduação"
          options={gradations ?? []}
          getOptionLabel={(gradation) => gradation.name}
          getOptionValue={(gradation) => gradation.id}
          placeholder="Selecione a graduação"
        />

        <PrimaryButton type="submit" sx={{ marginTop: '8px' }}>
          Adicionar
        </PrimaryButton>
      </form>
    </FormModal>
  );
};
