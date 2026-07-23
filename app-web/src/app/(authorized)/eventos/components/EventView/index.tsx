'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { IconType } from 'react-icons';
import { FiCalendar, FiClock, FiFileText, FiImage } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IEvent } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface EventViewProps {
  eventId: string;
}

const NOT_INFORMED = 'Não informado';

interface EventSectionData {
  label: string;
  icon: IconType;
  value?: string | null;
}

const EventSectionBox = ({ label, icon: Icon, value }: EventSectionData) => (
  <div className="flex-1 min-w-0" style={APP_CONTAINER_STYLES.detailSectionBox}>
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
    >
      <Icon style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
      <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
        {label}
      </Label>
    </div>
    <div className="px-3 py-3">
      <RichTextViewer value={value} emptyLabel={NOT_INFORMED} />
    </div>
  </div>
);

export const EventView = ({ eventId }: EventViewProps) => {
  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IEvent>({ url: `/events/${eventId}` });

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados do evento.',
      type: 'error',
    });
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do evento...</DefaultText>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Title
          component="h3"
          sx={{
            textTransform: 'none',
            backgroundImage: 'none',
            color: APP_COLORS.textBrownDark,
            WebkitTextFillColor: APP_COLORS.textBrownDark,
            letterSpacing: 'normal',
            filter: 'none',
          }}
        >
          {event.name}
        </Title>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {event.tags.map((tag) => (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="flex items-start gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailInfoField}
        >
          <FiClock
            style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
          />
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Era
            </Label>
            <DefaultText>{event.era?.name ?? NOT_INFORMED}</DefaultText>
          </div>
        </div>

        <div className="flex gap-3">
          <div
            className="flex flex-1 items-start gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailInfoField}
          >
            <FiCalendar
              style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
            />
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Data Início
              </Label>
              <DefaultText>{event.startYear ?? NOT_INFORMED}</DefaultText>
            </div>
          </div>

          <div
            className="flex flex-1 items-start gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailInfoField}
          >
            <FiCalendar
              style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
            />
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Data Fim
              </Label>
              <DefaultText>{event.endYear ?? NOT_INFORMED}</DefaultText>
            </div>
          </div>
        </div>
      </div>

      {event.referenceImageUrl ? (
        <>
          <button
            type="button"
            aria-label={`Ampliar imagem de ${event.name}`}
            onClick={() => setIsImagePreviewOpen(true)}
            className="w-full cursor-pointer border-0 bg-transparent p-0"
          >
            <Box
              component="img"
              src={event.referenceImageUrl}
              alt={event.name}
              sx={{
                width: '100%',
                height: 360,
                objectFit: 'cover',
                borderRadius: '6px',
                border: `2px solid ${APP_COLORS.gold}`,
              }}
            />
          </button>

          <ImagePreviewDialog
            open={isImagePreviewOpen}
            onClose={() => setIsImagePreviewOpen(false)}
            imageUrl={event.referenceImageUrl}
            alt={event.name}
          />
        </>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: APP_COLORS.wood,
            color: APP_COLORS.gold,
            borderRadius: '6px',
            border: `2px solid ${APP_COLORS.gold}`,
          }}
        >
          <FiImage style={{ fontSize: 64 }} />
        </Box>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <EventSectionBox
          label="Descrição"
          icon={FiFileText}
          value={event.description}
        />
      </div>
    </div>
  );
};
