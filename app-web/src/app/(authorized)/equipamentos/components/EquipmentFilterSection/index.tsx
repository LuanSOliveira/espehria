import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';

export interface EquipmentFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const EquipmentFilterSection = ({
  nameValue,
  onNameChange,
  onSubmit,
}: EquipmentFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="equipment-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
