'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  FormAutocompleteInput,
  FormCheckboxInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { EmbeddedEffectsField } from '@/shared/components/EmbeddedEffectsField';
import {
  useCurrenciesQuery,
  useDamageTypesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useSizeGradesQuery,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  WeaponFormData,
  weaponFormDefaultValues,
  weaponFormResolver,
} from '@/shared/formSchemas';
import {
  ICurrency,
  IDamageType,
  IEntityReference,
  ISizeGrade,
  IWeapon,
  ITag,
} from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedWeaponStore } from '@/store';
import {
  WEAPON_DAMAGE_DIE_OPTIONS,
  WEAPON_HANDS_OPTIONS,
  WEAPON_STYLE_OPTIONS,
} from '../../data';
import { WeaponTraitsField } from '../WeaponTraitsField';
import { WeaponDamagesField } from '../WeaponDamagesField';

export interface WeaponCreateFormProps {
  onSaved: () => void;
}

interface WeaponDamagePayload {
  damageValue?: number | null;
  damageDie?: string;
  damageTypeId?: string;
  magicalDamage: boolean;
  distanceMeters?: number | null;
  usesAmmunition: boolean;
  reloadActions?: number | null;
}

interface WeaponEmbeddedEffectPayload {
  name: string;
  effect?: string;
}

interface WeaponPayload extends Omit<
  WeaponFormData,
  | 'referenceImage'
  | 'description'
  | 'price'
  | 'currencyId'
  | 'privateInformation'
  | 'nickname'
  | 'volume'
  | 'sizeGradeId'
  | 'hands'
  | 'weaponStyle'
  | 'damageValue'
  | 'damageDie'
  | 'damageTypeId'
  | 'distanceMeters'
  | 'reloadActions'
  | 'alternativeDamages'
  | 'extraDamages'
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
  sizeGradeId?: string;
  hands?: string;
  weaponStyle?: string;
  traitIds: string[];
  damageValue?: number | null;
  damageDie?: string;
  damageTypeId?: string;
  distanceMeters?: number | null;
  reloadActions?: number | null;
  alternativeDamages: WeaponDamagePayload[];
  extraDamages: WeaponDamagePayload[];
  enchantments: WeaponEmbeddedEffectPayload[];
  enhancements: WeaponEmbeddedEffectPayload[];
}

export const WeaponCreateForm = ({ onSaved }: WeaponCreateFormProps) => {
  const selectedWeapon = useSelectedWeaponStore(
    (state) => state.selectedWeapon,
  );
  const isEditMode = !!selectedWeapon;

  const [traits, setTraits] = useState<IEntityReference[]>([]);

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const { data: sizeGradesData } = useSizeGradesQuery();
  const sizeGradeOptions = sizeGradesData ?? [];

  const { data: damageTypesData } = useDamageTypesQuery();
  const damageTypeOptions = damageTypesData ?? [];

  const {
    data: weaponDetail,
    isLoading: isWeaponDetailLoading,
    isError: isWeaponDetailError,
    error: weaponDetailError,
  } = useGetEntityById<IWeapon>({
    url: `/weapons/${selectedWeapon?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<WeaponFormData>({
    resolver: weaponFormResolver,
    defaultValues: weaponFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(weaponFormDefaultValues);
      setTraits([]);
      return;
    }

    if (!weaponDetail) {
      return;
    }

    reset({
      name: weaponDetail.name,
      nickname: weaponDetail.nickname ?? '',
      referenceImage: weaponDetail.referenceImage ?? '',
      description: weaponDetail.description ?? '',
      price: weaponDetail.price != null ? String(weaponDetail.price) : '',
      currencyId: weaponDetail.currency?.id ?? '',
      volume: weaponDetail.volume != null ? String(weaponDetail.volume) : '',
      sizeGradeId: weaponDetail.sizeGrade?.id ?? '',
      hands: weaponDetail.hands ?? '',
      weaponStyle: weaponDetail.weaponStyle ?? '',
      damageValue:
        weaponDetail.damageValue != null
          ? String(weaponDetail.damageValue)
          : '',
      damageDie: weaponDetail.damageDie ?? '',
      damageTypeId: weaponDetail.damageType?.id ?? '',
      magicalDamage: weaponDetail.magicalDamage,
      distanceMeters:
        weaponDetail.distanceMeters != null
          ? String(weaponDetail.distanceMeters)
          : '',
      usesAmmunition: weaponDetail.usesAmmunition,
      reloadActions:
        weaponDetail.reloadActions != null
          ? String(weaponDetail.reloadActions)
          : '',
      privateInformation: weaponDetail.privateInformation ?? '',
      tagIds: weaponDetail.tags?.map((tag) => tag.id) ?? [],
      alternativeDamages: (weaponDetail.alternativeDamages ?? []).map(
        (damage) => ({
          damageValue:
            damage.damageValue != null ? String(damage.damageValue) : '',
          damageDie: damage.damageDie ?? '',
          damageTypeId: damage.damageType?.id ?? '',
          magicalDamage: damage.magicalDamage,
          distanceMeters:
            damage.distanceMeters != null
              ? String(damage.distanceMeters)
              : '',
          usesAmmunition: damage.usesAmmunition,
          reloadActions:
            damage.reloadActions != null ? String(damage.reloadActions) : '',
        }),
      ),
      extraDamages: (weaponDetail.extraDamages ?? []).map((damage) => ({
        damageValue:
          damage.damageValue != null ? String(damage.damageValue) : '',
        damageDie: damage.damageDie ?? '',
        damageTypeId: damage.damageType?.id ?? '',
        magicalDamage: damage.magicalDamage,
        distanceMeters:
          damage.distanceMeters != null ? String(damage.distanceMeters) : '',
        usesAmmunition: damage.usesAmmunition,
        reloadActions:
          damage.reloadActions != null ? String(damage.reloadActions) : '',
      })),
      enchantments: (weaponDetail.enchantments ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
      enhancements: (weaponDetail.enhancements ?? []).map((item) => ({
        name: item.name,
        effect: item.effect ?? '',
      })),
    });

    setTraits(
      weaponDetail.traits?.map((trait) => ({
        id: trait.id,
        name: trait.name,
        entityType: 'trait',
        tags: trait.tags,
      })) ?? [],
    );
  }, [isEditMode, weaponDetail, reset]);

  useEffect(() => {
    if (!isWeaponDetailError) {
      return;
    }

    showToast({
      message:
        weaponDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da arma.',
      type: 'error',
    });
  }, [isWeaponDetailError, weaponDetailError]);

  const buildDamagePayload = (
    damages: WeaponFormData['alternativeDamages'],
  ): WeaponDamagePayload[] =>
    damages.map((damage) => ({
      damageValue: damage.damageValue ? Number(damage.damageValue) : null,
      damageDie: damage.damageDie || undefined,
      damageTypeId: damage.damageTypeId || undefined,
      magicalDamage: damage.magicalDamage,
      distanceMeters: damage.distanceMeters
        ? Number(damage.distanceMeters)
        : null,
      usesAmmunition: damage.usesAmmunition,
      reloadActions: damage.reloadActions
        ? Number(damage.reloadActions)
        : null,
    }));

  const buildEmbeddedEffectPayload = (
    items: WeaponFormData['enchantments'],
  ): WeaponEmbeddedEffectPayload[] =>
    items.map((item) => ({
      name: item.name,
      effect: item.effect || undefined,
    }));

  const buildPayload = (data: WeaponFormData): WeaponPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
    nickname: data.nickname || undefined,
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
    alternativeDamages: buildDamagePayload(data.alternativeDamages),
    extraDamages: buildDamagePayload(data.extraDamages),
    enchantments: buildEmbeddedEffectPayload(data.enchantments),
    enhancements: buildEmbeddedEffectPayload(data.enhancements),
  });

  const createWeaponMutation = usePostEntity<IWeapon, WeaponPayload>({
    url: '/weapons',
    invalidateQueryKeys: [['/weapons']],
    onSuccess: () => {
      showToast({
        message: 'Arma cadastrada com sucesso.',
        type: 'success',
      });
      reset(weaponFormDefaultValues);
      setTraits([]);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível cadastrar a arma.',
        type: 'error',
      });
    },
  });

  const updateWeaponMutation = usePutEntity<IWeapon, WeaponPayload>({
    url: `/weapons/${selectedWeapon?.id}`,
    invalidateQueryKeys: [['/weapons']],
    onSuccess: () => {
      showToast({
        message: 'Arma atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível atualizar a arma.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: WeaponFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateWeaponMutation.mutate(payload);
      return;
    }

    createWeaponMutation.mutate(payload);
  };

  const isPending =
    createWeaponMutation.isPending || updateWeaponMutation.isPending;

  if (isEditMode && isWeaponDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da arma...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="weapon-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="weapon-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="weapon-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<WeaponFormData, ITag>
          id="weapon-form-tags"
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
          id="weapon-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<WeaponFormData, ICurrency>
          id="weapon-form-currency"
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
          id="weapon-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />

        <FormAutocompleteInput<WeaponFormData, ISizeGrade>
          id="weapon-form-size-grade"
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
        <FormAutocompleteInput<
          WeaponFormData,
          (typeof WEAPON_HANDS_OPTIONS)[number]
        >
          id="weapon-form-hands"
          name="hands"
          control={control}
          label="Mãos"
          options={WEAPON_HANDS_OPTIONS}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          placeholder="Selecione a quantidade de mãos"
        />

        <FormAutocompleteInput<
          WeaponFormData,
          (typeof WEAPON_STYLE_OPTIONS)[number]
        >
          id="weapon-form-weapon-style"
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
            id="weapon-form-damage-value"
            name="damageValue"
            control={control}
            label="Valor"
            placeholder="Digite o valor de dano"
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
          />

          <FormAutocompleteInput<
            WeaponFormData,
            (typeof WEAPON_DAMAGE_DIE_OPTIONS)[number]
          >
            id="weapon-form-damage-die"
            name="damageDie"
            control={control}
            label="Dado"
            options={WEAPON_DAMAGE_DIE_OPTIONS}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            placeholder="Selecione o dado"
          />

          <FormAutocompleteInput<WeaponFormData, IDamageType>
            id="weapon-form-damage-type"
            name="damageTypeId"
            control={control}
            label="Tipo de dano"
            options={damageTypeOptions}
            getOptionLabel={(damageType) => damageType.name}
            getOptionValue={(damageType) => damageType.id}
            placeholder="Selecione o tipo de dano"
          />

          <FormCheckboxInput
            id="weapon-form-magical-damage"
            name="magicalDamage"
            control={control}
            label="Dano mágico"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="weapon-form-distance-meters"
          name="distanceMeters"
          control={control}
          label="Distância (Metros)"
          placeholder="Digite a distância"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />
        <FormTextInput
          id="weapon-form-reload-actions"
          name="reloadActions"
          control={control}
          label="Ações de Recarga"
          placeholder="Digite as ações de recarga"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />
        <FormCheckboxInput
          id="weapon-form-uses-ammunition"
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
          id="weapon-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva a arma"
        />
      </div>

      <FormRichTextInput
        id="weapon-form-private-information"
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
