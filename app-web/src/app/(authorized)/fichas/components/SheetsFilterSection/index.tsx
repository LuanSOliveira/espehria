import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { ISheetCampaignOption } from '@/shared/interfaces';

export interface SheetsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  campaignValue: ISheetCampaignOption | null;
  onCampaignChange: (value: ISheetCampaignOption | null) => void;
  campaignOptions: ISheetCampaignOption[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const SheetsFilterSection = ({
  nameValue,
  onNameChange,
  campaignValue,
  onCampaignChange,
  campaignOptions,
  onSubmit,
}: SheetsFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="sheets-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<ISheetCampaignOption>
          id="sheets-campaign-filter"
          label="Campanha"
          options={campaignOptions}
          getOptionLabel={(campaign) => campaign.name}
          value={campaignValue}
          onChange={onCampaignChange}
          placeholder="Todas as campanhas"
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
