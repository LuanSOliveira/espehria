'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiAlertTriangle,
  FiDollarSign,
  FiFileText,
  FiHeart,
  FiHexagon,
  FiImage,
  FiLock,
  FiPackage,
  FiPlusCircle,
  FiTag,
  FiWind,
} from 'react-icons/fi';
import { GiMagicSwirl, GiUpgrade } from 'react-icons/gi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EmbeddedEffectsSectionView } from '@/shared/components/EmbeddedEffectsSectionView';
import { useGetEntityById } from '@/hooks/Queries';
import { IShield } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface ShieldViewProps {
  shieldId: string;
  /**
   * Chamado quando o escudo não é encontrado (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const ShieldView = ({ shieldId, onNotFound }: ShieldViewProps) => {
  const {
    data: shield,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IShield>({
    url: `/shields/${shieldId}`,
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
          'Não foi possível carregar os dados do escudo.'),
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
        <DefaultText>Carregando dados do escudo...</DefaultText>
      </div>
    );
  }

  if (!shield) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {shield.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${shield.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={shield.referenceImage}
                alt={shield.name}
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
              imageUrl={shield.referenceImage}
              alt={shield.name}
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
            {shield.name}
          </Title>

          {shield.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shield.tags.map((tag) => (
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
                  {formatPriceWithCurrency(shield.price, shield.currency)}
                </DefaultText>
              </div>
            </div>

            {shield.nickname && (
              <div
                className="flex items-start gap-2 px-3 py-2"
                style={APP_CONTAINER_STYLES.detailInfoField}
              >
                <FiTag
                  style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
                />
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Apelido
                  </Label>
                  <DefaultText>{shield.nickname}</DefaultText>
                </div>
              </div>
            )}

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
                <DefaultText>{shield.volume ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiPlusCircle
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Bônus de CA
                </Label>
                <DefaultText>{shield.armorClassBonus ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiWind
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Penalidade de Velocidade (Metros)
                </Label>
                <DefaultText>
                  {shield.speedPenaltyMeters ?? NOT_INFORMED}
                </DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiHexagon
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Dureza
                </Label>
                <DefaultText>{shield.hardness ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiHeart
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Pontos de Vida
                </Label>
                <DefaultText>{shield.hitPoints ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiAlertTriangle
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Limiar de Quebra
                </Label>
                <DefaultText>{shield.breakThreshold ?? 0}</DefaultText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmbeddedEffectsSectionView
        icon={GiMagicSwirl}
        label="Encantamentos"
        items={shield.enchantments}
      />

      <EmbeddedEffectsSectionView
        icon={GiUpgrade}
        label="Aprimoramentos"
        items={shield.enhancements}
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
          <RichTextViewer value={shield.description} emptyLabel={NOT_INFORMED} />
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
              value={shield.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
