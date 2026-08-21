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
import { GiMagicSwirl, GiUpgrade } from 'react-icons/gi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EmbeddedEffectsSectionView } from '@/shared/components/EmbeddedEffectsSectionView';
import { useGetEntityById } from '@/hooks/Queries';
import { IAccessory } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export type AccessoryViewProps =
  | {
      accessoryId: string;
      accessory?: undefined;
      /**
       * Chamado quando o acessório não é encontrado (404) — usado pelo
       * EntityMentionViewDispatcher para fechar o modal aberto a partir de
       * uma menção órfã (entidade excluída). Não se aplica ao modo
       * `accessory` (snapshot já resolvido, nunca "não encontrado").
       */
      onNotFound?: () => void;
    }
  | {
      accessoryId?: undefined;
      /**
       * Snapshot já resolvido (ex.: item de inventário da ficha) — quando
       * informado, o componente pula `GET /accessories/:id` e renderiza
       * direto a partir deste objeto.
       */
      accessory: Omit<IAccessory, 'id' | 'createdAt' | 'updatedAt'>;
      onNotFound?: undefined;
    };

const NOT_INFORMED = 'Não informado';

export const AccessoryView = (props: AccessoryViewProps) => {
  const { accessoryId, onNotFound } = props;
  const resolvedAccessory = props.accessory;

  const {
    data: fetchedAccessory,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IAccessory>({
    url: `/accessories/${accessoryId}`,
    enabled: !resolvedAccessory,
  });

  const accessory = resolvedAccessory ?? fetchedAccessory;

  const isGoogleUser = useIsGoogleUser();
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (resolvedAccessory || !isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados do acessório.'),
      type: 'error',
    });

    if (isNotFound) {
      onNotFound?.();
    }
  }, [isError, error, onNotFound, resolvedAccessory]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados do acessório...</DefaultText>
      </div>
    );
  }

  if (!accessory) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {accessory.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${accessory.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={accessory.referenceImage}
                alt={accessory.name}
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
              imageUrl={accessory.referenceImage}
              alt={accessory.name}
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
            {accessory.name}
          </Title>

          {accessory.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {accessory.tags.map((tag) => (
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
                  {formatPriceWithCurrency(accessory.price, accessory.currency)}
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
                <DefaultText>{accessory.volume ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmbeddedEffectsSectionView
        icon={GiMagicSwirl}
        label="Encantamentos"
        items={accessory.enchantments}
      />

      <EmbeddedEffectsSectionView
        icon={GiUpgrade}
        label="Aprimoramentos"
        items={accessory.enhancements}
      />

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
            value={accessory.description}
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
              value={accessory.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
