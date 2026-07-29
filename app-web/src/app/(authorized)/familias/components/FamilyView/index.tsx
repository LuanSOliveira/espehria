'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { FiFileText, FiImage } from 'react-icons/fi';
import { GiCrown } from 'react-icons/gi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { FamilyGenealogyBoard } from '@/shared/components/FamilyGenealogyBoard';
import { useGetEntityById } from '@/hooks/Queries';
import { IFamily } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { FAMILY_CLASSIFICATION_OPTIONS } from '../../data';

export interface FamilyViewProps {
  familyId: string;
  /**
   * Chamado quando a família não é encontrada (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const FamilyView = ({ familyId, onNotFound }: FamilyViewProps) => {
  const {
    data: family,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IFamily>({ url: `/families/${familyId}` });

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
          'Não foi possível carregar os dados da família.'),
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
        <DefaultText>Carregando dados da família...</DefaultText>
      </div>
    );
  }

  if (!family) {
    return null;
  }

  const classificationLabel =
    FAMILY_CLASSIFICATION_OPTIONS.find(
      (option) => option.value === family.classification,
    )?.label ?? family.classification;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {family.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${family.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={family.referenceImage}
                alt={family.name}
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
              imageUrl={family.referenceImage}
              alt={family.name}
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
            {family.name}
          </Title>

          {family.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {family.tags.map((tag) => (
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
            <GiCrown
              style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
            />
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Classificação
              </Label>
              <DefaultText>{classificationLabel}</DefaultText>
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
          <RichTextViewer value={family.description} emptyLabel={NOT_INFORMED} />
        </div>
      </div>

      <FamilyGenealogyBoard
        mode="readOnly"
        members={family.members.map((member) => ({
          character: member.character,
          positionX: member.positionX,
          positionY: member.positionY,
        }))}
        relationships={family.relationships.map((relationship) => ({
          id: relationship.id,
          sourceCharacterId: relationship.sourceCharacter.id,
          targetCharacterId: relationship.targetCharacter.id,
          type: relationship.type,
        }))}
      />
    </div>
  );
};
