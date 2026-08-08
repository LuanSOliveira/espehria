import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';

export interface WeaponsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const WeaponsFilterSection = ({
  nameValue,
  onNameChange,
  onSubmit,
}: WeaponsFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="weapon-name-filter"
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
