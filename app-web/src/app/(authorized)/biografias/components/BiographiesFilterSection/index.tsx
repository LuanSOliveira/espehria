import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';

export interface BiographiesFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const BiographiesFilterSection = ({
  nameValue,
  onNameChange,
  onSubmit,
}: BiographiesFilterSectionProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-90 items-end gap-3">
      <div className="flex-1">
        <DefaultTextInput
          id="biographies-name-filter"
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
