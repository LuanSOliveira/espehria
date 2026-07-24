'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { IconType } from 'react-icons';
import { FiFileText, FiImage, FiTag } from 'react-icons/fi';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IDivinity } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface DivinityViewProps {
  divinityId: string;
}

const NOT_INFORMED = 'Não informado';

interface DivinitySectionData {
  label: string;
  icon: IconType;
  value?: string | null;
}

const DivinitySectionBox = ({
  label,
  icon: Icon,
  value,
}: DivinitySectionData) => (
  <div
    className="flex-1 min-w-0 flex flex-col"
    style={APP_CONTAINER_STYLES.detailSectionBox}
  >
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
    >
      <Icon style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
      <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
        {label}
      </Label>
    </div>
    <div className="flex-1 px-3 py-3">
      <RichTextViewer value={value} emptyLabel={NOT_INFORMED} />
    </div>
  </div>
);

export const DivinityView = ({ divinityId }: DivinityViewProps) => {
  const {
    data: divinity,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IDivinity>({ url: `/divinities/${divinityId}` });

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados da divindade.',
      type: 'error',
    });
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da divindade...</DefaultText>
      </div>
    );
  }

  if (!divinity) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {divinity.referenceImage ? (
        <>
          <button
            type="button"
            aria-label={`Ampliar imagem de ${divinity.name}`}
            onClick={() => setIsImagePreviewOpen(true)}
            className="cursor-pointer border-0 bg-transparent p-0"
            style={{ flexShrink: 0 }}
          >
            <Box
              component="img"
              src={divinity.referenceImage}
              alt={divinity.name}
              sx={{
                width: 300,
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
            imageUrl={divinity.referenceImage}
            alt={divinity.name}
          />
        </>
      ) : (
        <Box
          sx={{
            width: 300,
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
          {divinity.name}
        </Title>

        <div
          className="flex items-start gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailInfoField}
        >
          <FiTag
            style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
          />
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Categoria
            </Label>
            <DefaultText>{divinity.category.name}</DefaultText>
          </div>
        </div>

        {divinity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {divinity.tags.map((tag) => (
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

        <DivinitySectionBox
          label="Descrição"
          icon={FiFileText}
          value={divinity.description}
        />
      </div>
    </div>
  );
};
