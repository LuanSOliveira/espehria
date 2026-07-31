import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import {
  DefaultAutocompleteInput,
  DefaultTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { IAttribute } from '@/shared/interfaces';

export interface SkillsFilterSectionProps {
  nameValue: string;
  onNameChange: (value: string) => void;
  attributeValue: IAttribute | null;
  onAttributeChange: (value: IAttribute | null) => void;
  attributes: IAttribute[];
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const SkillsFilterSection = ({
  nameValue,
  onNameChange,
  attributeValue,
  onAttributeChange,
  attributes,
  onSubmit,
}: SkillsFilterSectionProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex max-w-160 flex-wrap items-end gap-3"
    >
      <div className="min-w-50 flex-1">
        <DefaultTextInput
          id="skills-name-filter"
          label="Nome"
          placeholder="Buscar por nome"
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <div className="min-w-50 flex-1">
        <DefaultAutocompleteInput<IAttribute>
          id="skills-attribute-filter"
          label="Atributo Chave"
          options={attributes}
          getOptionLabel={(attribute) => attribute.name}
          value={attributeValue}
          onChange={onAttributeChange}
          placeholder="Todos os atributos"
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
