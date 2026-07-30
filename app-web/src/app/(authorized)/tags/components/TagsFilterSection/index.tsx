import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';

export interface TagsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const TagsFilterSection = ({
  nameValue,
  onNameChange,
  typeValue,
  onTypeChange,
  onSubmit,
}: TagsFilterSectionProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-90 items-end gap-3">
      <div className="flex-1">
        <DefaultTextInput
          id="tags-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="flex-1">
        <DefaultTextInput
          id="tags-type-filter"
          label="Tipo"
          placeholder="Buscar por tipo"
          value={typeValue}
          onChange={(event) => onTypeChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
