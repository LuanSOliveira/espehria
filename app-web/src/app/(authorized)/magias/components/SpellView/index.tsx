'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { FiCheckSquare, FiFileText, FiImage, FiTrendingUp } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { useGetEntityById } from '@/hooks/Queries';
import { ISpell } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SpellViewProps {
  spellId: string;
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const SpellView = ({ spellId, onNotFound }: SpellViewProps) => {
  const {
    data: spell,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ISpell>({
    url: `/spells/${spellId}`,
  });

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
          'Não foi possível carregar os dados da magia.'),
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
        <DefaultText>Carregando dados da magia...</DefaultText>
      </div>
    );
  }

  if (!spell) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {spell.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${spell.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={spell.referenceImage}
                alt={spell.name}
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
              imageUrl={spell.referenceImage}
              alt={spell.name}
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
            {spell.name}
          </Title>

          {spell.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {spell.tags.map((tag) => (
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
          <RichTextViewer value={spell.description} emptyLabel={NOT_INFORMED} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={APP_CONTAINER_STYLES.detailSectionBox}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiTrendingUp style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Aprimorado de
            </Label>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-3 py-3">
            {spell.improvedFrom.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {spell.improvedFrom.map((reference) => (
              <EntityReferenceCard
                key={`${reference.entityType}-${reference.id}`}
                reference={reference}
              />
            ))}
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
            <FiCheckSquare style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Requisitos
            </Label>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-3 py-3">
            {spell.requirements.length === 0 && (
              <DefaultText>Nenhum item adicionado.</DefaultText>
            )}
            {spell.requirements.map((reference) => (
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
