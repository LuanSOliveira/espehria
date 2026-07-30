'use client';

import { useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { FiFileText } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { ISkill } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { SkillSectionCard } from '../SkillSectionCard';

export interface SkillViewProps {
  skillId: string;
  onNotFound?: () => void;
}

export const SkillView = ({ skillId, onNotFound }: SkillViewProps) => {
  const {
    data: skill,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ISkill>({ url: `/skills/${skillId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados da perícia.'),
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
        <DefaultText>Carregando dados da perícia...</DefaultText>
      </div>
    );
  }

  if (!skill) {
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
          {skill.name}
        </Title>

        {skill.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {skill.tags.map((tag) => (
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
          <RichTextViewer value={skill.description} />
        </div>
      </div>

      {skill.sections.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skill.sections.map((section) => (
            <SkillSectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
};
