'use client';

import { useState } from 'react';
import { DefaultAutocompleteInput } from '@/shared/components/Inputs';
import { DefaultText } from '@/shared/components/Texts';
import { useGetEntityList } from '@/hooks/Queries';
import {
  ILocationListFilters,
  ILocationListItem,
  ILocationSummary,
} from '@/shared/interfaces';
import { LocationPointOfInterestCard } from '../LocationPointOfInterestCard';

export interface LocationPointsOfInterestFieldProps {
  value: ILocationSummary[];
  onChange: (value: ILocationSummary[]) => void;
  excludeLocationId?: string;
  label?: string;
}

export const LocationPointsOfInterestField = ({
  value,
  onChange,
  excludeLocationId,
  label = 'Pontos de Interesse',
}: LocationPointsOfInterestFieldProps) => {
  const [searchText, setSearchText] = useState('');

  const { data } = useGetEntityList<ILocationListItem, ILocationListFilters>({
    url: '/locations',
    filters: { name: searchText || undefined, perPage: 10 },
  });

  const selectedIds = value.map((location) => location.id);

  const options = (data?.data ?? []).filter(
    (location) =>
      location.id !== excludeLocationId && !selectedIds.includes(location.id),
  );

  const handleSelect = (option: ILocationListItem | null) => {
    if (!option) {
      return;
    }

    onChange([
      ...value,
      {
        id: option.id,
        name: option.name,
        referenceImageUrl: option.referenceImageUrl,
      },
    ]);
    setSearchText('');
  };

  return (
    <div className="flex flex-col gap-3">
      <DefaultAutocompleteInput<ILocationListItem>
        id="location-points-of-interest-search"
        label={label}
        options={options}
        getOptionLabel={(location) => location.name}
        value={null}
        onChange={handleSelect}
        inputValue={searchText}
        onInputChange={setSearchText}
        placeholder="Buscar local por nome"
      />

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((location) => (
            <LocationPointOfInterestCard
              key={location.id}
              location={location}
              onRemove={() =>
                onChange(value.filter((item) => item.id !== location.id))
              }
            />
          ))}
        </div>
      )}

      {value.length === 0 && (
        <DefaultText>Nenhum ponto de interesse adicionado.</DefaultText>
      )}
    </div>
  );
};
