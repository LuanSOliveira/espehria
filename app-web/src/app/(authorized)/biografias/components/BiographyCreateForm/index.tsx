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
  BiographyFormData,
  biographyFormDefaultValues,
  biographyFormResolver,
} from '@/shared/formSchemas';
import {
  IBiography,
  IEntityReference,
  IImprovementDefectItem,
  IKnowledgeItem,
  IProficiencyItem,
  ITag,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedBiographyStore } from '@/store';

export interface BiographyCreateFormProps {
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
}

interface BiographyPayload
  extends Omit<BiographyFormData, 'description' | 'imageReference'> {
  description?: string;
  imageReference?: string;
  additionalAbilities: EntityReferenceInputPayload[];
  improvements: ImprovementDefectInputPayload[];
  proficiencies: ProficiencyInputPayload[];
  knowledges: KnowledgeInputPayload[];
}

export const BiographyCreateForm = ({ onSaved }: BiographyCreateFormProps) => {
  const selectedBiography = useSelectedBiographyStore(
    (state) => state.selectedBiography,
  );
  const isEditMode = !!selectedBiography;

  const [additionalAbilities, setAdditionalAbilities] = useState<
    IEntityReference[]
  >([]);
  const [improvements, setImprovements] = useState<IImprovementDefectItem[]>(
    [],
  );
  const [proficiencies, setProficiencies] = useState<IProficiencyItem[]>([]);
  const [knowledges, setKnowledges] = useState<IKnowledgeItem[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: biographyDetail,
    isLoading: isBiographyDetailLoading,
    isError: isBiographyDetailError,
    error: biographyDetailError,
  } = useGetEntityById<IBiography>({
    url: `/biographies/${selectedBiography?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<BiographyFormData>({
    resolver: biographyFormResolver,
    defaultValues: biographyFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(biographyFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setAdditionalAbilities([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovements([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setProficiencies([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setKnowledges([]);
      return;
    }

    if (!biographyDetail) {
      return;
    }

    reset({
      name: biographyDetail.name,
      description: biographyDetail.description ?? '',
      tagIds: biographyDetail.tags?.map((tag) => tag.id) ?? [],
      imageReference: biographyDetail.imageReference ?? '',
    });
    setAdditionalAbilities(biographyDetail.additionalAbilities ?? []);
    setImprovements(biographyDetail.improvements ?? []);
    setProficiencies(biographyDetail.proficiencies ?? []);
    setKnowledges(biographyDetail.knowledges ?? []);
  }, [isEditMode, biographyDetail, reset]);

  useEffect(() => {
    if (!isBiographyDetailError) {
      return;
    }

    showToast({
      message:
        biographyDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da biografia.',
      type: 'error',
    });
  }, [isBiographyDetailError, biographyDetailError]);

  const buildPayload = (
    data: BiographyFormData,
    additionalAbilities: IEntityReference[],
    improvements: IImprovementDefectItem[],
    proficiencies: IProficiencyItem[],
    knowledges: IKnowledgeItem[],
  ): BiographyPayload => ({
    ...data,
    description: data.description || undefined,
    tagIds: data.tagIds ?? [],
    imageReference: data.imageReference || undefined,
    additionalAbilities: additionalAbilities.map((reference) => ({
      entityType: reference.entityType,
      id: reference.id,
    })),
    improvements: improvements.map((item) => ({
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
    })),
  });

  const createBiographyMutation = usePostEntity<IBiography, BiographyPayload>({
    url: '/biographies',
    invalidateQueryKeys: [['/biographies']],
    onSuccess: () => {
      showToast({
        message: 'Biografia cadastrada com sucesso.',
        type: 'success',
      });
      reset(biographyFormDefaultValues);
      setAdditionalAbilities([]);
      setImprovements([]);
      setProficiencies([]);
      setKnowledges([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a biografia.',
        type: 'error',
      });
    },
  });

  const updateBiographyMutation = usePutEntity<IBiography, BiographyPayload>({
    url: `/biographies/${selectedBiography?.id}`,
    invalidateQueryKeys: [['/biographies']],
    onSuccess: () => {
      showToast({
        message: 'Biografia atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a biografia.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: BiographyFormData) => {
    const payload = buildPayload(
      data,
      additionalAbilities,
      improvements,
      proficiencies,
      knowledges,
    );

    if (isEditMode) {
      updateBiographyMutation.mutate(payload);
      return;
    }

    createBiographyMutation.mutate(payload);
  };

  const isPending =
    createBiographyMutation.isPending || updateBiographyMutation.isPending;

  if (isEditMode && isBiographyDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da biografia...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="biography-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormMultiAutocompleteInput<BiographyFormData, ITag>
          id="biography-form-tags"
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

      <FormTextInput
        id="biography-form-image-reference"
        name="imageReference"
        control={control}
        label="Imagem de Referência"
        placeholder="https://exemplo.com/imagem.jpg"
      />

      <FormRichTextInput
        id="biography-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a biografia"
      />

      <ImprovementDefectListField
        label="Melhorias"
        addButtonLabel="Adicionar Melhoria"
        category="improvement"
        value={improvements}
        onChange={setImprovements}
        otherListValue={[]}
      />

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
        otherListValues={[]}
        currentEntityType="biography"
        currentEntityId={selectedBiography?.id}
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
