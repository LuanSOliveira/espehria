'use client';

import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { FiFileText } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IRule } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { RuleSectionCard } from '../RuleSectionCard';

export interface RuleViewProps {
  ruleId: string;
  onNotFound?: () => void;
}

export const RuleView = ({ ruleId, onNotFound }: RuleViewProps) => {
  const {
    data: rule,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IRule>({ url: `/rules/${ruleId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados da regra.'),
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
        <DefaultText>Carregando dados da regra...</DefaultText>
      </div>
    );
  }

  if (!rule) {
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
          {rule.name}
        </Title>
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
          <RichTextViewer value={rule.description} />
        </div>
      </div>

      {rule.sections.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rule.sections.map((section) => (
            <RuleSectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
};
