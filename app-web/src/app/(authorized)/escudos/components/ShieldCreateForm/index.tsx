'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import {
  DefaultTextInput,
  FormAutocompleteInput,
  FormMultiAutocompleteInput,
  FormRichTextInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  useCurrenciesQuery,
  useGetEntityById,
  usePostEntity,
  usePutEntity,
  useTagOptionsQuery,
} from '@/hooks/Queries';
import {
  ShieldFormData,
  shieldFormDefaultValues,
  shieldFormResolver,
} from '@/shared/formSchemas';
import { ICurrency, IShield, ITag } from '@/shared/interfaces';
import { formatTagLabel, showToast } from '@/shared/util';
import { useSelectedShieldStore } from '@/store';

export interface ShieldCreateFormProps {
  onSaved: () => void;
}

interface ShieldPayload
  extends Omit<
    ShieldFormData,
    | 'referenceImage'
    | 'description'
    | 'price'
    | 'currencyId'
    | 'privateInformation'
    | 'nickname'
    | 'volume'
    | 'armorClassBonus'
    | 'speedPenaltyMeters'
    | 'hardness'
    | 'hitPoints'
  > {
  referenceImage?: string;
  description?: string;
  price?: number | null;
  currencyId?: string;
  privateInformation?: string;
  nickname?: string;
  volume?: number | null;
  armorClassBonus?: number | null;
  speedPenaltyMeters?: number | null;
  hardness?: number | null;
  hitPoints?: number | null;
}

export const ShieldCreateForm = ({ onSaved }: ShieldCreateFormProps) => {
  const selectedShield = useSelectedShieldStore((state) => state.selectedShield);
  const isEditMode = !!selectedShield;

  const { tagOptions } = useTagOptionsQuery();

  const { data: currenciesData } = useCurrenciesQuery();
  const currencyOptions = currenciesData ?? [];

  const {
    data: shieldDetail,
    isLoading: isShieldDetailLoading,
    isError: isShieldDetailError,
    error: shieldDetailError,
  } = useGetEntityById<IShield>({
    url: `/shields/${selectedShield?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset, watch } = useForm<ShieldFormData>({
    resolver: shieldFormResolver,
    defaultValues: shieldFormDefaultValues,
  });

  const hitPointsValue = watch('hitPoints');
  const breakThresholdValue = hitPointsValue
    ? Math.floor(Number(hitPointsValue) / 2)
    : 0;

  useEffect(() => {
    if (!isEditMode) {
      reset(shieldFormDefaultValues);
      return;
    }

    if (!shieldDetail) {
      return;
    }

    reset({
      name: shieldDetail.name,
      nickname: shieldDetail.nickname ?? '',
      referenceImage: shieldDetail.referenceImage ?? '',
      description: shieldDetail.description ?? '',
      price: shieldDetail.price != null ? String(shieldDetail.price) : '',
      currencyId: shieldDetail.currency?.id ?? '',
      volume: shieldDetail.volume != null ? String(shieldDetail.volume) : '',
      armorClassBonus:
        shieldDetail.armorClassBonus != null
          ? String(shieldDetail.armorClassBonus)
          : '',
      speedPenaltyMeters:
        shieldDetail.speedPenaltyMeters != null
          ? String(shieldDetail.speedPenaltyMeters)
          : '',
      hardness:
        shieldDetail.hardness != null ? String(shieldDetail.hardness) : '',
      hitPoints:
        shieldDetail.hitPoints != null ? String(shieldDetail.hitPoints) : '',
      privateInformation: shieldDetail.privateInformation ?? '',
      tagIds: shieldDetail.tags?.map((tag) => tag.id) ?? [],
    });
  }, [isEditMode, shieldDetail, reset]);

  useEffect(() => {
    if (!isShieldDetailError) {
      return;
    }

    showToast({
      message:
        shieldDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados do escudo.',
      type: 'error',
    });
  }, [isShieldDetailError, shieldDetailError]);

  const buildPayload = (data: ShieldFormData): ShieldPayload => ({
    ...data,
    referenceImage: data.referenceImage || undefined,
    description: data.description || undefined,
    price: data.price ? Number(data.price) : null,
    currencyId: data.currencyId || undefined,
    privateInformation: data.privateInformation || undefined,
    tagIds: data.tagIds ?? [],
    nickname: data.nickname || undefined,
    volume: data.volume ? Number(data.volume) : null,
    armorClassBonus: data.armorClassBonus ? Number(data.armorClassBonus) : null,
    speedPenaltyMeters: data.speedPenaltyMeters
      ? Number(data.speedPenaltyMeters)
      : null,
    hardness: data.hardness ? Number(data.hardness) : null,
    hitPoints: data.hitPoints ? Number(data.hitPoints) : null,
  });

  const createShieldMutation = usePostEntity<IShield, ShieldPayload>({
    url: '/shields',
    invalidateQueryKeys: [['/shields']],
    onSuccess: () => {
      showToast({
        message: 'Escudo cadastrado com sucesso.',
        type: 'success',
      });
      reset(shieldFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar o escudo.',
        type: 'error',
      });
    },
  });

  const updateShieldMutation = usePutEntity<IShield, ShieldPayload>({
    url: `/shields/${selectedShield?.id}`,
    invalidateQueryKeys: [['/shields']],
    onSuccess: () => {
      showToast({
        message: 'Escudo atualizado com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar o escudo.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ShieldFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateShieldMutation.mutate(payload);
      return;
    }

    createShieldMutation.mutate(payload);
  };

  const isPending =
    createShieldMutation.isPending || updateShieldMutation.isPending;

  if (isEditMode && isShieldDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do escudo...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="shield-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />

        <FormTextInput
          id="shield-form-nickname"
          name="nickname"
          control={control}
          label="Apelido"
          placeholder="Digite o apelido"
        />

        <FormTextInput
          id="shield-form-reference-image"
          name="referenceImage"
          control={control}
          label="Imagem Referência"
          placeholder="https://exemplo.com/imagem.jpg"
        />

        <FormMultiAutocompleteInput<ShieldFormData, ITag>
          id="shield-form-tags"
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
          id="shield-form-price"
          name="price"
          control={control}
          label="Preço"
          placeholder="Digite o preço"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormAutocompleteInput<ShieldFormData, ICurrency>
          id="shield-form-currency"
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
          id="shield-form-volume"
          name="volume"
          control={control}
          label="Volume"
          placeholder="Digite o volume"
          type="number"
          slotProps={{
            htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextInput
          id="shield-form-armor-class-bonus"
          name="armorClassBonus"
          control={control}
          label="Bônus de CA"
          placeholder="Digite o bônus de CA"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="shield-form-speed-penalty-meters"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormTextInput
          id="shield-form-hardness"
          name="hardness"
          control={control}
          label="Dureza"
          placeholder="Digite a dureza"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <FormTextInput
          id="shield-form-hit-points"
          name="hitPoints"
          control={control}
          label="Pontos de Vida"
          placeholder="Digite os pontos de vida"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
        />

        <DefaultTextInput
          id="shield-form-break-threshold"
          label="Limiar de Quebra"
          value={breakThresholdValue}
          disabled
          type="number"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormRichTextInput
          id="shield-form-description"
          name="description"
          control={control}
          label="Descrição"
          placeholder="Descreva o escudo"
        />
      </div>

      <FormRichTextInput
        id="shield-form-private-information"
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
