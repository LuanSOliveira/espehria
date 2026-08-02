'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal } from '@/shared/components/Modals';
import { DefaultText } from '@/shared/components/Texts';
import { DefaultAutocompleteInput } from '@/shared/components/Inputs';
import { SecondaryButton } from '@/shared/components/Buttons';
import {
  useDeleteEntity,
  useGetEntityById,
  useGetEntityList,
  usePutEntity,
  useSheetCampaignOptionsQuery,
} from '@/hooks/Queries';
import {
  ICharacterRace,
  IRaceListFilters,
  IRaceListItem,
  ISheet,
  ISheetCampaignOption,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';
import { SheetPortraitImage } from './components/SheetPortraitImage';
import { SheetImageEditModal } from './components/SheetImageEditModal';
import { SheetNameField } from './components/SheetNameField';
import { SheetLevelField } from './components/SheetLevelField';
import { useFieldAutosave } from './hooks/useFieldAutosave';

interface SheetDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function SheetDetailsPage({ params }: SheetDetailsPageProps) {
  const { id: sheetId } = use(params);
  const router = useRouter();

  const {
    data: sheet,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ISheet>({ url: `/sheets/${sheetId}` });

  const isNotFound = error?.response?.status === 404;

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados da ficha.',
      type: 'error',
    });

    if (isNotFound) {
      router.push(APP_ROUTES.private.sheets);
    }
  }, [isError, isNotFound, error, router]);

  const [hasHydrated, setHasHydrated] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);
  const [campaign, setCampaign] = useState<ISheetCampaignOption | null>(null);
  const [race, setRace] = useState<ICharacterRace | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!sheet || hasHydrated) {
      return;
    }

    setName(sheet.name);
    setLevel(sheet.level);
    setCampaign(sheet.campaign ?? null);
    setRace(sheet.race ?? null);
    setReferenceImage(sheet.referenceImage ?? null);
    setHasHydrated(true);
  }, [sheet, hasHydrated]);

  const { data: campaignOptionsData } = useSheetCampaignOptionsQuery();
  const campaignOptions = campaignOptionsData ?? [];

  const { data: racesData } = useGetEntityList<IRaceListItem, IRaceListFilters>(
    {
      url: '/races',
      filters: { perPage: 100 },
    },
  );
  const raceOptions = racesData?.data ?? [];
  const selectedRaceOption =
    raceOptions.find((option) => option.id === race?.id) ?? null;

  const updateNameMutation = usePutEntity<ISheet, { name: string }>({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets']],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar o nome da ficha.',
        type: 'error',
      });
    },
  });

  const updateLevelMutation = usePutEntity<ISheet, { level: number }>({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets']],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar o nível da ficha.',
        type: 'error',
      });
    },
  });

  const updateCampaignMutation = usePutEntity<
    ISheet,
    { campaignId: string | null }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets']],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar a campanha da ficha.',
        type: 'error',
      });
    },
  });

  const updateRaceMutation = usePutEntity<ISheet, { raceId: string | null }>({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets']],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar a raça da ficha.',
        type: 'error',
      });
    },
  });

  const updateImageMutation = usePutEntity<
    ISheet,
    { referenceImage: string | null }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets']],
    onSuccess: (_data, payload) => {
      setReferenceImage(payload.referenceImage);
      showToast({
        message: 'Imagem da ficha atualizada com sucesso.',
        type: 'success',
      });
      setIsImageModalOpen(false);
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar a imagem da ficha.',
        type: 'error',
      });
    },
  });

  const deleteSheetMutation = useDeleteEntity({
    url: `/sheets/${sheetId}`,
    onSuccess: () => {
      showToast({ message: 'Ficha excluída com sucesso.', type: 'success' });
      router.push(APP_ROUTES.private.sheets);
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível excluir a ficha.',
        type: 'error',
      });
    },
  });

  useFieldAutosave({
    value: name,
    enabled: hasHydrated,
    onSave: (newName) => updateNameMutation.mutate({ name: newName }),
  });

  useFieldAutosave({
    value: level,
    enabled: hasHydrated,
    onSave: (newLevel) => updateLevelMutation.mutate({ level: newLevel }),
  });

  const campaignId = campaign?.id ?? null;
  useFieldAutosave({
    value: campaignId,
    enabled: hasHydrated,
    onSave: (newCampaignId) =>
      updateCampaignMutation.mutate({ campaignId: newCampaignId }),
  });

  const raceId = race?.id ?? null;
  useFieldAutosave({
    value: raceId,
    enabled: hasHydrated,
    onSave: (newRaceId) => updateRaceMutation.mutate({ raceId: newRaceId }),
  });

  const handleImageSave = (url: string) => {
    updateImageMutation.mutate({ referenceImage: url || null });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-6">
          <CircularProgress size={28} />
          <DefaultText>Carregando dados da ficha...</DefaultText>
        </div>
      </PageContainer>
    );
  }

  if (isError && !isNotFound) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-10">
          <FiAlertTriangle
            style={{ fontSize: 40, color: APP_COLORS.goldSoft }}
          />
          <DefaultText sx={{ textAlign: 'center' }}>
            Não foi possível carregar os dados da ficha.
          </DefaultText>
          <SecondaryButton
            onClick={() => router.push(APP_ROUTES.private.sheets)}
          >
            Voltar para Fichas
          </SecondaryButton>
        </div>
      </PageContainer>
    );
  }

  if (!sheet) {
    return null;
  }

  return (
    <PageContainer>
      <div className="flex justify-end">
        <SecondaryButton
          type="button"
          icon={<FiTrash2 />}
          onClick={() => setIsDeleteModalOpen(true)}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Excluir ficha
        </SecondaryButton>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <SheetPortraitImage
          imageUrl={referenceImage}
          alt={name || sheet.name}
          onEditClick={() => setIsImageModalOpen(true)}
        />

        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <SheetNameField value={name} onChange={setName} />
          </div>
          <div className="w-full sm:w-32">
            <SheetLevelField value={level} onChange={setLevel} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <DefaultAutocompleteInput<ISheetCampaignOption>
          id="sheet-campaign"
          label="Campanha"
          options={campaignOptions}
          getOptionLabel={(option) => option.name}
          value={campaign}
          onChange={setCampaign}
          placeholder="Selecione a campanha"
        />

        <DefaultAutocompleteInput<IRaceListItem>
          id="sheet-race"
          label="Raça"
          options={raceOptions}
          getOptionLabel={(option) => option.name}
          value={selectedRaceOption}
          onChange={(newRace) =>
            setRace(newRace ? { id: newRace.id, name: newRace.name } : null)
          }
          placeholder="Selecione a raça"
        />
      </div>

      <SheetImageEditModal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        currentImageUrl={referenceImage}
        onSave={handleImageSave}
        isSaving={updateImageMutation.isPending}
      />

      <ConfirmationModal
        open={isDeleteModalOpen}
        title="Excluir ficha"
        message={`Tem certeza que deseja excluir a ficha "${sheet.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteSheetMutation.isPending}
        onConfirm={() => deleteSheetMutation.mutate()}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </PageContainer>
  );
}
