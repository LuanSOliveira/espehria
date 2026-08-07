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
  TalentFormData,
  talentFormDefaultValues,
  talentFormResolver,
} from '@/shared/formSchemas';
import {
  IEntityReference,
  IImprovementDefectItem,
  IKnowledgeItem,
  IProficiencyItem,
  ITag,
  ITalent,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedTalentStore } from '@/store';

export interface TalentCreateFormProps {
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

interface TalentPayload extends Omit<TalentFormData, 'description' | 'level'> {
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

export const TalentCreateForm = ({ onSaved }: TalentCreateFormProps) => {
  const selectedTalent = useSelectedTalentStore((state) => state.selectedTalent);
  const isEditMode = !!selectedTalent;

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
    data: talentDetail,
    isLoading: isTalentDetailLoading,
    isError: isTalentDetailError,
    error: talentDetailError,
  } = useGetEntityById<ITalent>({
    url: `/talents/${selectedTalent?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<TalentFormData>({
    resolver: talentFormResolver,
    defaultValues: talentFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(talentFormDefaultValues);
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

    if (!talentDetail) {
      return;
    }

    reset({
      name: talentDetail.name,
      description: talentDetail.description ?? '',
      tagIds: talentDetail.tags?.map((tag) => tag.id) ?? [],
      level: String(talentDetail.level),
    });
    setImprovedFrom(talentDetail.improvedFrom ?? []);
    setRequirements(talentDetail.requirements ?? []);
    setAdditionalAbilities(talentDetail.additionalAbilities ?? []);
    setImprovements(talentDetail.improvements ?? []);
    setFlaws(talentDetail.flaws ?? []);
    setProficiencies(talentDetail.proficiencies ?? []);
    setKnowledges(talentDetail.knowledges ?? []);
  }, [isEditMode, talentDetail, reset]);

  useEffect(() => {
    if (!isTalentDetailError) {
      return;
    }

    showToast({
      message:
        talentDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do talento.',
      type: 'error',
    });
  }, [isTalentDetailError, talentDetailError]);

  const buildPayload = (
    data: TalentFormData,
    improvedFrom: IEntityReference[],
    requirements: IEntityReference[],
    additionalAbilities: IEntityReference[],
    improvements: IImprovementDefectItem[],
    flaws: IImprovementDefectItem[],
    proficiencies: IProficiencyItem[],
    knowledges: IKnowledgeItem[],
  ): TalentPayload => ({
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

  const createTalentMutation = usePostEntity<ITalent, TalentPayload>({
    url: '/talents',
    invalidateQueryKeys: [['/talents']],
    onSuccess: () => {
      showToast({
        message: 'Talento cadastrado com sucesso.',
        type: 'success',
      });
      reset(talentFormDefaultValues);
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
          'Não foi possível cadastrar o talento.',
        type: 'error',
      });
    },
  });

  const updateTalentMutation = usePutEntity<ITalent, TalentPayload>({
    url: `/talents/${selectedTalent?.id}`,
    invalidateQueryKeys: [['/talents']],
    onSuccess: () => {
      showToast({
        message: 'Talento atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o talento.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: TalentFormData) => {
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
      updateTalentMutation.mutate(payload);
      return;
    }

    createTalentMutation.mutate(payload);
  };

  const isPending =
    createTalentMutation.isPending || updateTalentMutation.isPending;

  if (isEditMode && isTalentDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do talento...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="talent-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<TalentFormData, ITag>
          id="talent-form-tags"
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
          id="talent-form-level"
          name="level"
          control={control}
          label="Level"
          placeholder="Digite o level"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <FormRichTextInput
        id="talent-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva o talento"
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
        currentEntityType="talent"
        currentEntityId={selectedTalent?.id}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityReferenceListField
          label="Aprimorado de"
          addButtonLabel="Adicionar Aprimorado de"
          value={improvedFrom}
          onChange={setImprovedFrom}
          otherListValues={[requirements, additionalAbilities]}
          currentEntityType="talent"
          currentEntityId={selectedTalent?.id}
        />

        <EntityReferenceListField
          label="Requisitos"
          addButtonLabel="Adicionar Requisitos"
          value={requirements}
          onChange={setRequirements}
          otherListValues={[improvedFrom, additionalAbilities]}
          currentEntityType="talent"
          currentEntityId={selectedTalent?.id}
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
