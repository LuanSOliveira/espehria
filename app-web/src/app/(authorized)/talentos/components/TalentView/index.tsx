'use client';

import { useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { FiCheckSquare, FiFileText, FiTrendingUp } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { useGetEntityById } from '@/hooks/Queries';
import { ITalent } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface TalentViewProps {
  talentId: string;
  onNotFound?: () => void;
}

export const TalentView = ({ talentId, onNotFound }: TalentViewProps) => {
  const {
    data: talent,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ITalent>({ url: `/talents/${talentId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do talento.'),
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
        <DefaultText>Carregando dados do talento...</DefaultText>
      </div>
    );
  }

  if (!talent) {
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
          {talent.name}
        </Title>

        <DefaultText>{`(level ${talent.level})`}</DefaultText>

        {talent.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {talent.tags.map((tag) => (
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
          <RichTextViewer value={talent.description} />
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
            {talent.improvedFrom.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {talent.improvedFrom.map((reference) => (
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
            {talent.requirements.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {talent.requirements.map((reference) => (
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
