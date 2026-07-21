'use client';

import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertOctagon,
  FiAlertTriangle,
  FiBookOpen,
  FiClock,
  FiCoffee,
  FiCompass,
  FiCrosshair,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiMap,
  FiPackage,
  FiPlusCircle,
  FiRepeat,
  FiShield,
  FiTag,
  FiTarget,
  FiUser,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { useGetEntityById } from '@/hooks/Queries';
import { ICreature } from '@/shared/interfaces';
import { isRichTextEmpty, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES, APP_INPUT_STYLES } from '@/shared/constants';

export interface CreatureViewProps {
  creatureId: string;
}

const NOT_INFORMED = 'Não informado';

interface CreatureSectionData {
  label: string;
  icon: IconType;
  value?: string | null;
}

const SectionHeaderLabel = ({
  label,
  icon: Icon,
  onDark = false,
}: {
  label: string;
  icon: IconType;
  onDark?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Icon
      style={{ fontSize: 16, color: onDark ? APP_COLORS.goldSoft : APP_COLORS.gold }}
    />
    <Label
      component="span"
      sx={{ margin: 0, color: onDark ? APP_COLORS.goldSoft : undefined }}
    >
      {label}
    </Label>
  </div>
);

const RichTextValue = ({ value }: { value?: string | null }) =>
  !isRichTextEmpty(value ?? undefined) ? (
    <Box sx={APP_INPUT_STYLES.richTextContentLight}>
      <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: value as string }} />
    </Box>
  ) : (
    <DefaultText>{NOT_INFORMED}</DefaultText>
  );

const CreaturePlainSection = ({ label, icon, value }: CreatureSectionData) => (
  <div className="flex flex-col gap-2">
    <SectionHeaderLabel label={label} icon={icon} />
    <RichTextValue value={value} />
  </div>
);

const CreatureBoxedSection = ({ label, icon, value }: CreatureSectionData) => (
  <div style={APP_CONTAINER_STYLES.detailSectionBox}>
    <div className="px-3 py-2" style={APP_CONTAINER_STYLES.detailSectionBoxHeader}>
      <SectionHeaderLabel label={label} icon={icon} onDark />
    </div>
    <div className="px-3 py-3">
      <RichTextValue value={value} />
    </div>
  </div>
);

export const CreatureView = ({ creatureId }: CreatureViewProps) => {
  const {
    data: creature,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ICreature>({ url: `/creatures/${creatureId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados da criatura.',
      type: 'error',
    });
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da criatura...</DefaultText>
      </div>
    );
  }

  if (!creature) {
    return null;
  }

  const sideInfo = [
    { label: 'Outros Nomes', icon: FiPlusCircle, value: creature.otherNames },
    { label: 'Categoria', icon: FiTag, value: creature.category.name },
    { label: 'Nível de Ameaça', icon: FiShield, value: creature.threatLevel },
    {
      label: 'Expectativa de Vida',
      icon: FiClock,
      value: creature.averageLifeExpectancy,
    },
  ];

  const lifeStages = [
    { label: 'Filhote', value: creature.lifeStageInfant },
    { label: 'Jovem', value: creature.lifeStageYoung },
    { label: 'Adulto', value: creature.lifeStageAdult },
    { label: 'Ancião', value: creature.lifeStageElder },
  ];

  const leftColumnBoxedSections: CreatureSectionData[] = [
    { label: 'Habitat', icon: FiMap, value: creature.habitat },
    { label: 'Comportamento', icon: FiActivity, value: creature.behavior },
    { label: 'Alimentação', icon: FiCoffee, value: creature.diet },
    { label: 'Ciclo de Vida', icon: FiRepeat, value: creature.lifeCycle },
  ];

  const rightColumnBoxedSections: CreatureSectionData[] = [
    { label: 'Resistências', icon: FiShield, value: creature.resistances },
    { label: 'Fraquezas', icon: FiAlertTriangle, value: creature.weaknesses },
    { label: 'Combate', icon: FiCrosshair, value: creature.combat },
    {
      label: 'Métodos de Ataque',
      icon: FiTarget,
      value: creature.attackMethods,
    },
    { label: 'Estratégia', icon: FiCompass, value: creature.strategy },
    {
      label: 'Grau de Perigo',
      icon: FiAlertOctagon,
      value: creature.dangerDegree,
    },
    {
      label: 'Recursos Obtidos',
      icon: FiPackage,
      value: creature.obtainedResources,
    },
    {
      label: 'Valor Comercial',
      icon: FiDollarSign,
      value: creature.commercialValue,
    },
    {
      label: 'Relação com Civilizações',
      icon: FiUsers,
      value: creature.relationWithCivilizations,
    },
  ];

  const fullWidthBoxedSections: CreatureSectionData[] = [
    {
      label: 'Mitologia e Folclore',
      icon: FiBookOpen,
      value: creature.mythologyAndFolklore,
    },
    {
      label: 'Registro de Encontro',
      icon: FiFileText,
      value: creature.encounterRecord,
    },
    {
      label: 'Curiosidade dos Estudiosos',
      icon: FiHelpCircle,
      value: creature.scholarsCuriosity,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {creature.referenceImageUrl ? (
          <Box
            component="img"
            src={creature.referenceImageUrl}
            alt={creature.name}
            sx={{
              width: 220,
              height: 220,
              objectFit: 'cover',
              borderRadius: '6px',
              border: `2px solid ${APP_COLORS.gold}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 220,
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: APP_COLORS.wood,
              color: APP_COLORS.gold,
              borderRadius: '6px',
              border: `2px solid ${APP_COLORS.gold}`,
              flexShrink: 0,
            }}
          >
            <FiImage style={{ fontSize: 64 }} />
          </Box>
        )}

        <div className="flex w-full flex-col gap-3">
          <Title
            component="h3"
            sx={{
              textAlign: 'left',
              textTransform: 'none',
              backgroundImage: 'none',
              color: APP_COLORS.textBrownDark,
              WebkitTextFillColor: APP_COLORS.textBrownDark,
              letterSpacing: 'normal',
              filter: 'none',
            }}
          >
            {creature.name}
          </Title>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sideInfo.map((info) => (
              <div
                key={info.label}
                className="flex items-start gap-2 px-3 py-2"
                style={APP_CONTAINER_STYLES.detailInfoField}
              >
                <info.icon
                  style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
                />
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    {info.label}
                  </Label>
                  <DefaultText>{info.value || NOT_INFORMED}</DefaultText>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreaturePlainSection
        label="Características Físicas"
        icon={FiUser}
        value={creature.physicalCharacteristics}
      />

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {leftColumnBoxedSections.map((section) => (
            <CreatureBoxedSection key={section.label} {...section} />
          ))}

          <div className="flex flex-col gap-2">
            <SectionHeaderLabel label="Estágios de Vida" icon={FiClock} />
            <div className="grid grid-cols-2 gap-3">
              {lifeStages.map((stage) => (
                <div key={stage.label} style={APP_CONTAINER_STYLES.detailSectionBox}>
                  <div
                    className="border-b px-3 py-2"
                    style={{ borderColor: APP_COLORS.goldDark }}
                  >
                    <Label component="span" sx={{ margin: 0 }}>
                      {stage.label}
                    </Label>
                  </div>
                  <div className="px-3 py-2">
                    <RichTextValue value={stage.value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CreaturePlainSection
            label="Habilidades e Poderes"
            icon={FiZap}
            value={creature.abilitiesAndPowers}
          />

          {rightColumnBoxedSections.map((section) => (
            <CreatureBoxedSection key={section.label} {...section} />
          ))}
        </div>
      </div>

      {fullWidthBoxedSections.map((section) => (
        <CreatureBoxedSection key={section.label} {...section} />
      ))}
    </div>
  );
};
