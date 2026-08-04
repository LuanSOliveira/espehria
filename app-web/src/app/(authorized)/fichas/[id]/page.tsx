'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Tab, Tabs } from '@mui/material';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { DefaultText } from '@/shared/components/Texts';
import { SecondaryButton } from '@/shared/components/Buttons';
import {
  useDeleteEntity,
  useGetEntityById,
  useGetEntityList,
  useImprovementDefectPropertiesQuery,
  useImprovementDefectTypesQuery,
  usePutEntity,
  useSheetCampaignOptionsQuery,
} from '@/hooks/Queries';
import {
  IBiographyListItem,
  IRaceListFilters,
  IRaceListItem,
  ISheet,
  ISheetCampaignOption,
  ISheetImprovementDefectSnapshot,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';
import { SheetPortraitImage } from './components/SheetPortraitImage';
import { SheetImageEditModal } from './components/SheetImageEditModal';
import { SheetNameField } from './components/SheetNameField';
import { SheetLevelField } from './components/SheetLevelField';
import { SheetCampaignField } from './components/SheetCampaignField';
import { SheetRaceField } from './components/SheetRaceField';
import { SheetBiographyField } from './components/SheetBiographyField';
import {
  SheetBiographyAssignInitialValue,
  SheetBiographyAssignPayload,
} from './components/SheetBiographyAssignModal';
import { SheetAttributesPanel } from './components/SheetAttributesPanel';
import { SheetAttributesDetailModal } from './components/SheetAttributesDetailModal';
import { SheetImprovementDefectCategoryAccordions } from './components/SheetImprovementDefectCategoryAccordions';
import { useFieldAutosave } from './hooks/useFieldAutosave';
import {
  SHEET_ATTRIBUTE_PROPERTY_ORDER,
  SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  SHEET_IMPROVEMENT_DEFECT_CATEGORIES,
} from './data';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const ATTRIBUTE_BASE_VALUE = 10;

type SheetDetailTab = 'estatisticas' | 'melhorias' | 'defeitos';

interface SheetDetailsPageProps {
  params: Promise<{ id: string }>;
}

const flattenSnapshot = (snapshot: ISheetImprovementDefectSnapshot) => [
  ...snapshot.race,
  ...snapshot.biography,
  ...snapshot.trainings,
  ...snapshot.talents,
  ...snapshot.characteristics,
];

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
  const [race, setRace] = useState<IRaceListItem | null>(null);
  const [biography, setBiography] = useState<IBiographyListItem | null>(null);
  const [melhorias, setMelhorias] = useState<ISheetImprovementDefectSnapshot>(
    SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  );
  const [defeitos, setDefeitos] = useState<ISheetImprovementDefectSnapshot>(
    SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  );
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetDetailTab>('estatisticas');
  const [isAttributesDetailOpen, setIsAttributesDetailOpen] = useState(false);

  useEffect(() => {
    if (!sheet || hasHydrated) {
      return;
    }

    setName(sheet.name);
    setLevel(sheet.level);
    setCampaign(sheet.campaign ?? null);
    setRace(sheet.race ?? null);
    setBiography(sheet.biography ?? null);
    setMelhorias(sheet.melhorias);
    setDefeitos(sheet.defeitos);
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

  const { data: improvementDefectTypes } = useImprovementDefectTypesQuery();
  const attributeType = improvementDefectTypes?.find(
    (type) => type.name === ATTRIBUTE_TYPE_NAME,
  );

  const { data: improvementDefectProperties } =
    useImprovementDefectPropertiesQuery();
  const attributeProperties = useMemo(() => {
    const filtered = (improvementDefectProperties ?? []).filter(
      (property) =>
        attributeType && property.typeIds.includes(attributeType.id),
    );

    return [...filtered].sort(
      (a, b) =>
        SHEET_ATTRIBUTE_PROPERTY_ORDER.indexOf(
          a.name as (typeof SHEET_ATTRIBUTE_PROPERTY_ORDER)[number],
        ) -
        SHEET_ATTRIBUTE_PROPERTY_ORDER.indexOf(
          b.name as (typeof SHEET_ATTRIBUTE_PROPERTY_ORDER)[number],
        ),
    );
  }, [improvementDefectProperties, attributeType]);

  const attributes = useMemo(() => {
    const melhoriasEntries = flattenSnapshot(melhorias);
    const defeitosEntries = flattenSnapshot(defeitos);

    return attributeProperties.map((property) => {
      const improvementSum = melhoriasEntries
        .filter(
          (entry) =>
            attributeType &&
            entry.type.id === attributeType.id &&
            entry.property.id === property.id,
        )
        .reduce((sum, entry) => sum + entry.value, 0);

      const flawSum = defeitosEntries
        .filter(
          (entry) =>
            attributeType &&
            entry.type.id === attributeType.id &&
            entry.property.id === property.id,
        )
        .reduce((sum, entry) => sum + entry.value, 0);

      const value = ATTRIBUTE_BASE_VALUE + improvementSum - flawSum;

      return {
        id: property.id,
        label: property.name,
        value,
        modifier: Math.floor((value - 10) / 2),
      };
    });
  }, [attributeProperties, attributeType, melhorias, defeitos]);

  const attributesDetailGroups = useMemo(
    () =>
      SHEET_IMPROVEMENT_DEFECT_CATEGORIES.map((category) => ({
        key: category.key,
        label: category.label,
        improvements: melhorias[category.key].filter(
          (entry) => attributeType && entry.type.id === attributeType.id,
        ),
        flaws: defeitos[category.key].filter(
          (entry) => attributeType && entry.type.id === attributeType.id,
        ),
      })),
    [melhorias, defeitos, attributeType],
  );

  const biographyAssignInitialValue: SheetBiographyAssignInitialValue | null =
    useMemo(() => {
      if (!biography) {
        return null;
      }

      const selectedEntry = melhorias.biography.find(
        (entry) => entry.id !== null,
      );
      const freeEntry = melhorias.biography.find((entry) => entry.id === null);

      if (!selectedEntry || !freeEntry) {
        return null;
      }

      return {
        biography,
        selectedImprovementId: selectedEntry.id as string,
        freeImprovementPropertyId: freeEntry.property.id,
      };
    }, [biography, melhorias]);

  const updateNameMutation = usePutEntity<ISheet, { name: string }>({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar a campanha da ficha.',
        type: 'error',
      });
    },
  });

  const updateImageMutation = usePutEntity<
    ISheet,
    { referenceImage: string | null }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
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

  const linkRaceMutation = usePutEntity<ISheet, { raceId: string }>({
    url: `/sheets/${sheetId}/race`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onSuccess: (data) => {
      setRace(data.race ?? null);
      setMelhorias(data.melhorias);
      setDefeitos(data.defeitos);
      showToast({ message: 'Raça vinculada com sucesso.', type: 'success' });
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível vincular a raça.',
        type: 'error',
      });
    },
  });

  const unlinkRaceMutation = useDeleteEntity<ISheet>({
    url: `/sheets/${sheetId}/race`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onSuccess: (data) => {
      setRace(null);
      setMelhorias(data.melhorias);
      setDefeitos(data.defeitos);
      showToast({ message: 'Raça removida com sucesso.', type: 'success' });
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível remover a raça.',
        type: 'error',
      });
    },
  });

  const linkBiographyMutation = usePutEntity<
    ISheet,
    SheetBiographyAssignPayload
  >({
    url: `/sheets/${sheetId}/biography`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onSuccess: (data) => {
      setBiography(data.biography ?? null);
      setMelhorias(data.melhorias);
      setDefeitos(data.defeitos);
      showToast({
        message: 'Biografia vinculada com sucesso.',
        type: 'success',
      });
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível vincular a biografia.',
        type: 'error',
      });
    },
  });

  const unlinkBiographyMutation = useDeleteEntity<ISheet>({
    url: `/sheets/${sheetId}/biography`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onSuccess: (data) => {
      setBiography(null);
      setMelhorias(data.melhorias);
      setDefeitos(data.defeitos);
      showToast({
        message: 'Biografia removida com sucesso.',
        type: 'success',
      });
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível remover a biografia.',
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
      <div className="flex justify-start">
        <SecondaryButton
          type="button"
          icon={<FiArrowLeft />}
          onClick={() => router.push(APP_ROUTES.private.sheets)}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Voltar
        </SecondaryButton>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <SheetPortraitImage
          imageUrl={referenceImage}
          alt={name || sheet.name}
          onEditClick={() => setIsImageModalOpen(true)}
        />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <SheetNameField value={name} onChange={setName} />
            </div>
            <div className="w-full sm:w-32">
              <SheetLevelField value={level} onChange={setLevel} />
            </div>
          </div>

          <SheetCampaignField
            value={campaign}
            onChange={setCampaign}
            options={campaignOptions}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SheetRaceField
              value={race}
              options={raceOptions}
              onAssign={(raceId) => linkRaceMutation.mutate({ raceId })}
              onRemove={() => unlinkRaceMutation.mutate()}
              isSaving={linkRaceMutation.isPending}
              isRemoving={unlinkRaceMutation.isPending}
            />

            <SheetBiographyField
              value={biography}
              initialAssignValue={biographyAssignInitialValue}
              onAssign={(payload) => linkBiographyMutation.mutate(payload)}
              onRemove={() => unlinkBiographyMutation.mutate()}
              isSaving={linkBiographyMutation.isPending}
              isRemoving={unlinkBiographyMutation.isPending}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          value={activeTab}
          onChange={(_event, newValue: SheetDetailTab) =>
            setActiveTab(newValue)
          }
          sx={{
            borderBottom: `1px solid ${APP_COLORS.gold}`,
            '& .MuiTab-root': { color: APP_COLORS.textBrownDark },
            '& .Mui-selected': { color: `${APP_COLORS.goldDark} !important` },
            '& .MuiTabs-indicator': { backgroundColor: APP_COLORS.goldDark },
          }}
        >
          <Tab value="estatisticas" label="Estatísticas" />
          <Tab value="melhorias" label="Melhorias" />
          <Tab value="defeitos" label="Defeitos" />
        </Tabs>

        <div className="mt-4">
          {activeTab === 'estatisticas' && (
            <SheetAttributesPanel
              attributes={attributes}
              onOpenDetails={() => setIsAttributesDetailOpen(true)}
            />
          )}

          {activeTab === 'melhorias' && (
            <SheetImprovementDefectCategoryAccordions items={melhorias} />
          )}

          {activeTab === 'defeitos' && (
            <SheetImprovementDefectCategoryAccordions items={defeitos} />
          )}
        </div>
      </div>

      <SheetAttributesDetailModal
        open={isAttributesDetailOpen}
        onClose={() => setIsAttributesDetailOpen(false)}
        groups={attributesDetailGroups}
      />

      <SheetImageEditModal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        currentImageUrl={referenceImage}
        onSave={handleImageSave}
        isSaving={updateImageMutation.isPending}
      />
    </PageContainer>
  );
}
