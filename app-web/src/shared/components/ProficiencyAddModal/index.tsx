'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { FormModal } from '@/shared/components/Modals';
import { FormAutocompleteInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import {
  useProficiencyGradationsQuery,
  useProficiencyPropertiesQuery,
} from '@/hooks/Queries';
import {
  ProficiencyFormData,
  proficiencyFormDefaultValues,
  proficiencyFormResolver,
} from '@/shared/formSchemas';
import { IProficiencyGradation, IProficiencyItem, IProficiencyProperty } from '@/shared/interfaces';

export interface ProficiencyAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: IProficiencyItem) => void;
}

export const ProficiencyAddModal = ({
  open,
  onClose,
  onAdd,
}: ProficiencyAddModalProps) => {
  const { data: properties } = useProficiencyPropertiesQuery();
  const { data: gradations } = useProficiencyGradationsQuery();

  const { control, handleSubmit, reset } = useForm<ProficiencyFormData>({
    resolver: proficiencyFormResolver,
    defaultValues: proficiencyFormDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(proficiencyFormDefaultValues);
  }, [open, reset]);

  const sortedProperties = [...(properties ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const onSubmit = (data: ProficiencyFormData) => {
    const property = properties?.find((option) => option.id === data.propertyId);
    const gradation = gradations?.find(
      (option) => option.id === data.gradationId,
    );

    if (!property || !gradation) {
      return;
    }

    // Identificador local apenas para uso em keys/estado antes de o item ser
    // persistido — descartado ao montar o payload de criação/edição.
    onAdd({ id: uuidv4(), property, gradation });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Adicionar Proficiência"
      size="default"
    >
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          void handleSubmit(onSubmit)(event);
        }}
        className="flex flex-col gap-4"
      >
        <FormAutocompleteInput<ProficiencyFormData, IProficiencyProperty>
          id="proficiency-form-property"
          name="propertyId"
          control={control}
          label="Propriedade"
          options={sortedProperties}
          getOptionLabel={(property) => property.name}
          getOptionValue={(property) => property.id}
          placeholder="Selecione a propriedade"
        />

        <FormAutocompleteInput<ProficiencyFormData, IProficiencyGradation>
          id="proficiency-form-gradation"
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
