'use client';

import { useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { FiFileText } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IPlannedSession } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { PlannedSessionSectionCard } from '../PlannedSessionSectionCard';

export interface PlannedSessionViewProps {
  campaignId: string;
  plannedSessionId: string;
}

export const PlannedSessionView = ({
  campaignId,
  plannedSessionId,
}: PlannedSessionViewProps) => {
  const {
    data: plannedSession,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IPlannedSession>({
    url: `/campaigns/${campaignId}/planned-sessions/${plannedSessionId}`,
  });

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados da sessão planejada.',
      type: 'error',
    });
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da sessão planejada...</DefaultText>
      </div>
    );
  }

  if (!plannedSession) {
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
          {plannedSession.name}
        </Title>

        {plannedSession.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {plannedSession.tags.map((tag) => (
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
            Introdução
          </Label>
        </div>
        <div className="px-3 py-3">
          <RichTextViewer value={plannedSession.introduction} />
        </div>
      </div>

      {plannedSession.sections.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plannedSession.sections.map((section) => (
            <PlannedSessionSectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
};
