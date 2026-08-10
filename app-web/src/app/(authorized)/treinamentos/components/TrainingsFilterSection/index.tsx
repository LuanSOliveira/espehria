import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultMultiAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface TrainingsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  levelValue: string;
  onLevelChange: (value: string) => void;
  tagsValue: ITag[];
  onTagsChange: (value: ITag[]) => void;
  tagOptions: ITag[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export const TrainingsFilterSection = ({
  nameValue,
  onNameChange,
  levelValue,
  onLevelChange,
  tagsValue,
  onTagsChange,
  tagOptions,
  onSubmit,
  onClear,
}: TrainingsFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-220 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="trainings-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-40 flex-1">
        <DefaultTextInput
          id="trainings-level-filter"
          label="Level"
          placeholder="Buscar por level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
          value={levelValue}
          onChange={(event) => onLevelChange(event.target.value)}
        />
      </div>
      <div className="min-w-60 flex-1">
        <DefaultMultiAutocompleteInput<ITag>
          id="trainings-tags-filter"
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
