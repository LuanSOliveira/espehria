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
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import {
  useArmorCategoriesQuery,
  useCurrenciesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  ArmorFormData,
  armorFormDefaultValues,
  armorFormResolver,
} from '@/shared/formSchemas';
import {
  IArmor,
  IArmorCategory,
  ICurrency,
  IEntityReference,
  ITag,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedArmorStore } from '@/store';
import { ArmorTraitsField } from '../ArmorTraitsField';

export interface ArmorCreateFormProps {
  onSaved: () => void;
}

interface EmbeddedEffectPayload {
  name: string;
  effect?: string;
}

interface ArmorPayload
  extends Omit<
    ArmorFormData,
    | 'referenceImage'
    | 'description'
    | 'price'
    | 'currencyId'
    | 'privateInformation'
    | 'nickname'
    | 'volume'
    | 'armorCategoryId'
    | 'armorClassBonus'
    | 'dexterityModifierLimit'
    | 'strength'
    | 'checkPenalty'
    | 'speedPenaltyMeters'
    | 'enchantments'
    | 'enhancements'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
  nickname?: string;
  volume?: number | null;
  armorCategoryId?: string;
  armorClassBonus?: number | null;
  dexterityModifierLimit?: number | null;
  strength?: number | null;
  checkPenalty?: number | null;
  speedPenaltyMeters?: number | null;
  traitIds: string[];
  enchantments: EmbeddedEffectPayload[];
  enhancements: EmbeddedEffectPayload[];
}

export const ArmorCreateForm = ({ onSaved }: ArmorCreateFormProps) => {
  const selectedArmor = useSelectedArmorStore((state) => state.selectedArmor);
  const isEditMode = !!selectedArmor;

  const [traits, setTraits] = useState<IEntityReference[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { data: armorCategoriesData } = useArmorCategoriesQuery();
  const armorCategoryOptions = armorCategoriesData ?? [];

  const {
    data: armorDetail,
    isLoading: isArmorDetailLoading,
    isError: isArmorDetailError,
    error: armorDetailError,
  } = useGetEntityById<IArmor>({
    url: `/armors/${selectedArmor?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<ArmorFormData>({
    resolver: armorFormResolver,
    defaultValues: armorFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(armorFormDefaultValues);
      setTraits([]);
      return;
    }

    if (!armorDetail) {
      return;
    }

    reset({
      name: armorDetail.name,
      nickname: armorDetail.nickname ?? '',
      referenceImage: armorDetail.referenceImage ?? '',
      description: armorDetail.description ?? '',
      price: armorDetail.price != null ? String(armorDetail.price) : '',
      currencyId: armorDetail.currency?.id ?? '',
      volume: armorDetail.volume != null ? String(armorDetail.volume) : '',
      armorCategoryId: armorDetail.armorCategory?.id ?? '',
      armorClassBonus:
        armorDetail.armorClassBonus != null
          ? String(armorDetail.armorClassBonus)
          : '',
      dexterityModifierLimit:
        armorDetail.dexterityModifierLimit != null
          ? String(armorDetail.dexterityModifierLimit)
          : '',
      strength: armorDetail.strength != null ? String(armorDetail.strength) : '',
      checkPenalty:
        armorDetail.checkPenalty != null ? String(armorDetail.checkPenalty) : '',
      speedPenaltyMeters:
        armorDetail.speedPenaltyMeters != null
          ? String(armorDetail.speedPenaltyMeters)
          : '',
      privateInformation: armorDetail.privateInformation ?? '',
      tagIds: armorDetail.tags?.map((tag) => tag.id) ?? [],
      enchantments: (armorDetail.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
      enhancements: (armorDetail.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
    });

    setTraits(
      armorDetail.traits?.map((trait) => ({
        id: trait.id,
        name: trait.name,
        entityType: 'trait',
        tags: trait.tags,
      })) ?? [],
    );
  }, [isEditMode, armorDetail, reset]);

  useEffect(() => {
    if (!isArmorDetailError) {
      return;
    }

    showToast({
      message:
        armorDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da armadura.',
      type: 'error',
    });
  }, [isArmorDetailError, armorDetailError]);

  const buildEmbeddedEffectPayload = (
    items: ArmorFormData['enchantments'],
  ): EmbeddedEffectPayload[] =>
    items.map((item) => ({
      name: item.name,
      effect: item.effect || undefined,
    }));

  const buildPayload = (data: ArmorFormData): ArmorPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
    nickname: data.nickname || undefined,
    volume: data.volume ? Number(data.volume) : null,
    armorCategoryId: data.armorCategoryId || undefined,
    armorClassBonus: data.armorClassBonus ? Number(data.armorClassBonus) : null,
    dexterityModifierLimit: data.dexterityModifierLimit
      ? Number(data.dexterityModifierLimit)
      : null,
    strength: data.strength ? Number(data.strength) : null,
    checkPenalty: data.checkPenalty ? Number(data.checkPenalty) : null,
    speedPenaltyMeters: data.speedPenaltyMeters
      ? Number(data.speedPenaltyMeters)
      : null,
    traitIds: traits.map((t) => t.id),
    enchantments: buildEmbeddedEffectPayload(data.enchantments),
    enhancements: buildEmbeddedEffectPayload(data.enhancements),
  });

  const createArmorMutation = usePostEntity<IArmor, ArmorPayload>({
    url: '/armors',
    invalidateQueryKeys: [['/armors']],
    onSuccess: () => {
      showToast({
        message: 'Armadura cadastrada com sucesso.',
        type: 'success',
      });
      reset(armorFormDefaultValues);
      setTraits([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a armadura.',
        type: 'error',
      });
    },
  });

  const updateArmorMutation = usePutEntity<IArmor, ArmorPayload>({
    url: `/armors/${selectedArmor?.id}`,
    invalidateQueryKeys: [['/armors']],
    onSuccess: () => {
      showToast({
        message: 'Armadura atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a armadura.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ArmorFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateArmorMutation.mutate(payload);
      return;
    }

    createArmorMutation.mutate(payload);
  };

  const isPending =
    createArmorMutation.isPending || updateArmorMutation.isPending;

  if (isEditMode && isArmorDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da armadura...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="armor-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="armor-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="armor-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<ArmorFormData, ITag>
          id="armor-form-tags"
          name="tagIds"
          control={control}
          label="Tags"
          options={tagOptions}
          getOptionLabel={formatTagLabel}
          getOptionValue={(tag) => tag.id}
          getOptionColor={(tag) => tag.color}
          placeholder="Selecione as tags"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="armor-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ArmorFormData, ICurrency>
          id="armor-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) =>
            `${currency.abbreviation} - ${currency.name}`
          }
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormTextInput
          id="armor-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />

        <FormAutocompleteInput<ArmorFormData, IArmorCategory>
          id="armor-form-armor-category"
          name="armorCategoryId"
          control={control}
          label="Categoria"
          options={armorCategoryOptions}
          getOptionLabel={(armorCategory) => armorCategory.name}
          getOptionValue={(armorCategory) => armorCategory.id}
          placeholder="Selecione a categoria"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="armor-form-armor-class-bonus"
          name="armorClassBonus"
          control={control}
          label="Bônus de CA"
          placeholder="Digite o bônus de CA"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="armor-form-dexterity-modifier-limit"
          name="dexterityModifierLimit"
          control={control}
          label="Limite de modificador de Destreza"
          placeholder="Digite o limite"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="armor-form-strength"
          name="strength"
          control={control}
          label="Força"
          placeholder="Digite a força"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="armor-form-check-penalty"
          name="checkPenalty"
          control={control}
          label="Penalidade em teste"
          placeholder="Digite a penalidade em teste"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="armor-form-speed-penalty-meters"
          name="speedPenaltyMeters"
          control={control}
          label="Penalidade de Velocidade (Metros)"
          placeholder="Digite a penalidade de velocidade"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />
      </div>

      <ArmorTraitsField value={traits} onChange={setTraits} />

      <EmbeddedEffectsField control={control} applicableType="armor" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="armor-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a armadura"
        />
      </div>

      <FormRichTextInput
        id="armor-form-private-information"
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
