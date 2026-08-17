'use client';

import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { FiFileText, FiTag } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IEnchantment } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import {
  APP_COLORS,
  APP_CONTAINER_STYLES,
  EQUIPMENT_APPLICABLE_TYPE_LABELS,
} from '@/shared/constants';

export interface EnchantmentViewProps {
  enchantmentId: string;
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const EnchantmentView = ({
  enchantmentId,
  onNotFound,
}: EnchantmentViewProps) => {
  const {
    data: enchantment,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IEnchantment>({
    url: `/enchantments/${enchantmentId}`,
  });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do encantamento.'),
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
        <DefaultText>Carregando dados do encantamento...</DefaultText>
      </div>
    );
  }

  if (!enchantment) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
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
          {enchantment.name}
        </Title>

        <div
          className="flex items-start gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailInfoField}
        >
          <FiTag style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }} />
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Tipo
            </Label>
            <DefaultText>
              {enchantment.type
                ? EQUIPMENT_APPLICABLE_TYPE_LABELS[enchantment.type]
                : NOT_INFORMED}
            </DefaultText>
          </div>
        </div>
      </div>

      <div
        className="flex-1 min-w-0 flex flex-col"
        style={APP_CONTAINER_STYLES.detailSectionBox}
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiFileText style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Efeito
          </Label>
        </div>
        <div className="flex-1 px-3 py-3">
          <RichTextViewer
            value={enchantment.effect}
            emptyLabel={NOT_INFORMED}
          />
        </div>
      </div>
    </div>
  );
};
