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
  TrainingFormData,
  trainingFormDefaultValues,
  trainingFormResolver,
} from '@/shared/formSchemas';
import {
  IEntityReference,
  IImprovementDefectItem,
  IKnowledgeItem,
  IProficiencyItem,
  ITag,
  ITraining,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedTrainingStore } from '@/store';

export interface TrainingCreateFormProps {
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

interface TrainingPayload
  extends Omit<TrainingFormData, 'description' | 'level'> {
  description?: string;
  level: number;
  improvedFrom: EntityReferenceInputPayload[];
  requirements: EntityReferenceInputPayload[];
  additionalAbilities: EntityReferenceInputPayload[];
  improvements: ImprovementDefectInputPayload[];
  flaws: ImprovementDefectInputPayload[];
  proficiencies: ProficiencyInputPayload[];
  knowledges: KnowledgeInputPayload[];
}

export const TrainingCreateForm = ({ onSaved }: TrainingCreateFormProps) => {
  const selectedTraining = useSelectedTrainingStore(
    (state) => state.selectedTraining,
  );
  const isEditMode = !!selectedTraining;

  const [improvedFrom, setImprovedFrom] = useState<IEntityReference[]>([]);
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
    data: trainingDetail,
    isLoading: isTrainingDetailLoading,
    isError: isTrainingDetailError,
    error: trainingDetailError,
  } = useGetEntityById<ITraining>({
    url: `/trainings/${selectedTraining?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TrainingFormData>({
    resolver: trainingFormResolver,
    defaultValues: trainingFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(trainingFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovedFrom([]);
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

    if (!trainingDetail) {
      return;
    }

    reset({
      name: trainingDetail.name,
      description: trainingDetail.description ?? '',
      tagIds: trainingDetail.tags?.map((tag) => tag.id) ?? [],
      level: String(trainingDetail.level),
    });
    setImprovedFrom(trainingDetail.improvedFrom ?? []);
    setRequirements(trainingDetail.requirements ?? []);
    setAdditionalAbilities(trainingDetail.additionalAbilities ?? []);
    setImprovements(trainingDetail.improvements ?? []);
    setFlaws(trainingDetail.flaws ?? []);
    setProficiencies(trainingDetail.proficiencies ?? []);
    setKnowledges(trainingDetail.knowledges ?? []);
  }, [isEditMode, trainingDetail, reset]);

  useEffect(() => {
    if (!isTrainingDetailError) {
      return;
    }

    showToast({
      message:
        trainingDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do treinamento.',
      type: 'error',
    });
  }, [isTrainingDetailError, trainingDetailError]);

  const buildPayload = (
    data: TrainingFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
    additionalAbilities: IEntityReference[],
    improvements: IImprovementDefectItem[],
    flaws: IImprovementDefectItem[],
    proficiencies: IProficiencyItem[],
    knowledges: IKnowledgeItem[],
  ): TrainingPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
    level: Number(data.level),
    improvedFrom: improvedFrom.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
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

  const createTrainingMutation = usePostEntity<ITraining, TrainingPayload>({
    url: '/trainings',
    invalidateQueryKeys: [['/trainings']],
    onSuccess: () => {
      showToast({
        message: 'Treinamento cadastrado com sucesso.',
        type: 'success',
      });
      reset(trainingFormDefaultValues);
      setImprovedFrom([]);
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
          'Não foi possível cadastrar o treinamento.',
        type: 'error',
      });
    },
  });

  const updateTrainingMutation = usePutEntity<ITraining, TrainingPayload>({
    url: `/trainings/${selectedTraining?.id}`,
    invalidateQueryKeys: [['/trainings']],
    onSuccess: () => {
      showToast({
        message: 'Treinamento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o treinamento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TrainingFormData) => {
    const payload = buildPayload(
      data,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    );

    if (isEditMode) {
      updateTrainingMutation.mutate(payload);
      return;
    }

    createTrainingMutation.mutate(payload);
  };

  const isPending =
    createTrainingMutation.isPending || updateTrainingMutation.isPending;

  if (isEditMode && isTrainingDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do treinamento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="training-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<TrainingFormData, ITag>
          id="training-form-tags"
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
          id="training-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="training-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o treinamento"
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
        otherListValues={[improvedFrom, requirements]}
        currentEntityType="training"
        currentEntityId={selectedTraining?.id}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValues={[requirements, additionalAbilities]}
          currentEntityType="training"
          currentEntityId={selectedTraining?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValues={[improvedFrom, additionalAbilities]}
          currentEntityType="training"
          currentEntityId={selectedTraining?.id}
        />
      </div>

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
