import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { IEraOption } from '@/shared/interfaces';

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
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
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
  onSubmit,
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
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
