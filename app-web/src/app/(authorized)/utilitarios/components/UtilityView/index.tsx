'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiDollarSign,
  FiFileText,
  FiImage,
  FiLock,
} from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IUtility } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface UtilityViewProps {
  utilityId: string;
  /**
   * Chamado quando o utilitário não é encontrado (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const UtilityView = ({ utilityId, onNotFound }: UtilityViewProps) => {
  const {
    data: utility,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IUtility>({
    url: `/utilities/${utilityId}`,
  });

  const isGoogleUser = useIsGoogleUser();
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do utilitário.'),
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
        <DefaultText>Carregando dados do utilitário...</DefaultText>
      </div>
    );
  }

  if (!utility) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {utility.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${utility.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={utility.referenceImage}
                alt={utility.name}
                sx={{
                  width: 400,
                  height: 400,
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: `2px solid ${APP_COLORS.gold}`,
                }}
              />
            </button>

            <ImagePreviewDialog
              open={isImagePreviewOpen}
              onClose={() => setIsImagePreviewOpen(false)}
              imageUrl={utility.referenceImage}
              alt={utility.name}
            />
          </>
        ) : (
          <Box
            sx={{
              width: 400,
              height: 400,
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
            {utility.name}
          </Title>

          {utility.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {utility.tags.map((tag) => (
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

          <div
            className="flex items-start gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailInfoField}
          >
            <FiDollarSign
              style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
            />
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Preço
              </Label>
              <DefaultText>
                {formatPriceWithCurrency(utility.price, utility.currency)}
              </DefaultText>
            </div>
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
            Descrição
          </Label>
        </div>
        <div className="flex-1 px-3 py-3">
          <RichTextViewer
            value={utility.description}
            emptyLabel={NOT_INFORMED}
          />
        </div>
      </div>

      {!isGoogleUser && (
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={APP_CONTAINER_STYLES.detailSectionBox}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiLock style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label
              component="span"
              sx={{ margin: 0, color: APP_COLORS.goldSoft }}
            >
              Informações Privadas
            </Label>
          </div>
          <div className="flex-1 px-3 py-3">
            <RichTextViewer
              value={utility.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
