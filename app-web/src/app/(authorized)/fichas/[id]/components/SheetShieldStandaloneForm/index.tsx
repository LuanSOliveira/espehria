'use client';

import { useForm } from 'react-hook-form';
import {
  DefaultTextInput,
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import { useCurrenciesQuery, useTagOptionsQuery } from '@/hooks/Queries';
import {
  ShieldFormData,
  shieldFormDefaultValues,
  shieldFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface ShieldCustomDataPayload {
  name: string;
  nickname?: string;
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  volume?: number | null;
  armorClassBonus?: number | null;
  speedPenaltyMeters?: number | null;
  hardness?: number | null;
  hitPoints?: number | null;
  tagIds: string[];
  privateInformation?: string;
  enchantments: { name: string; effect?: string }[];
  enhancements: { name: string; effect?: string }[];
}

export interface SheetShieldStandaloneFormProps {
  onSubmit: (payload: ShieldCustomDataPayload) => void;
}

/**
 * Réplica de `ShieldCreateForm` sem persistência no catálogo — mesmo
 * espírito de `SheetWeaponStandaloneForm`.
 */
export const SheetShieldStandaloneForm = ({
  onSubmit,
}: SheetShieldStandaloneFormProps) => {
  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { control, handleSubmit, watch } = useForm<ShieldFormData>({
    resolver: shieldFormResolver,
    defaultValues: shieldFormDefaultValues,
  });

  const hitPointsValue = watch('hitPoints');
  const breakThresholdValue = hitPointsValue
    ? Math.floor(Number(hitPointsValue) / 2)
    : 0;

  const buildEmbeddedEffectPayload = (items: ShieldFormData['enchantments']) =>
    items.map((item) => ({ name: item.name, effect: item.effect || undefined }));

  const handleFormSubmit = (data: ShieldFormData) => {
    const payload: ShieldCustomDataPayload = {
      name: data.name,
      nickname: data.nickname || undefined,
      referenceImage: data.referenceImage || undefined,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : null,
      currencyId: data.currencyId || undefined,
      volume: data.volume ? Number(data.volume) : null,
      armorClassBonus: data.armorClassBonus ? Number(data.armorClassBonus) : null,
      speedPenaltyMeters: data.speedPenaltyMeters
        ? Number(data.speedPenaltyMeters)
        : null,
      hardness: data.hardness ? Number(data.hardness) : null,
      hitPoints: data.hitPoints ? Number(data.hitPoints) : null,
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
          id="sheet-shield-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="sheet-shield-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="sheet-shield-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<ShieldFormData, ITag>
          id="sheet-shield-form-tags"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="sheet-shield-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ShieldFormData, ICurrency>
          id="sheet-shield-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) => `${currency.abbreviation} - ${currency.name}`}
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormTextInput
          id="sheet-shield-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="sheet-shield-form-armor-class-bonus"
          name="armorClassBonus"
          control={control}
          label="Bônus de CA"
          placeholder="Digite o bônus de CA"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="sheet-shield-form-speed-penalty-meters"
          name="speedPenaltyMeters"
          control={control}
          label="Penalidade de Velocidade (Metros)"
          placeholder="Digite a penalidade de velocidade"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="sheet-shield-form-hardness"
          name="hardness"
          control={control}
          label="Dureza"
          placeholder="Digite a dureza"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="sheet-shield-form-hit-points"
          name="hitPoints"
          control={control}
          label="Pontos de Vida"
          placeholder="Digite os pontos de vida"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <DefaultTextInput
          id="sheet-shield-form-break-threshold"
          label="Limiar de Quebra"
          value={breakThresholdValue}
          disabled
          type="number"
        />
      </div>

      <EmbeddedEffectsField control={control} applicableType="shield" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="sheet-shield-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o escudo"
        />
      </div>

      <FormRichTextInput
        id="sheet-shield-form-private-information"
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
