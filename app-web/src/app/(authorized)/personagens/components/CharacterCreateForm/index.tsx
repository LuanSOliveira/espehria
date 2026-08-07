'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormAutocompleteInput,
  FormCheckboxInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  CharacterFormData,
  characterFormDefaultValues,
  characterFormResolver,
} from '@/shared/formSchemas';
import {
  ICharacter,
  IFamilyListFilters,
  IFamilyListItem,
  IRaceListFilters,
  IRaceListItem,
  ITag,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedCharacterStore } from '@/store';

export interface CharacterCreateFormProps {
  onSaved: () => void;
}

interface CharacterPayload
  extends Omit<
    CharacterFormData,
    | 'referenceImage'
    | 'raceId'
    | 'familyId'
    | 'secondaryFamilyId'
    | 'description'
  > {
  referenceImage?: string;
  raceId?: string;
  familyId?: string;
  secondaryFamilyId?: string;
  description?: string;
}

export const CharacterCreateForm = ({ onSaved }: CharacterCreateFormProps) => {
  const selectedCharacter = useSelectedCharacterStore(
    (state) => state.selectedCharacter,
  );
  const isEditMode = !!selectedCharacter;

  const { tagOptions } = useTagOptionsQuery();

  const { data: racesData } = useGetEntityList<IRaceListItem, IRaceListFilters>({
    url: '/races',
    filters: { perPage: 100 },
  });
  const raceOptions = racesData?.data ?? [];

  const { data: familiesData } = useGetEntityList<
    IFamilyListItem,
    IFamilyListFilters
  >({
    url: '/families',
    filters: { perPage: 100 },
  });
  const familyOptions = familiesData?.data ?? [];

  const {
    data: characterDetail,
    isLoading: isCharacterDetailLoading,
    isError: isCharacterDetailError,
    error: characterDetailError,
  } = useGetEntityById<ICharacter>({
    url: `/characters/${selectedCharacter?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<CharacterFormData>({
    resolver: characterFormResolver,
    defaultValues: characterFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(characterFormDefaultValues);
      return;
    }

    if (!characterDetail) {
      return;
    }

    reset({
      name: characterDetail.name,
      referenceImage: characterDetail.referenceImage ?? '',
      tagIds: characterDetail.tags?.map((tag) => tag.id) ?? [],
      isDead: characterDetail.isDead,
      raceId: characterDetail.race?.id ?? '',
      familyId: characterDetail.family?.id ?? '',
      secondaryFamilyId: characterDetail.secondaryFamily?.id ?? '',
      description: characterDetail.description ?? '',
      privateInformation: characterDetail.privateInformation ?? '',
    });
  }, [isEditMode, characterDetail, reset]);

  useEffect(() => {
    if (!isCharacterDetailError) {
      return;
    }

    showToast({
      message:
        characterDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do personagem.',
      type: 'error',
    });
  }, [isCharacterDetailError, characterDetailError]);

  const buildPayload = (data: CharacterFormData): CharacterPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    tagIds: data.tagIds ?? [],
    raceId: data.raceId || undefined,
    familyId: data.familyId || undefined,
    secondaryFamilyId: data.secondaryFamilyId || undefined,
    description: data.description || undefined,
  });

  const createCharacterMutation = usePostEntity<ICharacter, CharacterPayload>({
    url: '/characters',
    invalidateQueryKeys: [['/characters']],
    onSuccess: () => {
      showToast({
        message: 'Personagem cadastrado com sucesso.',
        type: 'success',
      });
      reset(characterFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o personagem.',
        type: 'error',
      });
    },
  });

  const updateCharacterMutation = usePutEntity<ICharacter, CharacterPayload>({
    url: `/characters/${selectedCharacter?.id}`,
    invalidateQueryKeys: [['/characters']],
    onSuccess: () => {
      showToast({
        message: 'Personagem atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o personagem.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: CharacterFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateCharacterMutation.mutate(payload);
      return;
    }

    createCharacterMutation.mutate(payload);
  };

  const isPending =
    createCharacterMutation.isPending || updateCharacterMutation.isPending;

  if (isEditMode && isCharacterDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do personagem...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="character-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="character-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<CharacterFormData, ITag>
          id="character-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />

        <FormAutocompleteInput<CharacterFormData, IRaceListItem>
          id="character-form-race"
          name="raceId"
          control={control}
          label="Raça"
          options={raceOptions}
          getOptionLabel={(race) => race.name}
          getOptionValue={(race) => race.id}
          placeholder="Selecione a raça"
        />

        <FormCheckboxInput
          id="character-form-is-dead"
          name="isDead"
          control={control}
          label="Morto?"
        />

        <FormAutocompleteInput<CharacterFormData, IFamilyListItem>
          id="character-form-family"
          name="familyId"
          control={control}
          label="Família"
          options={familyOptions}
          getOptionLabel={(family) => family.name}
          getOptionValue={(family) => family.id}
          placeholder="Selecione a família"
        />

        <FormAutocompleteInput<CharacterFormData, IFamilyListItem>
          id="character-form-secondary-family"
          name="secondaryFamilyId"
          control={control}
          label="Família Secundária"
          options={familyOptions}
          getOptionLabel={(family) => family.name}
          getOptionValue={(family) => family.id}
          placeholder="Selecione a família secundária"
        />
      </div>

      <FormRichTextInput
        id="character-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o personagem"
      />

      <FormRichTextInput
        id="character-form-private-information"
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
