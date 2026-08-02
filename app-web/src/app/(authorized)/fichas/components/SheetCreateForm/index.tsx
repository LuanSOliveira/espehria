'use client';

import { useForm } from 'react-hook-form';
import {
  FormAutocompleteInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { usePostEntity, useSheetCampaignOptionsQuery } from '@/hooks/Queries';
import {
  SheetFormData,
  sheetFormDefaultValues,
  sheetFormResolver,
} from '@/shared/formSchemas';
import { ISheet, ISheetCampaignOption } from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface SheetCreateFormProps {
  onSaved: () => void;
}

interface SheetPayload
  extends Omit<SheetFormData, 'campaignId' | 'referenceImage'> {
  campaignId?: string;
  referenceImage?: string;
}

export const SheetCreateForm = ({ onSaved }: SheetCreateFormProps) => {
  const { data: campaignOptionsData } = useSheetCampaignOptionsQuery();
  const campaignOptions = campaignOptionsData ?? [];

  const { control, handleSubmit, reset } = useForm<SheetFormData>({
    resolver: sheetFormResolver,
    defaultValues: sheetFormDefaultValues,
  });

  const buildPayload = (data: SheetFormData): SheetPayload => ({
    ...data,
    campaignId: data.campaignId || undefined,
    referenceImage: data.referenceImage || undefined,
  });

  const createSheetMutation = usePostEntity<ISheet, SheetPayload>({
    url: '/sheets',
    invalidateQueryKeys: [['/sheets']],
    onSuccess: () => {
      showToast({
        message: 'Ficha cadastrada com sucesso.',
        type: 'success',
      });
      reset(sheetFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a ficha.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: SheetFormData) => {
    createSheetMutation.mutate(buildPayload(data));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormTextInput
        id="sheet-form-name"
        name="name"
        control={control}
        label="Nome"
        placeholder="Digite o nome"
      />

      <FormAutocompleteInput<SheetFormData, ISheetCampaignOption>
        id="sheet-form-campaign"
        name="campaignId"
        control={control}
        label="Campanha"
        options={campaignOptions}
        getOptionLabel={(campaign) => campaign.name}
        getOptionValue={(campaign) => campaign.id}
        placeholder="Selecione a campanha"
      />

      <FormTextInput
        id="sheet-form-reference-image"
        name="referenceImage"
        control={control}
        label="Imagem Referência"
        placeholder="https://exemplo.com/imagem.jpg"
      />

      <PrimaryButton
        type="submit"
        isLoading={createSheetMutation.isPending}
        sx={{ marginTop: '8px' }}
      >
        Cadastrar
      </PrimaryButton>
    </form>
  );
};
