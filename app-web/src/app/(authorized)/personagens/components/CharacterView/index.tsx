'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { FiBriefcase, FiFileText, FiImage, FiUsers } from 'react-icons/fi';
import { GiDeathSkull } from 'react-icons/gi';
import { MdOutlineFace } from 'react-icons/md';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { ICharacter } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { CharacterKinshipCard } from '../CharacterKinshipCard';
import { CharacterOrganizationCard } from '../CharacterOrganizationCard';

export interface CharacterViewProps {
  characterId: string;
  /**
   * Chamado quando o personagem não é encontrado (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const CharacterView = ({ characterId, onNotFound }: CharacterViewProps) => {
  const {
    data: character,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ICharacter>({ url: `/characters/${characterId}` });

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
          'Não foi possível carregar os dados do personagem.'),
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
        <DefaultText>Carregando dados do personagem...</DefaultText>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {character.referenceImage ? (
          <>
            <Box
              component="button"
              type="button"
              aria-label={`Ampliar imagem de ${character.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              sx={{
                flexShrink: 0,
                width: 300,
                minWidth: 300,
                minHeight: 400,
                height: { xs: 400, sm: '100%' },
              }}
            >
              <Box
                component="img"
                src={character.referenceImage}
                alt={character.name}
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
              imageUrl={character.referenceImage}
              alt={character.name}
            />
          </>
        ) : (
          <Box
            sx={{
              width: 300,
              minWidth: 300,
              minHeight: 400,
              height: { xs: 400, sm: '100%' },
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
          <div className="flex items-center gap-2">
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
                margin: 0,
              }}
            >
              {character.name}
            </Title>
            {character.isDead && (
              <Box
                component="span"
                title="Morto"
                sx={{ display: 'flex', color: APP_COLORS.textBrownDark }}
              >
                <GiDeathSkull style={{ fontSize: 22 }} />
              </Box>
            )}
          </div>

          {character.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {character.tags.map((tag) => (
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

          {character.race && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <MdOutlineFace
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Raça
                </Label>
                <DefaultText>{character.race.name}</DefaultText>
              </div>
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
          <RichTextViewer value={character.description} emptyLabel={NOT_INFORMED} />
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
            <FiUsers style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Parentescos
            </Label>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-3 py-3">
            {character.kinships.length === 0 && (
              <DefaultText>Nenhum parentesco cadastrado.</DefaultText>
            )}
            {character.kinships.map((kinship) => (
              <CharacterKinshipCard
                key={kinship.id}
                relative={kinship.relative}
                kinship={kinship.kinship}
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
            <FiBriefcase style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Organizações
            </Label>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-3 py-3">
            {character.organizations.length === 0 && (
              <DefaultText>Nenhuma organização cadastrada.</DefaultText>
            )}
            {character.organizations.map((organization) => (
              <CharacterOrganizationCard
                key={organization.id}
                organization={organization}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
