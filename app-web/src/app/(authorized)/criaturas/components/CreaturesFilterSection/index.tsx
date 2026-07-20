import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { ICreatureCategory } from '@/shared/interfaces';

export interface CreaturesFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  categoryValue: ICreatureCategory | null;
  onCategoryChange: (value: ICreatureCategory | null) => void;
  categories: ICreatureCategory[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const CreaturesFilterSection = ({
  nameValue,
  onNameChange,
  categoryValue,
  onCategoryChange,
  categories,
  onSubmit,
}: CreaturesFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="creatures-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<ICreatureCategory>
          id="creatures-category-filter"
          label="Categoria"
          options={categories}
          getOptionLabel={(category) => category.name}
          value={categoryValue}
          onChange={onCategoryChange}
          placeholder="Todas as categorias"
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
