'use client';

import { useState } from 'react';
import { DefaultAutocompleteInput, DefaultTextInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { SecondaryButton } from '@/shared/components/Buttons';
import { useGetEntityList } from '@/hooks/Queries';
import {
  ICharacterListFilters,
  ICharacterListItem,
  ICharacterSummary,
} from '@/shared/interfaces';
import { CharacterKinshipCard } from '../CharacterKinshipCard';

export interface CharacterKinshipDraft {
  relative: ICharacterSummary;
  kinship: string;
}

export interface CharacterKinshipFieldProps {
  value: CharacterKinshipDraft[];
  onChange: (value: CharacterKinshipDraft[]) => void;
  /**
   * Exclui o próprio personagem em edição das opções do autocomplete —
   * impede cadastrar um parentesco do personagem consigo mesmo.
   */
  excludeCharacterId?: string;
}

export const CharacterKinshipField = ({
  value,
  onChange,
  excludeCharacterId,
}: CharacterKinshipFieldProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCharacter, setSelectedCharacter] =
    useState<ICharacterListItem | null>(null);
  const [kinshipText, setKinshipText] = useState('');

  const { data } = useGetEntityList<ICharacterListItem, ICharacterListFilters>({
    url: '/characters',
    filters: { name: searchText || undefined, perPage: 10 },
  });

  const selectedIds = value.map((kinship) => kinship.relative.id);

  const options = (data?.data ?? []).filter(
    (character) =>
      character.id !== excludeCharacterId && !selectedIds.includes(character.id),
  );

  const handleAdd = () => {
    if (!selectedCharacter || !kinshipText.trim()) {
      return;
    }

    onChange([
      ...value,
      {
        relative: {
          id: selectedCharacter.id,
          name: selectedCharacter.name,
          referenceImage: selectedCharacter.referenceImage,
        },
        kinship: kinshipText.trim(),
      },
    ]);
    setSelectedCharacter(null);
    setKinshipText('');
    setSearchText('');
  };

  const handleEdit = (relativeId: string, newKinship: string) => {
    onChange(
      value.map((item) =>
        item.relative.id === relativeId ? { ...item, kinship: newKinship } : item,
      ),
    );
  };

  const handleRemove = (relativeId: string) => {
    onChange(value.filter((item) => item.relative.id !== relativeId));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        Parentescos
      </Label>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-50 flex-1">
          <DefaultAutocompleteInput<ICharacterListItem>
            id="character-kinship-search"
            options={options}
            getOptionLabel={(character) => character.name}
            value={selectedCharacter}
            onChange={setSelectedCharacter}
            inputValue={searchText}
            onInputChange={setSearchText}
            placeholder="Buscar personagem por nome"
          />
        </div>

        <div className="min-w-50 flex-1">
          <DefaultTextInput
            id="character-kinship-text"
            value={kinshipText}
            onChange={(event) => setKinshipText(event.target.value)}
            placeholder="Grau de parentesco"
          />
        </div>

        <SecondaryButton
          type="button"
          disabled={!selectedCharacter || !kinshipText.trim()}
          onClick={handleAdd}
        >
          Adicionar
        </SecondaryButton>
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((item) => (
            <CharacterKinshipCard
              key={item.relative.id}
              relative={item.relative}
              kinship={item.kinship}
              onEdit={(newKinship) => handleEdit(item.relative.id, newKinship)}
              onRemove={() => handleRemove(item.relative.id)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && (
        <DefaultText>Nenhum parentesco adicionado.</DefaultText>
      )}
    </div>
  );
};
