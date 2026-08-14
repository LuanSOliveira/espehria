import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultMultiAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { IEraOption, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface EventsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  startYearValue: string;
  onStartYearChange: (value: string) => void;
  endYearValue: string;
  onEndYearChange: (value: string) => void;
  eraValue: IEraOption | null;
  onEraChange: (value: IEraOption | null) => void;
  eras: IEraOption[];
  tagsValue: ITag[];
  onTagsChange: (value: ITag[]) => void;
  tagOptions: ITag[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export const EventsFilterSection = ({
  nameValue,
  onNameChange,
  startYearValue,
  onStartYearChange,
  endYearValue,
  onEndYearChange,
  eraValue,
  onEraChange,
  eras,
  tagsValue,
  onTagsChange,
  tagOptions,
  onSubmit,
  onClear,
}: EventsFilterSectionProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-end gap-3">
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="events-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-40 flex-1">
        <DefaultTextInput
          id="events-start-year-filter"
          label="Ano Início"
          placeholder="Ano início"
          value={startYearValue}
          onChange={(event) => onStartYearChange(event.target.value)}
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />
      </div>
      <div className="min-w-40 flex-1">
        <DefaultTextInput
          id="events-end-year-filter"
          label="Ano Fim"
          placeholder="Ano fim"
          value={endYearValue}
          onChange={(event) => onEndYearChange(event.target.value)}
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<IEraOption>
          id="events-era-filter"
          label="Era"
          options={eras}
          getOptionLabel={(era) => era.name}
          value={eraValue}
          onChange={onEraChange}
          placeholder="Todas as eras"
        />
      </div>
      <div className="min-w-60 flex-1">
        <DefaultMultiAutocompleteInput<ITag>
          id="events-tags-filter"
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
