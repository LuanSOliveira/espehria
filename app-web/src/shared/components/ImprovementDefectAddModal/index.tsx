'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormModal } from '@/shared/components/Modals';
import { FormAutocompleteInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import {
  useImprovementDefectPropertiesQuery,
  useImprovementDefectTypesQuery,
} from '@/hooks/Queries';
import {
  ImprovementDefectFormData,
  improvementDefectFormDefaultValues,
  improvementDefectFormResolver,
} from '@/shared/formSchemas';
import {
  IImprovementDefectItem,
  IImprovementDefectProperty,
  IImprovementDefectType,
} from '@/shared/interfaces';

export interface ImprovementDefectAddModalProps {
  open: boolean;
  onClose: () => void;
  category: 'improvement' | 'flaw';
  onAdd: (item: IImprovementDefectItem) => void;
}

const ADD_MODAL_LABELS: Record<
  ImprovementDefectAddModalProps['category'],
  { title: string; addButtonLabel: string }
> = {
  improvement: { title: 'Adicionar Melhoria', addButtonLabel: 'Adicionar' },
  flaw: { title: 'Adicionar Defeito', addButtonLabel: 'Adicionar' },
};

export const ImprovementDefectAddModal = ({
  open,
  onClose,
  category,
  onAdd,
}: ImprovementDefectAddModalProps) => {
  const { data: types } = useImprovementDefectTypesQuery();
  const { data: properties } = useImprovementDefectPropertiesQuery();

  const { control, handleSubmit, reset, watch, setValue } =
    useForm<ImprovementDefectFormData>({
      resolver: improvementDefectFormResolver,
      defaultValues: improvementDefectFormDefaultValues,
    });

  const selectedTypeId = watch('typeId');

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(improvementDefectFormDefaultValues);
  }, [open, reset]);

  useEffect(() => {
    setValue('propertyId', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- limpa a propriedade apenas quando o tipo muda
  }, [selectedTypeId]);

  const propertyOptions = (properties ?? []).filter(
    (property) => !selectedTypeId || property.typeId === selectedTypeId,
  );

  const onSubmit = (data: ImprovementDefectFormData) => {
    const type = types?.find((option) => option.id === data.typeId);
    const property = properties?.find(
      (option) => option.id === data.propertyId,
    );

    if (!type || !property) {
      return;
    }

    onAdd({ value: Number(data.value), type, property });
  };

  const { title, addButtonLabel } = ADD_MODAL_LABELS[category];

  return (
    <FormModal open={open} onClose={onClose} title={title} size="default">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormTextInput
          id="improvement-defect-form-value"
          name="value"
          control={control}
          label="Valor"
          placeholder="Digite o valor"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ImprovementDefectFormData, IImprovementDefectType>
          id="improvement-defect-form-type"
          name="typeId"
          control={control}
          label="Tipo"
          options={types ?? []}
          getOptionLabel={(type) => type.name}
          getOptionValue={(type) => type.id}
          placeholder="Selecione o tipo"
        />

        <FormAutocompleteInput<ImprovementDefectFormData, IImprovementDefectProperty>
          id="improvement-defect-form-property"
          name="propertyId"
          control={control}
          label="Propriedade"
          options={propertyOptions}
          getOptionLabel={(property) => property.name}
          getOptionValue={(property) => property.id}
          placeholder="Selecione a propriedade"
        />

        <PrimaryButton type="submit" sx={{ marginTop: '8px' }}>
          {addButtonLabel}
        </PrimaryButton>
      </form>
    </FormModal>
  );
};
