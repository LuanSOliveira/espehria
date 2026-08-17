import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import {
  EQUIPMENT_APPLICABLE_TYPE_OPTIONS,
  EquipmentApplicableTypeOption,
} from '@/shared/constants';

export interface EnhancementsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  typeValue: EquipmentApplicableTypeOption | null;
  onTypeChange: (value: EquipmentApplicableTypeOption | null) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export const EnhancementsFilterSection = ({
  nameValue,
  onNameChange,
  typeValue,
  onTypeChange,
  onSubmit,
  onClear,
}: EnhancementsFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-190 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="enhancement-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<EquipmentApplicableTypeOption>
          id="enhancement-type-filter"
          label="Tipo"
          options={EQUIPMENT_APPLICABLE_TYPE_OPTIONS}
          getOptionLabel={(option) => option.label}
          value={typeValue}
          onChange={onTypeChange}
          placeholder="Todos os tipos"
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
      <SecondaryButton
        type="button"
        onClick={onClear}
        sx={{ width: 'auto', padding: '12px 24px' }}
      >
        Limpar filtros
      </SecondaryButton>
    </form>
  );
};
