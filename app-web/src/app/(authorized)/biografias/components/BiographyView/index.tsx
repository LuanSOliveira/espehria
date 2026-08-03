'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiArrowUpCircle,
  FiFileText,
  FiImage,
  FiPlusCircle,
} from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { useGetEntityById } from '@/hooks/Queries';
import { IBiography } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface BiographyViewProps {
  biographyId: string;
  onNotFound?: () => void;
}

export const BiographyView = ({
  biographyId,
  onNotFound,
}: BiographyViewProps) => {
  const {
    data: biography,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IBiography>({ url: `/biographies/${biographyId}` });

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
          'Não foi possível carregar os dados da biografia.'),
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
        <DefaultText>Carregando dados da biografia...</DefaultText>
      </div>
    );
  }

  if (!biography) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {biography.imageReference ? (
          <>
            <Box
              component="button"
              type="button"
              aria-label={`Ampliar imagem de ${biography.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              sx={{
                flexShrink: 0,
                width: 300,
                minWidth: 300,
                height: 300,
              }}
            >
              <Box
                component="img"
                src={biography.imageReference}
                alt={biography.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: `2px solid ${APP_COLORS.gold}`,
                }}
              />
            </Box>

            <ImagePreviewDialog
              open={isImagePreviewOpen}
              onClose={() => setIsImagePreviewOpen(false)}
              imageUrl={biography.imageReference}
              alt={biography.name}
            />
          </>
        ) : (
          <Box
            sx={{
              width: 300,
              minWidth: 300,
              height: 300,
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
            {biography.name}
          </Title>

          {biography.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {biography.tags.map((tag) => (
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

          <div style={APP_CONTAINER_STYLES.detailSectionBox}>
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
            >
              <FiFileText
                style={{ fontSize: 16, color: APP_COLORS.goldSoft }}
              />
              <Label
                component="span"
                sx={{ margin: 0, color: APP_COLORS.goldSoft }}
              >
                Descrição
              </Label>
            </div>
            <div className="px-3 py-3">
              <RichTextViewer value={biography.description} />
            </div>
          </div>
        </div>
      </div>

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
          {biography.improvements.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {biography.improvements.map((item) => (
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
          <FiPlusCircle style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Habilidades Adicionais
          </Label>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {biography.additionalAbilities.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {biography.additionalAbilities.map((reference) => (
            <EntityReferenceCard
              key={`${reference.entityType}-${reference.id}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
