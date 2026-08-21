'use client';

import { useForm } from 'react-hook-form';
import {
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useCurrenciesQuery, useTagOptionsQuery } from '@/hooks/Queries';
import {
  UtilityFormData,
  utilityFormDefaultValues,
  utilityFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';

export interface UtilityCustomDataPayload {
  name: string;
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  volume?: number | null;
  tagIds: string[];
  privateInformation?: string;
}

export interface SheetUtilityStandaloneFormProps {
  onSubmit: (payload: UtilityCustomDataPayload) => void;
}

/**
 * Réplica de `UtilityCreateForm` sem persistência no catálogo — mesmo
 * espírito de `SheetWeaponStandaloneForm`.
 */
export const SheetUtilityStandaloneForm = ({
  onSubmit,
}: SheetUtilityStandaloneFormProps) => {
  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { control, handleSubmit } = useForm<UtilityFormData>({
    resolver: utilityFormResolver,
    defaultValues: utilityFormDefaultValues,
  });

  const handleFormSubmit = (data: UtilityFormData) => {
    onSubmit({
      name: data.name,
      referenceImage: data.referenceImage || undefined,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : null,
      currencyId: data.currencyId || undefined,
      volume: data.volume ? Number(data.volume) : null,
      tagIds: data.tagIds ?? [],
      privateInformation: data.privateInformation || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="sheet-utility-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="sheet-utility-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormTextInput
          id="sheet-utility-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<UtilityFormData, ICurrency>
          id="sheet-utility-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) => `${currency.abbreviation} - ${currency.name}`}
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormMultiAutocompleteInput<UtilityFormData, ITag>
          id="sheet-utility-form-tags"
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
          id="sheet-utility-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="sheet-utility-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o utilitário"
        />
      </div>

      <FormRichTextInput
        id="sheet-utility-form-private-information"
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
