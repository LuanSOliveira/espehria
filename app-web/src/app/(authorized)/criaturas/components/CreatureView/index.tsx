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
  FiRepeat,
  FiShield,
  FiTarget,
  FiUser,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { useGetEntityById } from '@/hooks/Queries';
import { ICreature } from '@/shared/interfaces';
import { isRichTextEmpty, showToast } from '@/shared/util';
import { APP_COLORS, APP_INPUT_STYLES } from '@/shared/constants';

export interface CreatureViewProps {
  creatureId: string;
}

const NOT_INFORMED = 'Não informado';

interface CreatureSectionData {
  label: string;
  icon: IconType;
  value?: string | null;
}

const CreatureSectionBlock = ({ label, icon: Icon, value }: CreatureSectionData) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon style={{ fontSize: 18, color: APP_COLORS.gold }} />
        <Label component="span" sx={{ margin: 0 }}>
          {label}
        </Label>
      </div>
      <Box sx={APP_INPUT_STYLES.richTextViewFrame}>
        {!isRichTextEmpty(value ?? undefined) ? (
          <Box sx={APP_INPUT_STYLES.richTextContent}>
            <div
              className="ProseMirror"
              dangerouslySetInnerHTML={{ __html: value as string }}
            />
          </Box>
        ) : (
          <DefaultText>{NOT_INFORMED}</DefaultText>
        )}
      </Box>
    </div>
  );
};

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
    { label: 'Outros Nomes', value: creature.otherNames },
    { label: 'Categoria', value: creature.category.name },
    { label: 'Nível de Ameaça', value: creature.threatLevel },
    { label: 'Expectativa de Vida', value: creature.averageLifeExpectancy },
  ];

  const sectionsBeforeLifeStage: CreatureSectionData[] = [
    {
      label: 'Características Físicas',
      icon: FiUser,
      value: creature.physicalCharacteristics,
    },
    { label: 'Habitat', icon: FiMap, value: creature.habitat },
    { label: 'Comportamento', icon: FiActivity, value: creature.behavior },
    { label: 'Alimentação', icon: FiCoffee, value: creature.diet },
    { label: 'Ciclo de Vida', icon: FiRepeat, value: creature.lifeCycle },
  ];

  const lifeStages = [
    { label: 'Filhote', value: creature.lifeStageInfant },
    { label: 'Jovem', value: creature.lifeStageYoung },
    { label: 'Adulto', value: creature.lifeStageAdult },
    { label: 'Ancião', value: creature.lifeStageElder },
  ];

  const sectionsAfterLifeStage: CreatureSectionData[] = [
    {
      label: 'Habilidades e Poderes',
      icon: FiZap,
      value: creature.abilitiesAndPowers,
    },
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
      <Title component="h3" sx={{ textAlign: 'left' }}>
        {creature.name}
      </Title>

      <div className="flex flex-col gap-4 sm:flex-row">
        {creature.referenceImageUrl ? (
          <Box
            component="img"
            src={creature.referenceImageUrl}
            alt={creature.name}
            sx={{
              width: 300,
              height: 300,
              objectFit: 'cover',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 300,
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: APP_COLORS.wood,
              color: APP_COLORS.gold,
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            <FiImage style={{ fontSize: 64 }} />
          </Box>
        )}

        <div
          className="flex flex-col justify-between gap-2 w-full"
          style={{ height: 300 }}
        >
          {sideInfo.map((info) => (
            <div key={info.label}>
              <Label component="span" sx={{ margin: 0 }}>
                {info.label}
              </Label>
              <DefaultText>{info.value || NOT_INFORMED}</DefaultText>
            </div>
          ))}
        </div>
      </div>

      {sectionsBeforeLifeStage.map((section) => (
        <CreatureSectionBlock key={section.label} {...section} />
      ))}

      <div>
        <Label component="span" sx={{ margin: 0, marginBottom: '10px' }}>
          Estágio de Vida
        </Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
          {lifeStages.map((stage) => (
            <div key={stage.label}>
              <div className="flex items-center gap-2 mb-2">
                <FiClock style={{ fontSize: 16, color: APP_COLORS.gold }} />
                <Label component="span" sx={{ margin: 0 }}>
                  {stage.label}
                </Label>
              </div>
              <Box sx={APP_INPUT_STYLES.richTextViewFrame}>
                {!isRichTextEmpty(stage.value ?? undefined) ? (
                  <Box sx={APP_INPUT_STYLES.richTextContent}>
                    <div
                      className="ProseMirror"
                      dangerouslySetInnerHTML={{
                        __html: stage.value as string,
                      }}
                    />
                  </Box>
                ) : (
                  <DefaultText>{NOT_INFORMED}</DefaultText>
                )}
              </Box>
            </div>
          ))}
        </div>
      </div>

      {sectionsAfterLifeStage.map((section) => (
        <CreatureSectionBlock key={section.label} {...section} />
      ))}
    </div>
  );
};
