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
import { OrganizationMemberCard } from '../OrganizationMemberCard';

export interface OrganizationMemberDraft {
  character: ICharacterSummary;
  role: string;
}

export interface OrganizationMemberFieldProps {
  value: OrganizationMemberDraft[];
  onChange: (value: OrganizationMemberDraft[]) => void;
}

export const OrganizationMemberField = ({
  value,
  onChange,
}: OrganizationMemberFieldProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCharacter, setSelectedCharacter] =
    useState<ICharacterListItem | null>(null);
  const [roleText, setRoleText] = useState('');

  const { data } = useGetEntityList<ICharacterListItem, ICharacterListFilters>({
    url: '/characters',
    filters: { name: searchText || undefined, perPage: 10 },
  });

  const selectedIds = value.map((member) => member.character.id);

  const options = (data?.data ?? []).filter(
    (character) => !selectedIds.includes(character.id),
  );

  const handleAdd = () => {
    if (!selectedCharacter || !roleText.trim()) {
      return;
    }

    onChange([
      ...value,
      {
        character: {
          id: selectedCharacter.id,
          name: selectedCharacter.name,
          referenceImage: selectedCharacter.referenceImage,
        },
        role: roleText.trim(),
      },
    ]);
    setSelectedCharacter(null);
    setRoleText('');
    setSearchText('');
  };

  const handleEdit = (characterId: string, newRole: string) => {
    onChange(
      value.map((item) =>
        item.character.id === characterId ? { ...item, role: newRole } : item,
      ),
    );
  };

  const handleRemove = (characterId: string) => {
    onChange(value.filter((item) => item.character.id !== characterId));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label component="span" sx={{ margin: 0 }}>
        Membros
      </Label>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-50 flex-1">
          <DefaultAutocompleteInput<ICharacterListItem>
            id="organization-member-search"
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
            id="organization-member-role"
            value={roleText}
            onChange={(event) => setRoleText(event.target.value)}
            placeholder="Função na organização"
          />
        </div>

        <SecondaryButton
          type="button"
          disabled={!selectedCharacter || !roleText.trim()}
          onClick={handleAdd}
        >
          Adicionar
        </SecondaryButton>
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((item) => (
            <OrganizationMemberCard
              key={item.character.id}
              character={item.character}
              role={item.role}
              onEdit={(newRole) => handleEdit(item.character.id, newRole)}
              onRemove={() => handleRemove(item.character.id)}
            />
          ))}
        </div>
      )}

      {value.length === 0 && <DefaultText>Nenhum membro adicionado.</DefaultText>}
    </div>
  );
};
