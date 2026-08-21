'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiDollarSign,
  FiFileText,
  FiImage,
  FiLock,
  FiPackage,
} from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IConsumable } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export type ConsumableViewProps =
  | {
      consumableId: string;
      consumable?: undefined;
      /**
       * Chamado quando o consumível não é encontrado (404) — usado pelo
       * EntityMentionViewDispatcher para fechar o modal aberto a partir de
       * uma menção órfã (entidade excluída). Não se aplica ao modo
       * `consumable` (snapshot já resolvido, nunca "não encontrado").
       */
      onNotFound?: () => void;
    }
  | {
      consumableId?: undefined;
      /**
       * Snapshot já resolvido (ex.: item de inventário da ficha) — quando
       * informado, o componente pula `GET /consumables/:id` e renderiza
       * direto a partir deste objeto.
       */
      consumable: Omit<IConsumable, 'id' | 'createdAt' | 'updatedAt'>;
      onNotFound?: undefined;
    };

const NOT_INFORMED = 'Não informado';

export const ConsumableView = (props: ConsumableViewProps) => {
  const { consumableId, onNotFound } = props;
  const resolvedConsumable = props.consumable;

  const {
    data: fetchedConsumable,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IConsumable>({
    url: `/consumables/${consumableId}`,
    enabled: !resolvedConsumable,
  });

  const consumable = resolvedConsumable ?? fetchedConsumable;

  const isGoogleUser = useIsGoogleUser();
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (resolvedConsumable || !isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do consumível.'),
      type: 'error',
    });

    if (isNotFound) {
      onNotFound?.();
    }
  }, [isError, error, onNotFound, resolvedConsumable]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do consumível...</DefaultText>
      </div>
    );
  }

  if (!consumable) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {consumable.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${consumable.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={consumable.referenceImage}
                alt={consumable.name}
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
              imageUrl={consumable.referenceImage}
              alt={consumable.name}
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
            {consumable.name}
          </Title>

          {consumable.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {consumable.tags.map((tag) => (
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  {formatPriceWithCurrency(consumable.price, consumable.currency)}
                </DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiPackage
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Volume
                </Label>
                <DefaultText>{consumable.volume ?? NOT_INFORMED}</DefaultText>
              </div>
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
            value={consumable.description}
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
              value={consumable.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
