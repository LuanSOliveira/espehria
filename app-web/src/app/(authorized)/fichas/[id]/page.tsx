'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Tab, Tabs } from '@mui/material';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { DefaultText } from '@/shared/components/Texts';
import { SecondaryButton } from '@/shared/components/Buttons';
import {
  useAttributesQuery,
  useDeleteEntity,
  useGetEntityById,
  useGetEntityList,
  useImprovementDefectPropertiesQuery,
  useImprovementDefectTypesQuery,
  useProficiencyGradationsQuery,
  useProficiencyPropertiesQuery,
  usePutEntity,
  useResolveProficiencyAdjustmentMutation,
  useSheetCampaignOptionsQuery,
  useUpdateSheetKnowledgeNoteMutation,
} from '@/hooks/Queries';
import {
  IAttribute,
  IProficiencyProperty,
  ISheet,
  ISheetBiography,
  ISheetCampaignOption,
  ISheetImprovementDefectSnapshot,
  ISheetKnowledgeSnapshot,
  ISheetProficiencySnapshot,
  ISheetProficiencyAdjustmentEntry,
  ISheetRace,
  ISkillListFilters,
  ISkillListItem,
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
import { SheetProficienciesGrid } from './components/SheetProficienciesGrid';
import { SheetAdjustedProficienciesSection } from './components/SheetAdjustedProficienciesSection';
import { SheetKnowledgesPanel } from './components/SheetKnowledgesPanel';
import { SheetSkillsPanel } from './components/SheetSkillsPanel';
import { SheetArmorClassPanel } from './components/SheetArmorClassPanel';
import { SheetSavingThrowsPanel } from './components/SheetSavingThrowsPanel';
import { SheetHitPointsPanel } from './components/SheetHitPointsPanel';
import {
  SheetBonusDetail,
  SheetBonusDetailModal,
} from './components/SheetBonusDetailModal';
import { SheetCharacteristicsPanel } from './components/SheetCharacteristicsPanel';
import { SheetTrainingsPanel } from './components/SheetTrainingsPanel';
import { SheetTalentsPanel } from './components/SheetTalentsPanel';
import { useFieldAutosave } from './hooks/useFieldAutosave';
import {
  SheetSkillModifierResult,
  useSheetSkillModifiers,
} from './hooks/useSheetSkillModifiers';
import { useSheetKnowledgeModifiers } from './hooks/useSheetKnowledgeModifiers';
import { useSheetSavingThrowModifiers } from './hooks/useSheetSavingThrowModifiers';
import { useSheetAbilities } from './hooks/useSheetAbilities';
import {
  SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  SHEET_EMPTY_KNOWLEDGE_SNAPSHOT,
  SHEET_EMPTY_PROFICIENCY_SNAPSHOT,
  SHEET_HIT_POINTS_KEY_ATTRIBUTE_NAME,
  SHEET_IMPROVEMENT_DEFECT_CATEGORIES,
  flattenKnowledgeSnapshot,
  flattenProficiencySnapshot,
  sortByAttributeOrder,
} from './data';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const ATTRIBUTE_BASE_VALUE = 10;
const ARMOR_CLASS_BASE_VALUE = 10;

const SHEET_TABS_SX = {
  borderBottom: `1px solid ${APP_COLORS.gold}`,
  '& .MuiTab-root': { color: APP_COLORS.textBrownDark },
  '& .Mui-selected': { color: `${APP_COLORS.goldDark} !important` },
  '& .MuiTabs-indicator': { backgroundColor: APP_COLORS.goldDark },
};

type SheetDetailTab = 'estatisticas' | 'bonus' | 'habilidades';
type SheetBonusSubTab = 'melhorias' | 'defeitos' | 'proficiencias';
type SheetAbilitiesSubTab = 'caracteristicas' | 'treinamentos' | 'talentos';

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
  const [race, setRace] = useState<ISheetRace | null>(null);
  const [biography, setBiography] = useState<ISheetBiography | null>(null);
  const [currentHitPoints, setCurrentHitPoints] = useState<number | null>(
    null,
  );
  const [temporaryHitPoints, setTemporaryHitPoints] = useState<number | null>(
    null,
  );
  const [melhorias, setMelhorias] = useState<ISheetImprovementDefectSnapshot>(
    SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  );
  const [defeitos, setDefeitos] = useState<ISheetImprovementDefectSnapshot>(
    SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT,
  );
  const [proficiencias, setProficiencias] = useState<ISheetProficiencySnapshot>(
    SHEET_EMPTY_PROFICIENCY_SNAPSHOT,
  );
  const [proficienciasAjustadas, setProficienciasAjustadas] = useState<
    ISheetProficiencyAdjustmentEntry[]
  >([]);
  const [saberes, setSaberes] = useState<ISheetKnowledgeSnapshot>(
    SHEET_EMPTY_KNOWLEDGE_SNAPSHOT,
  );
  const [armorClassKeyAttribute, setArmorClassKeyAttribute] =
    useState<IAttribute | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetDetailTab>('estatisticas');
  const [activeBonusSubTab, setActiveBonusSubTab] =
    useState<SheetBonusSubTab>('melhorias');
  const [activeAbilitiesSubTab, setActiveAbilitiesSubTab] =
    useState<SheetAbilitiesSubTab>('caracteristicas');
  const [isAttributesDetailOpen, setIsAttributesDetailOpen] = useState(false);
  const [skillPendingBonusDetail, setSkillPendingBonusDetail] =
    useState<SheetSkillModifierResult | null>(null);
  const [knowledgePendingBonusDetail, setKnowledgePendingBonusDetail] =
    useState<SheetBonusDetail | null>(null);
  const [isArmorClassDetailOpen, setIsArmorClassDetailOpen] = useState(false);
  const [savingThrowPendingBonusDetail, setSavingThrowPendingBonusDetail] =
    useState<SheetSkillModifierResult | null>(null);
  const [isHitPointsDetailOpen, setIsHitPointsDetailOpen] = useState(false);

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
    setProficiencias(sheet.proficiencias);
    setProficienciasAjustadas(sheet.proficienciasAjustadas);
    setSaberes(sheet.saberes);
    setArmorClassKeyAttribute(sheet.armorClassKeyAttribute ?? null);
    setReferenceImage(sheet.referenceImage ?? null);
    setCurrentHitPoints(sheet.currentHitPoints ?? null);
    setTemporaryHitPoints(sheet.temporaryHitPoints ?? null);
    setHasHydrated(true);
  }, [sheet, hasHydrated]);

  /**
   * Aplica os 5 snapshots derivados comuns a toda mutação que recalcula a
   * ficha (`melhorias`, `defeitos`, `proficiencias`, `proficienciasAjustadas`,
   * `saberes`) a partir de um `ISheet` recalculado — reaproveitado pelas
   * mutações de Raça/Biografia já existentes, pelas 8 mutações de Habilidades
   * (via `useSheetAbilities`) e por `updateLevelMutation`. `abilities` não faz
   * parte de `ISheet` (ver `useSheetAbilities`), por isso não está aqui.
   */
  const applySheetSnapshots = (data: ISheet) => {
    setMelhorias(data.melhorias);
    setDefeitos(data.defeitos);
    setProficiencias(data.proficiencias);
    setProficienciasAjustadas(data.proficienciasAjustadas);
    setSaberes(data.saberes);
  };

  const abilitiesQueryKey = [`/sheets/${sheetId}/abilities`];

  const {
    abilities,
    isLoadingAbilities,
    addCharacteristicExtraMutation,
    removeCharacteristicExtraMutation,
    addTalentExtraMutation,
    removeTalentExtraMutation,
    addTrainingExtraMutation,
    removeTrainingExtraMutation,
    fillTrainingSlotMutation,
    emptyTrainingSlotMutation,
    refetchAbilitiesAfterLevelChange,
  } = useSheetAbilities({ sheetId, applySheetSnapshots });

  const { data: campaignOptionsData } = useSheetCampaignOptionsQuery();
  const campaignOptions = campaignOptionsData ?? [];

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

    return [...filtered].sort(sortByAttributeOrder);
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

  const { data: skillsData } = useGetEntityList<ISkillListItem, ISkillListFilters>({
    url: '/skills',
    filters: { page: 1, perPage: 100 },
  });
  const skills = skillsData?.data ?? [];

  const { data: proficiencyGradations } = useProficiencyGradationsQuery();

  const skillModifiers = useSheetSkillModifiers({
    skills,
    attributes,
    proficiencias,
    proficienciasAjustadas,
    gradations: proficiencyGradations ?? [],
  });

  const knowledgeModifiers = useSheetKnowledgeModifiers({
    entries: flattenKnowledgeSnapshot(saberes),
    attributes,
    gradations: proficiencyGradations ?? [],
  });

  const savingThrowModifiers = useSheetSavingThrowModifiers({
    attributes,
    proficiencias,
    proficienciasAjustadas,
    gradations: proficiencyGradations ?? [],
  });

  const { data: attributesData } = useAttributesQuery();
  const armorClassKeyAttributeOptions = useMemo(
    () => [...(attributesData ?? [])].sort(sortByAttributeOrder),
    [attributesData],
  );

  const armorClassMatchedAttribute = useMemo(
    () =>
      attributes.find(
        (attribute) =>
          armorClassKeyAttribute &&
          attribute.label.trim().toLowerCase() ===
            armorClassKeyAttribute.name.trim().toLowerCase(),
      ),
    [attributes, armorClassKeyAttribute],
  );

  const armorClassAttributeModifier = armorClassMatchedAttribute?.modifier ?? 0;
  const armorClassTotal = ARMOR_CLASS_BASE_VALUE + armorClassAttributeModifier;
  const armorClassBreakdown = [
    { label: armorClassKeyAttribute?.name ?? '', value: armorClassAttributeModifier },
  ];

  const hitPointsMatchedAttribute = useMemo(
    () =>
      attributes.find(
        (attribute) =>
          attribute.label.trim().toLowerCase() ===
          SHEET_HIT_POINTS_KEY_ATTRIBUTE_NAME.trim().toLowerCase(),
      ),
    [attributes],
  );
  const hitPointsAttributeModifier = hitPointsMatchedAttribute?.modifier ?? 0;

  const raceHitPointsBonus = race?.hitPoints ?? 0;
  const maxHitPoints = (raceHitPointsBonus + hitPointsAttributeModifier) * level;
  const maxHitPointsBreakdown = [
    ...(race
      ? [{ label: `${race.name} x ${level} level`, value: race.hitPoints }]
      : []),
    {
      label: `${SHEET_HIT_POINTS_KEY_ATTRIBUTE_NAME} x ${level} level`,
      value: hitPointsAttributeModifier,
    },
  ];

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
        (entry) =>
          attributeType &&
          entry.type.id === attributeType.id &&
          entry.id !== null,
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
    }, [biography, melhorias, attributeType]);

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
    onSuccess: (data) => {
      /**
       * Reduzir o level da ficha pode remover slots de Treinamento (e
       * desvincular o Treinamento que estivesse neles), recalculando
       * melhorias/defeitos/proficiências/saberes — o `level` local não é
       * sobrescrito (já é a fonte de verdade via input controlado), só os
       * snapshots derivados. `GET /sheets/:id` não devolve `abilities`
       * (contrato real, ver `useSheetAbilities`), então a listagem de slots é
       * atualizada com um refetch dedicado do endpoint de habilidades.
       */
      applySheetSnapshots(data);
      refetchAbilitiesAfterLevelChange();
    },
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

  const updateArmorClassKeyAttributeMutation = usePutEntity<
    ISheet,
    { armorClassKeyAttributeId: string }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar o atributo-chave da Classe de Armadura.',
        type: 'error',
      });
    },
  });

  const updateCurrentHitPointsMutation = usePutEntity<
    ISheet,
    { currentHitPoints: number | null }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar o PV atual da ficha.',
        type: 'error',
      });
    },
  });

  const updateTemporaryHitPointsMutation = usePutEntity<
    ISheet,
    { temporaryHitPoints: number | null }
  >({
    url: `/sheets/${sheetId}`,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar o PV temporário da ficha.',
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`], abilitiesQueryKey],
    onSuccess: (data) => {
      setRace(data.race ?? null);
      applySheetSnapshots(data);
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`], abilitiesQueryKey],
    onSuccess: (data) => {
      setRace(null);
      applySheetSnapshots(data);
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`], abilitiesQueryKey],
    onSuccess: (data) => {
      setBiography(data.biography ?? null);
      applySheetSnapshots(data);
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
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`], abilitiesQueryKey],
    onSuccess: (data) => {
      setBiography(null);
      applySheetSnapshots(data);
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

  const resolveProficiencyAdjustmentMutation =
    useResolveProficiencyAdjustmentMutation({
      sheetId,
      invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
      onSuccess: (data) => {
        setProficiencias(data.proficiencias);
        setProficienciasAjustadas(data.proficienciasAjustadas);
        showToast({
          message: 'Proficiência ajustada com sucesso.',
          type: 'success',
        });
      },
      onError: (mutationError) => {
        showToast({
          message:
            mutationError.response?.data?.message ??
            'Não foi possível ajustar a proficiência.',
          type: 'error',
        });
      },
    });

  const handleSelectProficiencySubstitute = (
    adjustmentId: string,
    propertyId: string,
  ) => {
    resolveProficiencyAdjustmentMutation.mutate({ adjustmentId, propertyId });
  };

  const updateKnowledgeNoteMutation = useUpdateSheetKnowledgeNoteMutation({
    sheetId,
    invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]],
    onSuccess: (data) => {
      setSaberes(data.saberes);
      showToast({
        message: 'Nota do saber salva com sucesso.',
        type: 'success',
      });
    },
    onError: (mutationError) => {
      showToast({
        message:
          mutationError.response?.data?.message ??
          'Não foi possível salvar a nota do saber.',
        type: 'error',
      });
    },
  });

  const { data: allProficiencyProperties } = useProficiencyPropertiesQuery();

  const adjustedProficienciesPropertyOptions: IProficiencyProperty[] = useMemo(() => {
    const appliedPropertyIds = new Set(
      flattenProficiencySnapshot(proficiencias).map((entry) => entry.property.id),
    );

    return (allProficiencyProperties ?? []).filter(
      (property) => !appliedPropertyIds.has(property.id),
    );
  }, [allProficiencyProperties, proficiencias]);

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

  const armorClassKeyAttributeId = armorClassKeyAttribute?.id ?? null;
  useFieldAutosave({
    value: armorClassKeyAttributeId,
    enabled: hasHydrated,
    onSave: (newAttributeId) => {
      if (!newAttributeId) {
        return;
      }

      updateArmorClassKeyAttributeMutation.mutate({
        armorClassKeyAttributeId: newAttributeId,
      });
    },
  });

  useFieldAutosave({
    value: currentHitPoints,
    enabled: hasHydrated,
    onSave: (newCurrentHitPoints) =>
      updateCurrentHitPointsMutation.mutate({
        currentHitPoints: newCurrentHitPoints,
      }),
  });

  useFieldAutosave({
    value: temporaryHitPoints,
    enabled: hasHydrated,
    onSave: (newTemporaryHitPoints) =>
      updateTemporaryHitPointsMutation.mutate({
        temporaryHitPoints: newTemporaryHitPoints,
      }),
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
          sx={SHEET_TABS_SX}
        >
          <Tab value="estatisticas" label="Estatísticas" />
          <Tab value="bonus" label="Bônus" />
          <Tab value="habilidades" label="Habilidades" />
        </Tabs>

        {activeTab === 'bonus' && (
          <Tabs
            value={activeBonusSubTab}
            onChange={(_event, newValue: SheetBonusSubTab) =>
              setActiveBonusSubTab(newValue)
            }
            sx={SHEET_TABS_SX}
          >
            <Tab value="melhorias" label="Melhorias" />
            <Tab value="defeitos" label="Defeitos" />
            <Tab value="proficiencias" label="Proficiências" />
          </Tabs>
        )}

        {activeTab === 'habilidades' && (
          <Tabs
            value={activeAbilitiesSubTab}
            onChange={(_event, newValue: SheetAbilitiesSubTab) =>
              setActiveAbilitiesSubTab(newValue)
            }
            sx={SHEET_TABS_SX}
          >
            <Tab value="caracteristicas" label="Características" />
            <Tab value="treinamentos" label="Treinamentos" />
            <Tab value="talentos" label="Talentos" />
          </Tabs>
        )}

        <div className="mt-4">
          {activeTab === 'estatisticas' && (
            <div className="flex flex-col gap-6">
              <SheetHitPointsPanel
                currentValue={currentHitPoints}
                onCurrentChange={setCurrentHitPoints}
                temporaryValue={temporaryHitPoints}
                onTemporaryChange={setTemporaryHitPoints}
                maxValue={maxHitPoints}
                keyAttributeName={SHEET_HIT_POINTS_KEY_ATTRIBUTE_NAME}
                onOpenDetail={() => setIsHitPointsDetailOpen(true)}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SheetAttributesPanel
                  attributes={attributes}
                  onOpenDetails={() => setIsAttributesDetailOpen(true)}
                />

                <div className="flex flex-col gap-6">
                  <SheetArmorClassPanel
                    total={armorClassTotal}
                    keyAttribute={armorClassKeyAttribute}
                    keyAttributeOptions={armorClassKeyAttributeOptions}
                    onKeyAttributeChange={setArmorClassKeyAttribute}
                    onOpenDetail={() => setIsArmorClassDetailOpen(true)}
                  />

                  <SheetSavingThrowsPanel
                    items={savingThrowModifiers}
                    onOpenDetail={(id) =>
                      setSavingThrowPendingBonusDetail(
                        savingThrowModifiers.find((item) => item.id === id) ??
                          null,
                      )
                    }
                  />
                </div>
              </div>

              <SheetSkillsPanel
                items={skillModifiers}
                onOpenDetail={(skillId) =>
                  setSkillPendingBonusDetail(
                    skillModifiers.find((s) => s.id === skillId) ?? null,
                  )
                }
              />

              <SheetKnowledgesPanel
                items={knowledgeModifiers}
                onOpenDetail={(knowledgeId) => {
                  const item = knowledgeModifiers.find(
                    (k) => k.id === knowledgeId,
                  );

                  setKnowledgePendingBonusDetail(
                    item
                      ? {
                          name: item.title,
                          total: item.total,
                          breakdown: item.breakdown,
                        }
                      : null,
                  );
                }}
                onSaveNote={(knowledgeId, note) =>
                  updateKnowledgeNoteMutation.mutate({ knowledgeId, note })
                }
                isSavingNote={(knowledgeId) =>
                  updateKnowledgeNoteMutation.isPending &&
                  updateKnowledgeNoteMutation.variables?.knowledgeId ===
                    knowledgeId
                }
              />
            </div>
          )}

          {activeTab === 'bonus' && activeBonusSubTab === 'melhorias' && (
            <SheetImprovementDefectCategoryAccordions items={melhorias} />
          )}

          {activeTab === 'bonus' && activeBonusSubTab === 'defeitos' && (
            <SheetImprovementDefectCategoryAccordions items={defeitos} />
          )}

          {activeTab === 'bonus' && activeBonusSubTab === 'proficiencias' && (
            <div className="flex flex-col gap-6">
              <SheetProficienciesGrid
                items={flattenProficiencySnapshot(proficiencias)}
              />

              <SheetAdjustedProficienciesSection
                items={proficienciasAjustadas}
                propertyOptions={adjustedProficienciesPropertyOptions}
                onSelectSubstitute={handleSelectProficiencySubstitute}
                isSaving={(adjustmentId) =>
                  resolveProficiencyAdjustmentMutation.isPending &&
                  resolveProficiencyAdjustmentMutation.variables?.adjustmentId ===
                    adjustmentId
                }
              />
            </div>
          )}

          {activeTab === 'habilidades' &&
            activeAbilitiesSubTab === 'caracteristicas' && (
              <SheetCharacteristicsPanel
                sheetId={sheetId}
                inherited={abilities.characteristics.inherited}
                extras={abilities.characteristics.extras}
                onAddExtra={(characteristicId) =>
                  addCharacteristicExtraMutation.mutate({ characteristicId })
                }
                onRemoveExtra={(characteristicId) =>
                  removeCharacteristicExtraMutation.mutate(characteristicId)
                }
                isAdding={addCharacteristicExtraMutation.isPending}
                isRemoving={(characteristicId) =>
                  removeCharacteristicExtraMutation.isPending &&
                  removeCharacteristicExtraMutation.variables ===
                    characteristicId
                }
                isLoading={isLoadingAbilities}
              />
            )}

          {activeTab === 'habilidades' &&
            activeAbilitiesSubTab === 'treinamentos' && (
              <SheetTrainingsPanel
                sheetId={sheetId}
                slots={abilities.trainings.slots}
                inherited={abilities.trainings.inherited}
                extras={abilities.trainings.extras}
                onFillSlot={(slotIndex, trainingId) =>
                  fillTrainingSlotMutation.mutate({ slotIndex, trainingId })
                }
                onEmptySlot={(slotIndex) =>
                  emptyTrainingSlotMutation.mutate(slotIndex)
                }
                onAddExtra={(trainingId) =>
                  addTrainingExtraMutation.mutate({ trainingId })
                }
                onRemoveExtra={(trainingId) =>
                  removeTrainingExtraMutation.mutate(trainingId)
                }
                isFillingSlot={fillTrainingSlotMutation.isPending}
                isEmptyingSlot={(slotIndex) =>
                  emptyTrainingSlotMutation.isPending &&
                  emptyTrainingSlotMutation.variables === slotIndex
                }
                isAddingExtra={addTrainingExtraMutation.isPending}
                isRemovingExtra={(trainingId) =>
                  removeTrainingExtraMutation.isPending &&
                  removeTrainingExtraMutation.variables === trainingId
                }
                isLoading={isLoadingAbilities}
              />
            )}

          {activeTab === 'habilidades' &&
            activeAbilitiesSubTab === 'talentos' && (
              <SheetTalentsPanel
                sheetId={sheetId}
                inherited={abilities.talents.inherited}
                extras={abilities.talents.extras}
                onAddExtra={(talentId) =>
                  addTalentExtraMutation.mutate({ talentId })
                }
                onRemoveExtra={(talentId) =>
                  removeTalentExtraMutation.mutate(talentId)
                }
                isAdding={addTalentExtraMutation.isPending}
                isRemoving={(talentId) =>
                  removeTalentExtraMutation.isPending &&
                  removeTalentExtraMutation.variables === talentId
                }
                isLoading={isLoadingAbilities}
              />
            )}
        </div>
      </div>

      <SheetAttributesDetailModal
        open={isAttributesDetailOpen}
        onClose={() => setIsAttributesDetailOpen(false)}
        groups={attributesDetailGroups}
      />

      <SheetBonusDetailModal
        open={!!skillPendingBonusDetail}
        onClose={() => setSkillPendingBonusDetail(null)}
        detail={skillPendingBonusDetail}
      />

      <SheetBonusDetailModal
        open={!!knowledgePendingBonusDetail}
        onClose={() => setKnowledgePendingBonusDetail(null)}
        detail={knowledgePendingBonusDetail}
      />

      <SheetBonusDetailModal
        open={isArmorClassDetailOpen}
        onClose={() => setIsArmorClassDetailOpen(false)}
        detail={{
          name: 'Classe de Armadura',
          total: armorClassTotal,
          breakdown: armorClassBreakdown,
        }}
      />

      <SheetBonusDetailModal
        open={!!savingThrowPendingBonusDetail}
        onClose={() => setSavingThrowPendingBonusDetail(null)}
        detail={savingThrowPendingBonusDetail}
      />

      <SheetBonusDetailModal
        open={isHitPointsDetailOpen}
        onClose={() => setIsHitPointsDetailOpen(false)}
        detail={{
          name: 'Pontos de Vida Máximo',
          total: maxHitPoints,
          breakdown: maxHitPointsBreakdown,
        }}
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
