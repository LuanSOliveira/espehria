'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import {
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  FamilyGenealogyBoard,
  FamilyGenealogyMember,
  FamilyGenealogyRelationship,
} from '@/shared/components/FamilyGenealogyBoard';
import {
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  FamilyFormData,
  familyFormDefaultValues,
  familyFormResolver,
} from '@/shared/formSchemas';
import {
  ICharacterListFilters,
  ICharacterListItem,
  ICharacterSummary,
  IFamily,
  ITag,
  FamilyRelationshipType,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedFamilyStore } from '@/store';
import { FAMILY_CLASSIFICATION_OPTIONS } from '../../data';

export interface FamilyCreateFormProps {
  onSaved: () => void;
}

interface FamilyMemberDraft {
  character: ICharacterSummary;
  positionX: number;
  positionY: number;
}

interface FamilyRelationshipDraft {
  /** Identificador local usado apenas para seleção/remoção no quadro antes de salvar. */
  localId: string;
  id?: string;
  sourceCharacter: ICharacterSummary;
  targetCharacter: ICharacterSummary;
  type: FamilyRelationshipType;
}

interface FamilyMemberPayload {
  characterId: string;
  positionX: number;
  positionY: number;
}

interface FamilyRelationshipPayload {
  sourceCharacterId: string;
  targetCharacterId: string;
  type: FamilyRelationshipType;
}

interface FamilyPayload
  extends Omit<FamilyFormData, 'referenceImage' | 'description'> {
  referenceImage?: string;
  description?: string;
  members: FamilyMemberPayload[];
  relationships: FamilyRelationshipPayload[];
}

/** Posição em cascata para evitar sobreposição total de cards novos/soltos. */
const getCascadePosition = (index: number) => ({
  x: 80 + index * 40,
  y: 80 + index * 40,
});

export const FamilyCreateForm = ({ onSaved }: FamilyCreateFormProps) => {
  const selectedFamily = useSelectedFamilyStore((state) => state.selectedFamily);
  const isEditMode = !!selectedFamily;

  const [members, setMembers] = useState<FamilyMemberDraft[]>([]);
  const [relationships, setRelationships] = useState<FamilyRelationshipDraft[]>(
    [],
  );
  const [characterSearchText, setCharacterSearchText] = useState('');

  const { tagOptions } = useTagOptionsQuery();

  const { data: characterSearchData } = useGetEntityList<
    ICharacterListItem,
    ICharacterListFilters
  >({
    url: '/characters',
    filters: { name: characterSearchText || undefined, perPage: 10 },
  });
  const characterSearchOptions = characterSearchData?.data ?? [];

  const {
    data: familyDetail,
    isLoading: isFamilyDetailLoading,
    isError: isFamilyDetailError,
    error: familyDetailError,
  } = useGetEntityById<IFamily>({
    url: `/families/${selectedFamily?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<FamilyFormData>({
    resolver: familyFormResolver,
    defaultValues: familyFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(familyFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setMembers([]);
      setRelationships([]);
      return;
    }

    if (!familyDetail) {
      return;
    }

    reset({
      name: familyDetail.name,
      referenceImage: familyDetail.referenceImage ?? '',
      classification: familyDetail.classification,
      tagIds: familyDetail.tags?.map((tag) => tag.id) ?? [],
      description: familyDetail.description ?? '',
      privateInformation: familyDetail.privateInformation ?? '',
    });

    const positionedMembers: FamilyMemberDraft[] = (
      familyDetail.members ?? []
    ).map((member) => ({
      character: member.character,
      positionX: member.positionX,
      positionY: member.positionY,
    }));

    /**
     * Fluxo inverso do spec: personagens com family/secondaryFamily apontando
     * para esta família mas sem card posicionado ainda vêm em looseCharacters,
     * sem positionX/positionY — o front aplica a mesma posição em cascata
     * usada em "adicionar membro" para que o card apareça pronto para arrastar.
     */
    const looseMembers: FamilyMemberDraft[] = (
      familyDetail.looseCharacters ?? []
    ).map((character, index) => {
      const position = getCascadePosition(positionedMembers.length + index);
      return { character, positionX: position.x, positionY: position.y };
    });

    setMembers([...positionedMembers, ...looseMembers]);
    setRelationships(
      (familyDetail.relationships ?? []).map((relationship) => ({
        localId: relationship.id,
        id: relationship.id,
        sourceCharacter: relationship.sourceCharacter,
        targetCharacter: relationship.targetCharacter,
        type: relationship.type,
      })),
    );
  }, [isEditMode, familyDetail, reset]);

  useEffect(() => {
    if (!isFamilyDetailError) {
      return;
    }

    showToast({
      message:
        familyDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da família.',
      type: 'error',
    });
  }, [isFamilyDetailError, familyDetailError]);

  const handleAddMember = (character: ICharacterListItem) => {
    if (members.some((member) => member.character.id === character.id)) {
      return;
    }

    const position = getCascadePosition(members.length);
    setMembers([
      ...members,
      {
        character: {
          id: character.id,
          name: character.name,
          referenceImage: character.referenceImage,
        },
        positionX: position.x,
        positionY: position.y,
      },
    ]);
  };

  const handleRemoveMember = (characterId: string) => {
    setMembers(members.filter((member) => member.character.id !== characterId));
    setRelationships(
      relationships.filter(
        (relationship) =>
          relationship.sourceCharacter.id !== characterId &&
          relationship.targetCharacter.id !== characterId,
      ),
    );
  };

  const handlePositionChange = (
    characterId: string,
    position: { x: number; y: number },
  ) => {
    setMembers(
      members.map((member) =>
        member.character.id === characterId
          ? { ...member, positionX: position.x, positionY: position.y }
          : member,
      ),
    );
  };

  const handleCreateRelationship = (relationship: {
    sourceCharacterId: string;
    targetCharacterId: string;
    type: FamilyRelationshipType;
  }) => {
    const sourceCharacter = members.find(
      (member) => member.character.id === relationship.sourceCharacterId,
    )?.character;
    const targetCharacter = members.find(
      (member) => member.character.id === relationship.targetCharacterId,
    )?.character;

    if (!sourceCharacter || !targetCharacter) {
      return;
    }

    setRelationships([
      ...relationships,
      {
        localId: uuidv4(),
        sourceCharacter,
        targetCharacter,
        type: relationship.type,
      },
    ]);
  };

  const handleRemoveRelationship = (relationshipId: string) => {
    setRelationships(
      relationships.filter(
        (relationship) =>
          (relationship.id ?? relationship.localId) !== relationshipId,
      ),
    );
  };

  const boardMembers: FamilyGenealogyMember[] = members.map((member) => ({
    character: member.character,
    positionX: member.positionX,
    positionY: member.positionY,
  }));

  const boardRelationships: FamilyGenealogyRelationship[] = relationships.map(
    (relationship) => ({
      id: relationship.id ?? relationship.localId,
      sourceCharacterId: relationship.sourceCharacter.id,
      targetCharacterId: relationship.targetCharacter.id,
      type: relationship.type,
    }),
  );

  const buildPayload = (data: FamilyFormData): FamilyPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    tagIds: data.tagIds ?? [],
    description: data.description || undefined,
    members: members.map((member) => ({
      characterId: member.character.id,
      positionX: member.positionX,
      positionY: member.positionY,
    })),
    relationships: relationships.map((relationship) => ({
      sourceCharacterId: relationship.sourceCharacter.id,
      targetCharacterId: relationship.targetCharacter.id,
      type: relationship.type,
    })),
  });

  const createFamilyMutation = usePostEntity<IFamily, FamilyPayload>({
    url: '/families',
    invalidateQueryKeys: [['/families'], ['/characters']],
    onSuccess: () => {
      showToast({
        message: 'Família cadastrada com sucesso.',
        type: 'success',
      });
      reset(familyFormDefaultValues);
      setMembers([]);
      setRelationships([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a família.',
        type: 'error',
      });
    },
  });

  const updateFamilyMutation = usePutEntity<IFamily, FamilyPayload>({
    url: `/families/${selectedFamily?.id}`,
    invalidateQueryKeys: [['/families'], ['/characters']],
    onSuccess: () => {
      showToast({
        message: 'Família atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a família.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: FamilyFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateFamilyMutation.mutate(payload);
      return;
    }

    createFamilyMutation.mutate(payload);
  };

  const isPending =
    createFamilyMutation.isPending || updateFamilyMutation.isPending;

  if (isEditMode && isFamilyDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da família...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="family-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="family-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormAutocompleteInput<
          FamilyFormData,
          (typeof FAMILY_CLASSIFICATION_OPTIONS)[number]
        >
          id="family-form-classification"
          name="classification"
          control={control}
          label="Classificação"
          options={FAMILY_CLASSIFICATION_OPTIONS}
          getOptionValue={(option) => option.value}
          getOptionLabel={(option) => option.label}
          placeholder="Selecione a classificação"
        />

        <FormMultiAutocompleteInput<FamilyFormData, ITag>
          id="family-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={(tag) => tag.name}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />
      </div>

      <FormRichTextInput
        id="family-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a família"
      />

      <FamilyGenealogyBoard
        mode="editable"
        members={boardMembers}
        relationships={boardRelationships}
        characterSearchOptions={characterSearchOptions}
        characterSearchText={characterSearchText}
        onCharacterSearchTextChange={setCharacterSearchText}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onPositionChange={handlePositionChange}
        onCreateRelationship={handleCreateRelationship}
        onRemoveRelationship={handleRemoveRelationship}
      />

      <FormRichTextInput
        id="family-form-private-information"
        name="privateInformation"
        control={control}
        label="Informações Privadas"
        placeholder="Anotações internas não destinadas ao público"
      />

      <PrimaryButton
        type="submit"
        isLoading={isPending}
        sx={{ marginTop: '8px' }}
      >
        {isEditMode ? 'Salvar' : 'Cadastrar'}
      </PrimaryButton>
    </form>
  );
};
