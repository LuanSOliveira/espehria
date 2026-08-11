'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import { EntityReferenceListField } from '@/shared/components/EntityReferenceListField';
import { ImprovementDefectListField } from '@/shared/components/ImprovementDefectListField';
import { ProficiencyListField } from '@/shared/components/ProficiencyListField';
import { KnowledgeListField } from '@/shared/components/KnowledgeListField';
import {
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  CharacteristicFormData,
  characteristicFormDefaultValues,
  characteristicFormResolver,
} from '@/shared/formSchemas';
import {
  ICharacteristic,
  IEntityReference,
  IImprovementDefectItem,
  IKnowledgeItem,
  IProficiencyItem,
  ITag,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedCharacteristicStore } from '@/store';

export interface CharacteristicCreateFormProps {
  onSaved: () => void;
}

interface EntityReferenceInputPayload {
  entityType: string;
  id: string;
}

interface ImprovementDefectInputPayload {
  value: number;
  type: string;
  property: string;
}

interface ProficiencyInputPayload {
  property: string;
  gradation: string;
}

interface KnowledgeInputPayload {
  title: string;
  gradation: string;
  editable?: boolean;
}

interface CharacteristicPayload
  extends Omit<CharacteristicFormData, 'description' | 'level'> {
  description?: string;
  level: number;
  requirements: EntityReferenceInputPayload[];
  additionalAbilities: EntityReferenceInputPayload[];
  improvements: ImprovementDefectInputPayload[];
  flaws: ImprovementDefectInputPayload[];
  proficiencies: ProficiencyInputPayload[];
  knowledges: KnowledgeInputPayload[];
}

export const CharacteristicCreateForm = ({
  onSaved,
}: CharacteristicCreateFormProps) => {
  const selectedCharacteristic = useSelectedCharacteristicStore(
    (state) => state.selectedCharacteristic,
  );
  const isEditMode = !!selectedCharacteristic;

  const [requirements, setRequirements] = useState<IEntityReference[]>([]);
  const [additionalAbilities, setAdditionalAbilities] = useState<
    IEntityReference[]
  >([]);
  const [improvements, setImprovements] = useState<IImprovementDefectItem[]>(
    [],
  );
  const [flaws, setFlaws] = useState<IImprovementDefectItem[]>([]);
  const [proficiencies, setProficiencies] = useState<IProficiencyItem[]>([]);
  const [knowledges, setKnowledges] = useState<IKnowledgeItem[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: characteristicDetail,
    isLoading: isCharacteristicDetailLoading,
    isError: isCharacteristicDetailError,
    error: characteristicDetailError,
  } = useGetEntityById<ICharacteristic>({
    url: `/characteristics/${selectedCharacteristic?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<CharacteristicFormData>({
    resolver: characteristicFormResolver,
    defaultValues: characteristicFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(characteristicFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setRequirements([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setAdditionalAbilities([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovements([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setFlaws([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setProficiencies([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setKnowledges([]);
      return;
    }

    if (!characteristicDetail) {
      return;
    }

    reset({
      name: characteristicDetail.name,
      description: characteristicDetail.description ?? '',
      tagIds: characteristicDetail.tags?.map((tag) => tag.id) ?? [],
      level: String(characteristicDetail.level),
    });
    setRequirements(characteristicDetail.requirements ?? []);
    setAdditionalAbilities(characteristicDetail.additionalAbilities ?? []);
    setImprovements(characteristicDetail.improvements ?? []);
    setFlaws(characteristicDetail.flaws ?? []);
    setProficiencies(characteristicDetail.proficiencies ?? []);
    setKnowledges(characteristicDetail.knowledges ?? []);
  }, [isEditMode, characteristicDetail, reset]);

  useEffect(() => {
    if (!isCharacteristicDetailError) {
      return;
    }

    showToast({
      message:
        characteristicDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da característica.',
      type: 'error',
    });
  }, [isCharacteristicDetailError, characteristicDetailError]);

  const buildPayload = (
    data: CharacteristicFormData,
    requirements: IEntityReference[],
    additionalAbilities: IEntityReference[],
    improvements: IImprovementDefectItem[],
    flaws: IImprovementDefectItem[],
    proficiencies: IProficiencyItem[],
    knowledges: IKnowledgeItem[],
  ): CharacteristicPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
    level: Number(data.level),
    requirements: requirements.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
    additionalAbilities: additionalAbilities.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
    improvements: improvements.map((item) => ({
      value: item.value,
      type: item.type.id,
      property: item.property.id,
    })),
    flaws: flaws.map((item) => ({
      value: item.value,
      type: item.type.id,
      property: item.property.id,
    })),
    proficiencies: proficiencies.map((item) => ({
      property: item.property.id,
      gradation: item.gradation.id,
    })),
    knowledges: knowledges.map((item) => ({
      title: item.title,
      gradation: item.gradation.id,
      editable: item.editable,
    })),
  });

  const createCharacteristicMutation = usePostEntity<
    ICharacteristic,
    CharacteristicPayload
  >({
    url: '/characteristics',
    invalidateQueryKeys: [['/characteristics']],
    onSuccess: () => {
      showToast({
        message: 'Característica cadastrada com sucesso.',
        type: 'success',
      });
      reset(characteristicFormDefaultValues);
      setRequirements([]);
      setAdditionalAbilities([]);
      setImprovements([]);
      setFlaws([]);
      setProficiencies([]);
      setKnowledges([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a característica.',
        type: 'error',
      });
    },
  });

  const updateCharacteristicMutation = usePutEntity<
    ICharacteristic,
    CharacteristicPayload
  >({
    url: `/characteristics/${selectedCharacteristic?.id}`,
    invalidateQueryKeys: [['/characteristics']],
    onSuccess: () => {
      showToast({
        message: 'Característica atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a característica.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: CharacteristicFormData) => {
    const payload = buildPayload(
      data,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    );

    if (isEditMode) {
      updateCharacteristicMutation.mutate(payload);
      return;
    }

    createCharacteristicMutation.mutate(payload);
  };

  const isPending =
    createCharacteristicMutation.isPending ||
    updateCharacteristicMutation.isPending;

  if (isEditMode && isCharacteristicDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da característica...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="characteristic-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<CharacteristicFormData, ITag>
          id="characteristic-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />

        <FormTextInput
          id="characteristic-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="characteristic-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a característica"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ImprovementDefectListField
          label="Melhorias"
          addButtonLabel="Adicionar Melhoria"
          category="improvement"
          value={improvements}
          onChange={setImprovements}
          otherListValue={flaws}
        />

        <ImprovementDefectListField
          label="Defeitos"
          addButtonLabel="Adicionar Defeito"
          category="flaw"
          value={flaws}
          onChange={setFlaws}
          otherListValue={improvements}
        />
      </div>

      <ProficiencyListField
        label="Proficiências"
        addButtonLabel="Adicionar Proficiências"
        value={proficiencies}
        onChange={setProficiencies}
      />

      <KnowledgeListField
        label="Saber"
        addButtonLabel="Adicionar Saber"
        value={knowledges}
        onChange={setKnowledges}
      />

      <EntityReferenceListField
        label="Habilidades Adicionais"
        addButtonLabel="Adicionar Habilidades"
        value={additionalAbilities}
        onChange={setAdditionalAbilities}
        otherListValues={[requirements]}
        currentEntityType="characteristic"
        currentEntityId={selectedCharacteristic?.id}
      />

      <EntityReferenceListField
        label="Requisitos"
        addButtonLabel="Adicionar Requisitos"
        value={requirements}
        onChange={setRequirements}
        otherListValues={[additionalAbilities]}
        currentEntityType="characteristic"
        currentEntityId={selectedCharacteristic?.id}
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
