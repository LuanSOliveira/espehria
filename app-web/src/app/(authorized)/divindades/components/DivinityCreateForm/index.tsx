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
  useDivinityCategoriesQuery,
  useGetEntityById,
  useGetEntityList,
  usePostEntity,
  usePutEntity,
} from '@/hooks/Queries';
import {
  DivinityFormData,
  divinityFormDefaultValues,
  divinityFormResolver,
} from '@/shared/formSchemas';
import {
  IDivinity,
  IDivinityCategory,
  ITag,
  ITagListFilters,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedDivinityStore } from '@/store';

export interface DivinityCreateFormProps {
  onSaved: () => void;
}

interface DivinityPayload
  extends Omit<DivinityFormData, 'referenceImage' | 'sacredSymbol'> {
  referenceImage?: string;
  sacredSymbol?: string;
}

export const DivinityCreateForm = ({ onSaved }: DivinityCreateFormProps) => {
  const selectedDivinity = useSelectedDivinityStore(
    (state) => state.selectedDivinity,
  );
  const isEditMode = !!selectedDivinity;

  const { data: categories } = useDivinityCategoriesQuery();

  const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: 100 },
  });
  const tagOptions = tagsData?.data ?? [];

  const {
    data: divinityDetail,
    isLoading: isDivinityDetailLoading,
    isError: isDivinityDetailError,
    error: divinityDetailError,
  } = useGetEntityById<IDivinity>({
    url: `/divinities/${selectedDivinity?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<DivinityFormData>({
    resolver: divinityFormResolver,
    defaultValues: divinityFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(divinityFormDefaultValues);
      return;
    }

    if (!divinityDetail) {
      return;
    }

    reset({
      name: divinityDetail.name,
      categoryId: divinityDetail.category.id,
      referenceImage: divinityDetail.referenceImage ?? '',
      description: divinityDetail.description ?? '',
      tagIds: divinityDetail.tags?.map((tag) => tag.id) ?? [],
      titles: divinityDetail.titles ?? '',
      alignment: divinityDetail.alignment ?? '',
      domainSphere: divinityDetail.domainSphere ?? '',
      primaryElement: divinityDetail.primaryElement ?? '',
      sacredSymbol: divinityDetail.sacredSymbol ?? '',
      sacredAnimal: divinityDetail.sacredAnimal ?? '',
      sacredColor: divinityDetail.sacredColor ?? '',
      personality: divinityDetail.personality ?? '',
      divineDomains: divinityDetail.divineDomains ?? '',
      powers: divinityDetail.powers ?? '',
      worldInfluence: divinityDetail.worldInfluence ?? '',
      divineAppearance: divinityDetail.divineAppearance ?? '',
      avatars: divinityDetail.avatars ?? '',
      church: divinityDetail.church ?? '',
      cult: divinityDetail.cult ?? '',
      blessings: divinityDetail.blessings ?? '',
      curses: divinityDetail.curses ?? '',
      legends: divinityDetail.legends ?? '',
      commandments: divinityDetail.commandments ?? '',
      oaths: divinityDetail.oaths ?? '',
      curiosities: divinityDetail.curiosities ?? '',
    });
  }, [isEditMode, divinityDetail, reset]);

  useEffect(() => {
    if (!isDivinityDetailError) {
      return;
    }

    showToast({
      message:
        divinityDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da divindade.',
      type: 'error',
    });
  }, [isDivinityDetailError, divinityDetailError]);

  const buildPayload = (data: DivinityFormData): DivinityPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    sacredSymbol: data.sacredSymbol || undefined,
    tagIds: data.tagIds ?? [],
  });

  const createDivinityMutation = usePostEntity<IDivinity, DivinityPayload>({
    url: '/divinities',
    invalidateQueryKeys: [['/divinities']],
    onSuccess: () => {
      showToast({
        message: 'Divindade cadastrada com sucesso.',
        type: 'success',
      });
      reset(divinityFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a divindade.',
        type: 'error',
      });
    },
  });

  const updateDivinityMutation = usePutEntity<IDivinity, DivinityPayload>({
    url: `/divinities/${selectedDivinity?.id}`,
    invalidateQueryKeys: [['/divinities']],
    onSuccess: () => {
      showToast({
        message: 'Divindade atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a divindade.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: DivinityFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateDivinityMutation.mutate(payload);
      return;
    }

    createDivinityMutation.mutate(payload);
  };

  const isPending =
    createDivinityMutation.isPending || updateDivinityMutation.isPending;

  if (isEditMode && isDivinityDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da divindade...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="divinity-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="divinity-form-titles"
          name="titles"
          control={control}
          label="Títulos"
          placeholder="Digite os títulos"
        />

        <FormAutocompleteInput<DivinityFormData, IDivinityCategory>
          id="divinity-form-category"
          name="categoryId"
          control={control}
          label="Categoria"
          options={categories ?? []}
          getOptionLabel={(category) => category.name}
          getOptionValue={(category) => category.id}
          placeholder="Selecione a categoria"
        />

        <FormMultiAutocompleteInput<DivinityFormData, ITag>
          id="divinity-form-tags"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="divinity-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="divinity-form-sacred-symbol"
          name="sacredSymbol"
          control={control}
          label="Símbolo Sagrado"
          placeholder="https://exemplo.com/simbolo.jpg"
        />

        <FormTextInput
          id="divinity-form-alignment"
          name="alignment"
          control={control}
          label="Alinhamento"
          placeholder="Digite o alinhamento"
        />

        <FormTextInput
          id="divinity-form-domain-sphere"
          name="domainSphere"
          control={control}
          label="Esfera de Domínio"
          placeholder="Digite a esfera de domínio"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="divinity-form-primary-element"
          name="primaryElement"
          control={control}
          label="Elemento Primário"
          placeholder="Digite o elemento primário"
        />

        <FormTextInput
          id="divinity-form-sacred-animal"
          name="sacredAnimal"
          control={control}
          label="Animal Sagrado"
          placeholder="Digite o animal sagrado"
        />

        <FormTextInput
          id="divinity-form-sacred-color"
          name="sacredColor"
          control={control}
          label="Cor Sagrada"
          placeholder="Digite a cor sagrada"
        />

        <div />
      </div>

      <FormRichTextInput
        id="divinity-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a divindade"
      />

      <FormRichTextInput
        id="divinity-form-personality"
        name="personality"
        control={control}
        label="Personalidade"
        placeholder="Descreva a personalidade"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRichTextInput
          id="divinity-form-divine-domains"
          name="divineDomains"
          control={control}
          label="Domínios Divinos"
          placeholder="Descreva os domínios divinos"
        />

        <FormRichTextInput
          id="divinity-form-powers"
          name="powers"
          control={control}
          label="Poderes"
          placeholder="Descreva os poderes"
        />
      </div>

      <FormRichTextInput
        id="divinity-form-world-influence"
        name="worldInfluence"
        control={control}
        label="Influência no Mundo"
        placeholder="Descreva a influência no mundo"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRichTextInput
          id="divinity-form-divine-appearance"
          name="divineAppearance"
          control={control}
          label="Aparência Divina"
          placeholder="Descreva a aparência divina"
        />

        <FormRichTextInput
          id="divinity-form-avatars"
          name="avatars"
          control={control}
          label="Avatares"
          placeholder="Descreva os avatares"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRichTextInput
          id="divinity-form-church"
          name="church"
          control={control}
          label="Igreja"
          placeholder="Descreva a igreja"
        />

        <FormRichTextInput
          id="divinity-form-cult"
          name="cult"
          control={control}
          label="Culto"
          placeholder="Descreva o culto"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRichTextInput
          id="divinity-form-blessings"
          name="blessings"
          control={control}
          label="Bênçãos"
          placeholder="Descreva as bênçãos"
        />

        <FormRichTextInput
          id="divinity-form-curses"
          name="curses"
          control={control}
          label="Maldições"
          placeholder="Descreva as maldições"
        />
      </div>

      <FormRichTextInput
        id="divinity-form-legends"
        name="legends"
        control={control}
        label="Lendas"
        placeholder="Descreva as lendas"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRichTextInput
          id="divinity-form-commandments"
          name="commandments"
          control={control}
          label="Mandamentos"
          placeholder="Descreva os mandamentos"
        />

        <FormRichTextInput
          id="divinity-form-oaths"
          name="oaths"
          control={control}
          label="Juramentos"
          placeholder="Descreva os juramentos"
        />
      </div>

      <FormRichTextInput
        id="divinity-form-curiosities"
        name="curiosities"
        control={control}
        label="Curiosidades"
        placeholder="Descreva as curiosidades"
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
