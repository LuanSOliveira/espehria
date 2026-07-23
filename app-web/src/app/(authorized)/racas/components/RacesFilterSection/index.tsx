import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { IRaceCategory } from '@/shared/interfaces';

export interface RacesFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  categoryValue: IRaceCategory | null;
  onCategoryChange: (value: IRaceCategory | null) => void;
  categories: IRaceCategory[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const RacesFilterSection = ({
  nameValue,
  onNameChange,
  categoryValue,
  onCategoryChange,
  categories,
  onSubmit,
}: RacesFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="races-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<IRaceCategory>
          id="races-category-filter"
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
