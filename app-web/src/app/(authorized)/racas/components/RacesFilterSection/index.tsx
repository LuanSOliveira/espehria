import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultMultiAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { IRaceCategory, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface RacesFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  categoryValue: IRaceCategory | null;
  onCategoryChange: (value: IRaceCategory | null) => void;
  categories: IRaceCategory[];
  tagsValue: ITag[];
  onTagsChange: (value: ITag[]) => void;
  tagOptions: ITag[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export const RacesFilterSection = ({
  nameValue,
  onNameChange,
  categoryValue,
  onCategoryChange,
  categories,
  tagsValue,
  onTagsChange,
  tagOptions,
  onSubmit,
  onClear,
}: RacesFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-220 flex-wrap items-end gap-3"
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
      <div className="min-w-60 flex-1">
        <DefaultMultiAutocompleteInput<ITag>
          id="races-tags-filter"
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          value={tagsValue}
          onChange={onTagsChange}
          placeholder="Selecione as tags"
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
