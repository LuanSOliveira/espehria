'use client';

import { useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { FiFileText, FiTag } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ReferenceImageBanner } from '@/shared/components/ReferenceImageBanner';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { ILocation } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { LocationPointOfInterestCard } from '../LocationPointOfInterestCard';

export interface LocationViewProps {
  locationId: string;
  /**
   * Chamado quando o local não é encontrado (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de um
   * card de ponto de interesse cujo local relacionado tenha sido excluído.
   */
  onNotFound?: () => void;
}

export const LocationView = ({ locationId, onNotFound }: LocationViewProps) => {
  const {
    data: location,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ILocation>({ url: `/locations/${locationId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do local.'),
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
        <DefaultText>Carregando dados do local...</DefaultText>
      </div>
    );
  }

  if (!location) {
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
          {location.name}
        </Title>

        {location.type && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailInfoField}
          >
            <FiTag style={{ fontSize: 16, color: APP_COLORS.gold }} />
            <DefaultText sx={{ margin: 0 }}>{location.type}</DefaultText>
          </div>
        )}

        {location.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {location.tags.map((tag) => (
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

      <ReferenceImageBanner
        imageUrl={location.referenceImageUrl}
        alt={location.name}
        height={380}
      />

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
          <RichTextViewer value={location.description} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label sx={{ margin: 0 }}>Pontos de Interesse</Label>
          {location.pointsOfInterest.length === 0 ? (
            <DefaultText>Nenhum ponto de interesse cadastrado.</DefaultText>
          ) : (
            location.pointsOfInterest.map((poi) => (
              <LocationPointOfInterestCard key={poi.id} location={poi} />
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label sx={{ margin: 0 }}>Pontos de Interesse de</Label>
          {location.pointsOfInterestOf.length === 0 ? (
            <DefaultText>
              Nenhum local relaciona este como ponto de interesse.
            </DefaultText>
          ) : (
            location.pointsOfInterestOf.map((poi) => (
              <LocationPointOfInterestCard key={poi.id} location={poi} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
