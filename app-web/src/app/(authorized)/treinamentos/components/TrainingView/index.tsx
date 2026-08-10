'use client';

import { useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiBookOpen,
  FiCheckSquare,
  FiFileText,
  FiPlusCircle,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { ProficiencyCard } from '@/shared/components/ProficiencyCard';
import { KnowledgeCard } from '@/shared/components/KnowledgeCard';
import { useGetEntityById } from '@/hooks/Queries';
import { ITraining } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface TrainingViewProps {
  trainingId: string;
  onNotFound?: () => void;
}

export const TrainingView = ({
  trainingId,
  onNotFound,
}: TrainingViewProps) => {
  const {
    data: training,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ITraining>({ url: `/trainings/${trainingId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do treinamento.'),
      type: 'error',
    });

    if (isNotFound) {
      onNotFound?.();
    }
  }, [isError, error, onNotFound]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do treinamento...</DefaultText>
      </div>
    );
  }

  if (!training) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Title
          component="h3"
          sx={{
            textAlign: 'center',
            textTransform: 'none',
            backgroundImage: 'none',
            color: APP_COLORS.textBrownDark,
            WebkitTextFillColor: APP_COLORS.textBrownDark,
            letterSpacing: 'normal',
            filter: 'none',
          }}
        >
          {training.name}
        </Title>

        <DefaultText>{`(level ${training.level})`}</DefaultText>

        {training.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {training.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  backgroundColor: tag.color,
                  color: getContrastTextColor(tag.color),
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiFileText style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Descrição
          </Label>
        </div>
        <div className="px-3 py-3">
          <RichTextViewer value={training.description} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div style={APP_CONTAINER_STYLES.detailSectionBox}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiArrowUpCircle
              style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
            />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Melhorias
            </Label>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            {training.improvements.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {training.improvements.map((item) => (
              <ImprovementDefectCard
                key={`${item.type.id}-${item.property.id}`}
                item={item}
              />
            ))}
          </div>
        </div>

        <div style={APP_CONTAINER_STYLES.detailSectionBox}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiArrowDownCircle
              style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
            />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Defeitos
            </Label>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            {training.flaws.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {training.flaws.map((item) => (
              <ImprovementDefectCard
                key={`${item.type.id}-${item.property.id}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiZap style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Proficiências
          </Label>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {training.proficiencies.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {training.proficiencies.map((item) => (
            <ProficiencyCard key={item.property.id} item={item} />
          ))}
        </div>
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiBookOpen style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Saber
          </Label>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {training.knowledges.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {training.knowledges.map((item) => (
            <KnowledgeCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div style={APP_CONTAINER_STYLES.detailSectionBox}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiPlusCircle style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Habilidades Adicionais
          </Label>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {training.additionalAbilities.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {training.additionalAbilities.map((reference) => (
            <EntityReferenceCard
              key={`${reference.entityType}-${reference.id}`}
              reference={reference}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div style={APP_CONTAINER_STYLES.detailSectionBox}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiTrendingUp style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Aprimorado de
            </Label>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            {training.improvedFrom.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {training.improvedFrom.map((reference) => (
              <EntityReferenceCard
                key={`${reference.entityType}-${reference.id}`}
                reference={reference}
              />
            ))}
          </div>
        </div>

        <div style={APP_CONTAINER_STYLES.detailSectionBox}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiCheckSquare style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Requisitos
            </Label>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            {training.requirements.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {training.requirements.map((reference) => (
              <EntityReferenceCard
                key={`${reference.entityType}-${reference.id}`}
                reference={reference}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
