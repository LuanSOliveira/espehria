'use client';

import { useEffect } from 'react';
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
import {
  useCreatureCategoriesQuery,
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  CreatureFormData,
  creatureFormDefaultValues,
  creatureFormResolver,
} from '@/shared/formSchemas';
import {
  ICreature,
  ICreatureCategory,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedCreatureStore } from '@/store';

export interface CreatureCreateFormProps {
  onSaved: () => void;
}

interface CreaturePayload extends Omit<CreatureFormData, 'referenceImageUrl'> {
  referenceImageUrl?: string;
}

export const CreatureCreateForm = ({ onSaved }: CreatureCreateFormProps) => {
  const selectedCreature = useSelectedCreatureStore(
    (state) => state.selectedCreature,
  );
  const isEditMode = !!selectedCreature;

  const { data: categories } = useCreatureCategoriesQuery();

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: creatureDetail,
    isLoading: isCreatureDetailLoading,
    isError: isCreatureDetailError,
    error: creatureDetailError,
  } = useGetEntityById<ICreature>({
    url: `/creatures/${selectedCreature?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<CreatureFormData>({
    resolver: creatureFormResolver,
    defaultValues: creatureFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(creatureFormDefaultValues);
      return;
    }

    if (!creatureDetail) {
      return;
    }

    reset({
      name: creatureDetail.name,
      referenceImageUrl: creatureDetail.referenceImageUrl ?? '',
      otherNames: creatureDetail.otherNames ?? '',
      categoryId: creatureDetail.category.id,
      threatLevel: creatureDetail.threatLevel ?? '',
      averageLifeExpectancy: creatureDetail.averageLifeExpectancy ?? '',
      physicalCharacteristics: creatureDetail.physicalCharacteristics ?? '',
      habitat: creatureDetail.habitat ?? '',
      behavior: creatureDetail.behavior ?? '',
      diet: creatureDetail.diet ?? '',
      lifeCycle: creatureDetail.lifeCycle ?? '',
      lifeStageInfant: creatureDetail.lifeStageInfant ?? '',
      lifeStageYoung: creatureDetail.lifeStageYoung ?? '',
      lifeStageAdult: creatureDetail.lifeStageAdult ?? '',
      lifeStageElder: creatureDetail.lifeStageElder ?? '',
      abilitiesAndPowers: creatureDetail.abilitiesAndPowers ?? '',
      resistances: creatureDetail.resistances ?? '',
      weaknesses: creatureDetail.weaknesses ?? '',
      combat: creatureDetail.combat ?? '',
      attackMethods: creatureDetail.attackMethods ?? '',
      strategy: creatureDetail.strategy ?? '',
      dangerDegree: creatureDetail.dangerDegree ?? '',
      obtainedResources: creatureDetail.obtainedResources ?? '',
      commercialValue: creatureDetail.commercialValue ?? '',
      relationWithCivilizations: creatureDetail.relationWithCivilizations ?? '',
      mythologyAndFolklore: creatureDetail.mythologyAndFolklore ?? '',
      encounterRecord: creatureDetail.encounterRecord ?? '',
      scholarsCuriosity: creatureDetail.scholarsCuriosity ?? '',
      tagIds: creatureDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, creatureDetail, reset]);

  useEffect(() => {
    if (!isCreatureDetailError) {
      return;
    }

    showToast({
      message:
        creatureDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da criatura.',
      type: 'error',
    });
  }, [isCreatureDetailError, creatureDetailError]);

  const buildPayload = (data: CreatureFormData): CreaturePayload => ({
    ...data,
    referenceImageUrl: data.referenceImageUrl || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createCreatureMutation = usePostEntity<ICreature, CreaturePayload>({
    url: '/creatures',
    invalidateQueryKeys: [['/creatures']],
    onSuccess: () => {
      showToast({
        message: 'Criatura cadastrada com sucesso.',
        type: 'success',
      });
      reset(creatureFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a criatura.',
        type: 'error',
      });
    },
  });

  const updateCreatureMutation = usePutEntity<ICreature, CreaturePayload>({
    url: `/creatures/${selectedCreature?.id}`,
    invalidateQueryKeys: [['/creatures']],
    onSuccess: () => {
      showToast({
        message: 'Criatura atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a criatura.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: CreatureFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateCreatureMutation.mutate(payload);
      return;
    }

    createCreatureMutation.mutate(payload);
  };

  const isPending =
    createCreatureMutation.isPending || updateCreatureMutation.isPending;

  if (isEditMode && isCreatureDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da criatura...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="creature-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="creature-form-reference-image-url"
          name="referenceImageUrl"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="creature-form-other-names"
          name="otherNames"
          control={control}
          label="Outros nomes"
          placeholder="Digite outros nomes conhecidos"
        />

        <FormAutocompleteInput<CreatureFormData, ICreatureCategory>
          id="creature-form-category"
          name="categoryId"
          control={control}
          label="Categoria"
          options={categories ?? []}
          getOptionLabel={(category) => category.name}
          getOptionValue={(category) => category.id}
          placeholder="Selecione a categoria"
        />

        <FormTextInput
          id="creature-form-threat-level"
          name="threatLevel"
          control={control}
          label="Nível de Ameaça"
          placeholder="Digite o nível de ameaça"
        />

        <FormTextInput
          id="creature-form-average-life-expectancy"
          name="averageLifeExpectancy"
          control={control}
          label="Expectativa de vida média"
          placeholder="Digite a expectativa de vida média"
        />

        <FormMultiAutocompleteInput<CreatureFormData, ITag>
          id="creature-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={(tag) => tag.name}
          getOptionValue={(tag) => tag.id}
          placeholder="Selecione as tags"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormRichTextInput
          id="creature-form-physical-characteristics"
          name="physicalCharacteristics"
          control={control}
          label="Características Físicas"
          placeholder="Descreva as características físicas"
        />

        <FormRichTextInput
          id="creature-form-habitat"
          name="habitat"
          control={control}
          label="Habitat"
          placeholder="Descreva o habitat"
        />

        <FormRichTextInput
          id="creature-form-behavior"
          name="behavior"
          control={control}
          label="Comportamento"
          placeholder="Descreva o comportamento"
        />

        <FormRichTextInput
          id="creature-form-diet"
          name="diet"
          control={control}
          label="Alimentação"
          placeholder="Descreva a alimentação"
        />

        <FormRichTextInput
          id="creature-form-life-cycle"
          name="lifeCycle"
          control={control}
          label="Ciclo de Vida"
          placeholder="Descreva o ciclo de vida"
        />

        <FormRichTextInput
          id="creature-form-life-stage-infant"
          name="lifeStageInfant"
          control={control}
          label="Estágio de Vida - Filhote"
          placeholder="Descreva o estágio filhote"
        />

        <FormRichTextInput
          id="creature-form-life-stage-young"
          name="lifeStageYoung"
          control={control}
          label="Estágio de Vida - Jovem"
          placeholder="Descreva o estágio jovem"
        />

        <FormRichTextInput
          id="creature-form-life-stage-adult"
          name="lifeStageAdult"
          control={control}
          label="Estágio de Vida - Adulto"
          placeholder="Descreva o estágio adulto"
        />

        <FormRichTextInput
          id="creature-form-life-stage-elder"
          name="lifeStageElder"
          control={control}
          label="Estágio de Vida - Ancião"
          placeholder="Descreva o estágio ancião"
        />

        <FormRichTextInput
          id="creature-form-abilities-and-powers"
          name="abilitiesAndPowers"
          control={control}
          label="Habilidades e Poderes"
          placeholder="Descreva as habilidades e poderes"
        />

        <FormRichTextInput
          id="creature-form-resistances"
          name="resistances"
          control={control}
          label="Resistências"
          placeholder="Descreva as resistências"
        />

        <FormRichTextInput
          id="creature-form-weaknesses"
          name="weaknesses"
          control={control}
          label="Fraquezas"
          placeholder="Descreva as fraquezas"
        />

        <FormRichTextInput
          id="creature-form-combat"
          name="combat"
          control={control}
          label="Combate"
          placeholder="Descreva o combate"
        />

        <FormRichTextInput
          id="creature-form-attack-methods"
          name="attackMethods"
          control={control}
          label="Métodos de Ataque"
          placeholder="Descreva os métodos de ataque"
        />

        <FormRichTextInput
          id="creature-form-strategy"
          name="strategy"
          control={control}
          label="Estratégia"
          placeholder="Descreva a estratégia"
        />

        <FormRichTextInput
          id="creature-form-danger-degree"
          name="dangerDegree"
          control={control}
          label="Grau de Perigo"
          placeholder="Descreva o grau de perigo"
        />

        <FormRichTextInput
          id="creature-form-obtained-resources"
          name="obtainedResources"
          control={control}
          label="Recursos Obtidos"
          placeholder="Descreva os recursos obtidos"
        />

        <FormRichTextInput
          id="creature-form-commercial-value"
          name="commercialValue"
          control={control}
          label="Valor Comercial"
          placeholder="Descreva o valor comercial"
        />

        <FormRichTextInput
          id="creature-form-relation-with-civilizations"
          name="relationWithCivilizations"
          control={control}
          label="Relação com Civilizações"
          placeholder="Descreva a relação com civilizações"
        />

        <FormRichTextInput
          id="creature-form-mythology-and-folklore"
          name="mythologyAndFolklore"
          control={control}
          label="Mitologia e Folclore"
          placeholder="Descreva a mitologia e o folclore"
        />

        <FormRichTextInput
          id="creature-form-encounter-record"
          name="encounterRecord"
          control={control}
          label="Registro de Encontro"
          placeholder="Descreva o registro de encontro"
        />

        <FormRichTextInput
          id="creature-form-scholars-curiosity"
          name="scholarsCuriosity"
          control={control}
          label="Curiosidade dos Estudiosos"
          placeholder="Descreva a curiosidade dos estudiosos"
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
