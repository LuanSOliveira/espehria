'use client';

import { useForm } from 'react-hook-form';
import {
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import { useCurrenciesQuery, useTagOptionsQuery } from '@/hooks/Queries';
import {
  AccessoryFormData,
  accessoryFormDefaultValues,
  accessoryFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface AccessoryCustomDataPayload {
  name: string;
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  volume?: number | null;
  tagIds: string[];
  privateInformation?: string;
  enchantments: { name: string; effect?: string }[];
  enhancements: { name: string; effect?: string }[];
}

export interface SheetAccessoryStandaloneFormProps {
  onSubmit: (payload: AccessoryCustomDataPayload) => void;
}

/**
 * Réplica de `AccessoryCreateForm` sem persistência no catálogo — mesmo
 * espírito de `SheetWeaponStandaloneForm`.
 */
export const SheetAccessoryStandaloneForm = ({
  onSubmit,
}: SheetAccessoryStandaloneFormProps) => {
  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { control, handleSubmit } = useForm<AccessoryFormData>({
    resolver: accessoryFormResolver,
    defaultValues: accessoryFormDefaultValues,
  });

  const buildEmbeddedEffectPayload = (items: AccessoryFormData['enchantments']) =>
    items.map((item) => ({ name: item.name, effect: item.effect || undefined }));

  const handleFormSubmit = (data: AccessoryFormData) => {
    onSubmit({
      name: data.name,
      referenceImage: data.referenceImage || undefined,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : null,
      currencyId: data.currencyId || undefined,
      volume: data.volume ? Number(data.volume) : null,
      tagIds: data.tagIds ?? [],
      privateInformation: data.privateInformation || undefined,
      enchantments: buildEmbeddedEffectPayload(data.enchantments),
      enhancements: buildEmbeddedEffectPayload(data.enhancements),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="sheet-accessory-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="sheet-accessory-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="sheet-accessory-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<AccessoryFormData, ICurrency>
          id="sheet-accessory-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) => `${currency.abbreviation} - ${currency.name}`}
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormMultiAutocompleteInput<AccessoryFormData, ITag>
          id="sheet-accessory-form-tags"
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
          id="sheet-accessory-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
      </div>

      <EmbeddedEffectsField control={control} applicableType="accessory" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="sheet-accessory-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o acessório"
        />
      </div>

      <FormRichTextInput
        id="sheet-accessory-form-private-information"
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
