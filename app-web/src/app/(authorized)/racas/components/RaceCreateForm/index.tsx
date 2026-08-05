'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import { EntityReferenceListField } from '@/shared/components/EntityReferenceListField';
import { ImprovementDefectListField } from '@/shared/components/ImprovementDefectListField';
import { RaceTalentsListField } from '../RaceTalentsListField';
import {
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useRaceCategoriesQuery,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  RaceFormData,
  raceFormDefaultValues,
  raceFormResolver,
} from '@/shared/formSchemas';
import {
  IEntityReference,
  IImprovementDefectItem,
  IRace,
  IRaceCategory,
  ITag,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedRaceStore } from '@/store';

export interface RaceCreateFormProps {
  onSaved: () => void;
}

interface ImprovementDefectInputPayload {
  value: number;
  type: string;
  property: string;
}

interface RacePayload
  extends Omit<
    RaceFormData,
    'referenceImageUrl' | 'characteristicIds' | 'talentIds'
  > {
  referenceImageUrl?: string;
  characteristicIds: string[];
  talentIds: string[];
  improvements: ImprovementDefectInputPayload[];
  flaws: ImprovementDefectInputPayload[];
}

const toEntityReferences = (
  items: { id: string; name: string; level?: number | null; tags: ITag[] }[],
  entityType: string,
): IEntityReference[] => items.map((item) => ({ ...item, entityType }));

export const RaceCreateForm = ({ onSaved }: RaceCreateFormProps) => {
  const selectedRace = useSelectedRaceStore((state) => state.selectedRace);
  const isEditMode = !!selectedRace;

  const [characteristics, setCharacteristics] = useState<IEntityReference[]>(
    [],
  );
  const [talents, setTalents] = useState<IEntityReference[]>([]);
  const [improvements, setImprovements] = useState<IImprovementDefectItem[]>(
    [],
  );
  const [flaws, setFlaws] = useState<IImprovementDefectItem[]>([]);

  const { data: categories } = useRaceCategoriesQuery();

  const { tagOptions } = useTagOptionsQuery();

  const {
    data: raceDetail,
    isLoading: isRaceDetailLoading,
    isError: isRaceDetailError,
    error: raceDetailError,
  } = useGetEntityById<IRace>({
    url: `/races/${selectedRace?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<RaceFormData>({
    resolver: raceFormResolver,
    defaultValues: raceFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(raceFormDefaultValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setCharacteristics([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setTalents([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setImprovements([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza rascunho local ao sair do modo edição
      setFlaws([]);
      return;
    }

    if (!raceDetail) {
      return;
    }

    reset({
      name: raceDetail.name,
      categoryId: raceDetail.category.id,
      referenceImageUrl: raceDetail.referenceImageUrl ?? '',
      description: raceDetail.description ?? '',
      privateInformation: raceDetail.privateInformation ?? '',
      tagIds: raceDetail.tags?.map((tag) => tag.id) ?? [],
    });
    setCharacteristics(
      toEntityReferences(raceDetail.characteristics ?? [], 'characteristic'),
    );
    setTalents(toEntityReferences(raceDetail.talents ?? [], 'talent'));
    setImprovements(raceDetail.improvements ?? []);
    setFlaws(raceDetail.flaws ?? []);
  }, [isEditMode, raceDetail, reset]);

  useEffect(() => {
    if (!isRaceDetailError) {
      return;
    }

    showToast({
      message:
        raceDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da raça.',
      type: 'error',
    });
  }, [isRaceDetailError, raceDetailError]);

  const buildPayload = (
    data: RaceFormData,
    characteristics: IEntityReference[],
    talents: IEntityReference[],
    improvements: IImprovementDefectItem[],
    flaws: IImprovementDefectItem[],
  ): RacePayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
    characteristicIds: characteristics.map((item) => item.id),
    talentIds: talents.map((item) => item.id),
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
  });

  const createRaceMutation = usePostEntity<IRace, RacePayload>({
    url: '/races',
    invalidateQueryKeys: [['/races']],
    onSuccess: () => {
      showToast({
        message: 'Raça cadastrada com sucesso.',
        type: 'success',
      });
      reset(raceFormDefaultValues);
      setCharacteristics([]);
      setTalents([]);
      setImprovements([]);
      setFlaws([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a raça.',
        type: 'error',
      });
    },
  });

  const updateRaceMutation = usePutEntity<IRace, RacePayload>({
    url: `/races/${selectedRace?.id}`,
    invalidateQueryKeys: [['/races']],
    onSuccess: () => {
      showToast({
        message: 'Raça atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a raça.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: RaceFormData) => {
    const payload = buildPayload(
      data,
      characteristics,
      talents,
      improvements,
      flaws,
    );

    if (isEditMode) {
      updateRaceMutation.mutate(payload);
      return;
    }

    createRaceMutation.mutate(payload);
  };

  const isPending =
    createRaceMutation.isPending || updateRaceMutation.isPending;

  if (isEditMode && isRaceDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da raça...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="race-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormAutocompleteInput<RaceFormData, IRaceCategory>
          id="race-form-category"
          name="categoryId"
          control={control}
          label="Categoria"
          options={categories ?? []}
          getOptionLabel={(category) => category.name}
          getOptionValue={(category) => category.id}
          placeholder="Selecione a categoria"
        />

        <FormTextInput
          id="race-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<RaceFormData, ITag>
          id="race-form-tags"
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

      <div className="w-full">
        <FormRichTextInput
          id="race-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a raça"
        />
      </div>

      <EntityReferenceListField
        label="Características"
        addButtonLabel="Adicionar Características"
        value={characteristics}
        onChange={setCharacteristics}
        tabs={[
          {
            label: 'Características',
            entityType: 'characteristic',
            url: '/characteristics',
          },
        ]}
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

      <RaceTalentsListField value={talents} onChange={setTalents} />

      <FormRichTextInput
        id="race-form-private-information"
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
