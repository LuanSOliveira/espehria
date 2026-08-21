'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FormAutocompleteInput,
  FormCheckboxInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { Label } from '@/shared/components/Texts';
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import {
  useCurrenciesQuery,
  useDamageTypesQuery,
  useSizeGradesQuery,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  WeaponFormData,
  weaponFormDefaultValues,
  weaponFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IDamageType, IEntityReference, ISizeGrade, ITag } from '@/shared/interfaces';
import { formatTagLabel } from '@/shared/util';
import { WEAPON_DAMAGE_DIE_OPTIONS } from '@/shared/constants';
import {
  WEAPON_HANDS_OPTIONS,
  WEAPON_STYLE_OPTIONS,
} from '@/app/(authorized)/armas/data';
import {
  WeaponTraitsField,
  WeaponDamagesField,
} from '@/shared/components/EquipmentFields';

export interface WeaponCustomDataPayload {
  name: string;
  nickname?: string;
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  volume?: number | null;
  sizeGradeId?: string;
  hands?: string;
  weaponStyle?: string;
  traitIds: string[];
  damageValue?: number | null;
  damageDie?: string;
  damageTypeId?: string;
  magicalDamage: boolean;
  distanceMeters?: number | null;
  usesAmmunition: boolean;
  reloadActions?: number | null;
  tagIds: string[];
  privateInformation?: string;
  alternativeDamages: unknown[];
  extraDamages: unknown[];
  enchantments: { name: string; effect?: string }[];
  enhancements: { name: string; effect?: string }[];
}

export interface SheetWeaponStandaloneFormProps {
  onSubmit: (payload: WeaponCustomDataPayload) => void;
}

/**
 * Réplica de `WeaponCreateForm` sem persistência no catálogo — usada no
 * fluxo "item avulso" de adicionar item ao inventário da ficha. `onSubmit`
 * recebe o payload já convertido (mesma conversão string→número/undefined de
 * `buildPayload` do `WeaponCreateForm`), pronto para ser enviado como
 * `customData` em `POST /sheets/:id/inventory-items`.
 */
export const SheetWeaponStandaloneForm = ({
  onSubmit,
}: SheetWeaponStandaloneFormProps) => {
  const [traits, setTraits] = useState<IEntityReference[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { data: sizeGradesData } = useSizeGradesQuery();
  const sizeGradeOptions = sizeGradesData ?? [];

  const { data: damageTypesData } = useDamageTypesQuery();
  const damageTypeOptions = damageTypesData ?? [];

  const { control, handleSubmit } = useForm<WeaponFormData>({
    resolver: weaponFormResolver,
    defaultValues: weaponFormDefaultValues,
  });

  const buildDamagePayload = (damages: WeaponFormData['alternativeDamages']) =>
    damages.map((damage) => ({
      damageValue: damage.damageValue ? Number(damage.damageValue) : null,
      damageDie: damage.damageDie || undefined,
      damageTypeId: damage.damageTypeId || undefined,
      magicalDamage: damage.magicalDamage,
      distanceMeters: damage.distanceMeters ? Number(damage.distanceMeters) : null,
      usesAmmunition: damage.usesAmmunition,
      reloadActions: damage.reloadActions ? Number(damage.reloadActions) : null,
    }));

  const buildEmbeddedEffectPayload = (items: WeaponFormData['enchantments']) =>
    items.map((item) => ({ name: item.name, effect: item.effect || undefined }));

  const handleFormSubmit = (data: WeaponFormData) => {
    const payload: WeaponCustomDataPayload = {
      name: data.name,
      nickname: data.nickname || undefined,
      referenceImage: data.referenceImage || undefined,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : null,
      currencyId: data.currencyId || undefined,
      volume: data.volume ? Number(data.volume) : null,
      sizeGradeId: data.sizeGradeId || undefined,
      hands: data.hands || undefined,
      weaponStyle: data.weaponStyle || undefined,
      traitIds: traits.map((t) => t.id),
      damageValue: data.damageValue ? Number(data.damageValue) : null,
      damageDie: data.damageDie || undefined,
      damageTypeId: data.damageTypeId || undefined,
      magicalDamage: data.magicalDamage,
      distanceMeters: data.distanceMeters ? Number(data.distanceMeters) : null,
      usesAmmunition: data.usesAmmunition,
      reloadActions: data.reloadActions ? Number(data.reloadActions) : null,
      tagIds: data.tagIds ?? [],
      privateInformation: data.privateInformation || undefined,
      alternativeDamages: buildDamagePayload(data.alternativeDamages),
      extraDamages: buildDamagePayload(data.extraDamages),
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
          id="sheet-weapon-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="sheet-weapon-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="sheet-weapon-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<WeaponFormData, ITag>
          id="sheet-weapon-form-tags"
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
          id="sheet-weapon-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<WeaponFormData, ICurrency>
          id="sheet-weapon-form-currency"
          name="currencyId"
          control={control}
          label="Moeda"
          options={currencyOptions}
          getOptionLabel={(currency) => `${currency.abbreviation} - ${currency.name}`}
          getOptionValue={(currency) => currency.id}
          placeholder="Selecione a moeda"
        />

        <FormTextInput
          id="sheet-weapon-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />

        <FormAutocompleteInput<WeaponFormData, ISizeGrade>
          id="sheet-weapon-form-size-grade"
          name="sizeGradeId"
          control={control}
          label="Grau de Tamanho"
          options={sizeGradeOptions}
          getOptionLabel={(sizeGrade) => sizeGrade.name}
          getOptionValue={(sizeGrade) => sizeGrade.id}
          placeholder="Selecione o grau de tamanho"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormAutocompleteInput<WeaponFormData, (typeof WEAPON_HANDS_OPTIONS)[number]>
          id="sheet-weapon-form-hands"
          name="hands"
          control={control}
          label="Mãos"
          options={WEAPON_HANDS_OPTIONS}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          placeholder="Selecione a quantidade de mãos"
        />

        <FormAutocompleteInput<WeaponFormData, (typeof WEAPON_STYLE_OPTIONS)[number]>
          id="sheet-weapon-form-weapon-style"
          name="weaponStyle"
          control={control}
          label="Estilo de Arma"
          options={WEAPON_STYLE_OPTIONS}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          placeholder="Selecione o estilo de arma"
        />
      </div>

      <WeaponTraitsField value={traits} onChange={setTraits} />

      <div className="flex flex-col gap-4">
        <Label component="span" sx={{ margin: 0 }}>
          Dano
        </Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormTextInput
            id="sheet-weapon-form-damage-value"
            name="damageValue"
            control={control}
            label="Valor"
            placeholder="Digite o valor de dano"
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
          />

          <FormAutocompleteInput<WeaponFormData, (typeof WEAPON_DAMAGE_DIE_OPTIONS)[number]>
            id="sheet-weapon-form-damage-die"
            name="damageDie"
            control={control}
            label="Dado"
            options={WEAPON_DAMAGE_DIE_OPTIONS}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            placeholder="Selecione o dado"
          />

          <FormAutocompleteInput<WeaponFormData, IDamageType>
            id="sheet-weapon-form-damage-type"
            name="damageTypeId"
            control={control}
            label="Tipo de dano"
            options={damageTypeOptions}
            getOptionLabel={(damageType) => damageType.name}
            getOptionValue={(damageType) => damageType.id}
            placeholder="Selecione o tipo de dano"
          />

          <FormCheckboxInput
            id="sheet-weapon-form-magical-damage"
            name="magicalDamage"
            control={control}
            label="Dano mágico"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="sheet-weapon-form-distance-meters"
          name="distanceMeters"
          control={control}
          label="Distância (Metros)"
          placeholder="Digite a distância"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}
        />
        <FormTextInput
          id="sheet-weapon-form-reload-actions"
          name="reloadActions"
          control={control}
          label="Ações de Recarga"
          placeholder="Digite as ações de recarga"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />
        <FormCheckboxInput
          id="sheet-weapon-form-uses-ammunition"
          name="usesAmmunition"
          control={control}
          label="Usa Munição?"
        />
      </div>

      <WeaponDamagesField
        control={control}
        name="alternativeDamages"
        title="Dano Alternativo"
        addButtonLabel="Adicionar Dano Alternativo"
        damageTypeOptions={damageTypeOptions}
      />

      <WeaponDamagesField
        control={control}
        name="extraDamages"
        title="Dano Extra"
        addButtonLabel="Adicionar Dano Extra"
        damageTypeOptions={damageTypeOptions}
      />

      <EmbeddedEffectsField control={control} applicableType="weapon" />

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="sheet-weapon-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a arma"
        />
      </div>

      <FormRichTextInput
        id="sheet-weapon-form-private-information"
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
