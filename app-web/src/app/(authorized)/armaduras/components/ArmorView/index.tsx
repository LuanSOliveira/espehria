'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiActivity,
  FiAward,
  FiDollarSign,
  FiFileText,
  FiImage,
  FiLock,
  FiMinusCircle,
  FiPackage,
  FiPlusCircle,
  FiShield,
  FiTag,
  FiTrendingUp,
  FiWind,
} from 'react-icons/fi';
import { GiMagicSwirl, GiUpgrade } from 'react-icons/gi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { EmbeddedEffectsSectionView } from '@/shared/components/EmbeddedEffectsSectionView';
import { useGetEntityById } from '@/hooks/Queries';
import { IArmor } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export type ArmorViewProps =
  | {
      armorId: string;
      armor?: undefined;
      /**
       * Chamado quando a armadura não é encontrada (404) — usado pelo
       * EntityMentionViewDispatcher para fechar o modal aberto a partir de
       * uma menção órfã (entidade excluída). Não se aplica ao modo `armor`
       * (snapshot já resolvido, nunca "não encontrado").
       */
      onNotFound?: () => void;
    }
  | {
      armorId?: undefined;
      /**
       * Snapshot já resolvido (ex.: item de inventário da ficha) — quando
       * informado, o componente pula `GET /armors/:id` e renderiza direto a
       * partir deste objeto.
       */
      armor: Omit<IArmor, 'id' | 'createdAt' | 'updatedAt'>;
      onNotFound?: undefined;
    };

const NOT_INFORMED = 'Não informado';

export const ArmorView = (props: ArmorViewProps) => {
  const { armorId, onNotFound } = props;
  const resolvedArmor = props.armor;

  const {
    data: fetchedArmor,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IArmor>({
    url: `/armors/${armorId}`,
    enabled: !resolvedArmor,
  });

  const armor = resolvedArmor ?? fetchedArmor;

  const isGoogleUser = useIsGoogleUser();
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (resolvedArmor || !isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados da armadura.'),
      type: 'error',
    });

    if (isNotFound) {
      onNotFound?.();
    }
  }, [isError, error, onNotFound, resolvedArmor]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da armadura...</DefaultText>
      </div>
    );
  }

  if (!armor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {armor.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${armor.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={armor.referenceImage}
                alt={armor.name}
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
              imageUrl={armor.referenceImage}
              alt={armor.name}
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
            {armor.name}
          </Title>

          {armor.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {armor.tags.map((tag) => (
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
                  {formatPriceWithCurrency(armor.price, armor.currency)}
                </DefaultText>
              </div>
            </div>

            {armor.nickname && (
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
                  <DefaultText>{armor.nickname}</DefaultText>
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
                <DefaultText>{armor.volume ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiShield
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Categoria
                </Label>
                <DefaultText>{armor.armorCategory?.name ?? NOT_INFORMED}</DefaultText>
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
                <DefaultText>{armor.armorClassBonus ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiTrendingUp
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Limite de modificador de Destreza
                </Label>
                <DefaultText>
                  {armor.dexterityModifierLimit ?? NOT_INFORMED}
                </DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiActivity
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Força
                </Label>
                <DefaultText>{armor.strength ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiMinusCircle
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Penalidade em teste
                </Label>
                <DefaultText>{armor.checkPenalty ?? NOT_INFORMED}</DefaultText>
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
                <DefaultText>{armor.speedPenaltyMeters ?? NOT_INFORMED}</DefaultText>
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
          <FiAward style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Traços
          </Label>
        </div>
        <div className="flex flex-col gap-2 px-3 py-3">
          {armor.traits.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {armor.traits.map((trait) => (
            <EntityReferenceCard
              key={trait.id}
              reference={{
                id: trait.id,
                name: trait.name,
                entityType: 'trait',
                tags: trait.tags,
              }}
            />
          ))}
        </div>
      </div>

      <EmbeddedEffectsSectionView
        icon={GiMagicSwirl}
        label="Encantamentos"
        items={armor.enchantments}
      />

      <EmbeddedEffectsSectionView
        icon={GiUpgrade}
        label="Aprimoramentos"
        items={armor.enhancements}
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
          <RichTextViewer value={armor.description} emptyLabel={NOT_INFORMED} />
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
              value={armor.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
