'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import { useArmorCategoriesQuery, useCurrenciesQuery, useTagOptionsQuery } from '@/hooks/Queries';
import {
  ArmorFormData,
  armorFormDefaultValues,
  armorFormResolver,
} from '@/shared/formSchemas';
import { IArmorCategory, ICurrency, IEntityReference, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';
import { ArmorTraitsField } from '@/shared/components/EquipmentFields';

export interface ArmorCustomDataPayload {
  name: string;
  nickname?: string;
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  volume?: number | null;
  armorCategoryId?: string;
  armorClassBonus?: number | null;
  dexterityModifierLimit?: number | null;
  strength?: number | null;
  checkPenalty?: number | null;
  speedPenaltyMeters?: number | null;
  traitIds: string[];
  tagIds: string[];
  privateInformation?: string;
  enchantments: { name: string; effect?: string }[];
  enhancements: { name: string; effect?: string }[];
}

export interface SheetArmorStandaloneFormProps {
  onSubmit: (payload: ArmorCustomDataPayload) => void;
}

/**
 * Réplica de `ArmorCreateForm` sem persistência no catálogo — mesmo espírito
 * de `SheetWeaponStandaloneForm`.
 */
export const SheetArmorStandaloneForm = ({
  onSubmit,
}: SheetArmorStandaloneFormProps) => {
  const [traits, setTraits] = useState<IEntityReference[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { data: armorCategoriesData } = useArmorCategoriesQuery();
  const armorCategoryOptions = armorCategoriesData ?? [];

  const { control, handleSubmit } = useForm<ArmorFormData>({
    resolver: armorFormResolver,
    defaultValues: armorFormDefaultValues,
  });

  const buildEmbeddedEffectPayload = (items: ArmorFormData['enchantments']) =>
    items.map((item) => ({ name: item.name, effect: item.effect || undefined }));

  const handleFormSubmit = (data: ArmorFormData) => {
    const payload: ArmorCustomDataPayload = {
      name: data.name,
      nickname: data.nickname || undefined,
      referenceImage: data.referenceImage || undefined,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : null,
      currencyId: data.currencyId || undefined,
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
      tagIds: data.tagIds ?? [],
      privateInformation: data.privateInformation || undefined,
      enchantments: buildEmbeddedEffectPayload(data.enchantments),
      enhancements: buildEmbeddedEffectPayload(data.enhancements),
    };

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="sheet-armor-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="sheet-armor-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="sheet-armor-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<ArmorFormData, ITag>
          id="sheet-armor-form-tags"
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
          id="sheet-armor-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ArmorFormData, ICurrency>
          id="sheet-armor-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) => `${currency.abbreviation} - ${currency.name}`}
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormTextInput
          id="sheet-armor-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />

        <FormAutocompleteInput<ArmorFormData, IArmorCategory>
          id="sheet-armor-form-armor-category"
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
          id="sheet-armor-form-armor-class-bonus"
          name="armorClassBonus"
          control={control}
          label="Bônus de CA"
          placeholder="Digite o bônus de CA"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="sheet-armor-form-dexterity-modifier-limit"
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
          id="sheet-armor-form-strength"
          name="strength"
          control={control}
          label="Força"
          placeholder="Digite a força"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="sheet-armor-form-check-penalty"
          name="checkPenalty"
          control={control}
          label="Penalidade em teste"
          placeholder="Digite a penalidade em teste"
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="sheet-armor-form-speed-penalty-meters"
          name="speedPenaltyMeters"
          control={control}
          label="Penalidade de Velocidade (Metros)"
          placeholder="Digite a penalidade de velocidade"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
      </div>

      <ArmorTraitsField value={traits} onChange={setTraits} />

      <EmbeddedEffectsField control={control} applicableType="armor" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="sheet-armor-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a armadura"
        />
      </div>

      <FormRichTextInput
        id="sheet-armor-form-private-information"
        name="privateInformation"
        control={control}
        label="Informações Privadas"
        placeholder="Anotações internas não destinadas ao público"
      />

      <PrimaryButton type="submit" sx={{ marginTop: '8px' }}>
        Avançar
      </PrimaryButton>
    </form>
  );
};
