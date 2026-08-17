'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import {
  FiAward,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiImage,
  FiLock,
  FiMaximize2,
  FiNavigation,
  FiPackage,
  FiRefreshCw,
  FiRotateCw,
  FiTag,
  FiTarget,
  FiZap,
} from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { EntityReferenceCard } from '@/shared/components/EntityReferenceCard';
import { useGetEntityById } from '@/hooks/Queries';
import { IWeapon } from '@/shared/interfaces';
import {
  formatPriceWithCurrency,
  getContrastTextColor,
  showToast,
} from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import {
  WEAPON_DAMAGE_DIE_OPTIONS,
  WEAPON_HANDS_OPTIONS,
  WEAPON_STYLE_OPTIONS,
} from '../../data';

export interface WeaponViewProps {
  weaponId: string;
  /**
   * Chamado quando a arma não é encontrada (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
}

const NOT_INFORMED = 'Não informado';

export const WeaponView = ({ weaponId, onNotFound }: WeaponViewProps) => {
  const {
    data: weapon,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IWeapon>({
    url: `/weapons/${weaponId}`,
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
          'Não foi possível carregar os dados da arma.'),
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
        <DefaultText>Carregando dados da arma...</DefaultText>
      </div>
    );
  }

  if (!weapon) {
    return null;
  }

  const handsLabel = WEAPON_HANDS_OPTIONS.find(
    (option) => option.value === weapon.hands,
  )?.label;
  const weaponStyleLabel = WEAPON_STYLE_OPTIONS.find(
    (option) => option.value === weapon.weaponStyle,
  )?.label;
  const damageDieLabel = WEAPON_DAMAGE_DIE_OPTIONS.find(
    (option) => option.value === weapon.damageDie,
  )?.label;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {weapon.referenceImage ? (
          <>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${weapon.name}`}
              onClick={() => setIsImagePreviewOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Box
                component="img"
                src={weapon.referenceImage}
                alt={weapon.name}
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
              imageUrl={weapon.referenceImage}
              alt={weapon.name}
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
            {weapon.name}
          </Title>

          {weapon.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {weapon.tags.map((tag) => (
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
                  {formatPriceWithCurrency(weapon.price, weapon.currency)}
                </DefaultText>
              </div>
            </div>

            {weapon.nickname && (
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
                  <DefaultText>{weapon.nickname}</DefaultText>
                </div>
              </div>
            )}

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiMaximize2
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Grau de Tamanho
                </Label>
                <DefaultText>{weapon.sizeGrade?.name ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiGrid
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Mãos
                </Label>
                <DefaultText>{handsLabel ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiTarget
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Estilo de Arma
                </Label>
                <DefaultText>{weaponStyleLabel ?? NOT_INFORMED}</DefaultText>
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
                <DefaultText>{weapon.volume ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiNavigation
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Distância (Metros)
                </Label>
                <DefaultText>{weapon.distanceMeters ?? NOT_INFORMED}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiRefreshCw
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Usa Munição
                </Label>
                <DefaultText>{weapon.usesAmmunition ? 'Sim' : 'Não'}</DefaultText>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiRotateCw
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Ações de Recarga
                </Label>
                <DefaultText>{weapon.reloadActions ?? NOT_INFORMED}</DefaultText>
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
          {weapon.traits.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {weapon.traits.map((trait) => (
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

      <div
        className="flex-1 min-w-0 flex flex-col"
        style={APP_CONTAINER_STYLES.detailSectionBox}
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
        >
          <FiZap style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Dano
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Valor
            </Label>
            <DefaultText>{weapon.damageValue ?? NOT_INFORMED}</DefaultText>
          </div>
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Dado
            </Label>
            <DefaultText>{damageDieLabel ?? NOT_INFORMED}</DefaultText>
          </div>
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Tipo de dano
            </Label>
            <DefaultText>{weapon.damageType?.name ?? NOT_INFORMED}</DefaultText>
          </div>
          <div>
            <Label component="span" sx={{ margin: 0 }}>
              Dano Mágico
            </Label>
            <DefaultText>{weapon.magicalDamage ? 'Sim' : 'Não'}</DefaultText>
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
          <FiZap style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Dano Alternativo
          </Label>
        </div>
        <div className="flex flex-col gap-3 px-3 py-3">
          {weapon.alternativeDamages.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {weapon.alternativeDamages.map((damage) => {
            const alternativeDamageDieLabel = WEAPON_DAMAGE_DIE_OPTIONS.find(
              (option) => option.value === damage.damageDie,
            )?.label;

            return (
              <div
                key={damage.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Valor
                  </Label>
                  <DefaultText>{damage.damageValue ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Dado
                  </Label>
                  <DefaultText>
                    {alternativeDamageDieLabel ?? NOT_INFORMED}
                  </DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Tipo de dano
                  </Label>
                  <DefaultText>
                    {damage.damageType?.name ?? NOT_INFORMED}
                  </DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Dano Mágico
                  </Label>
                  <DefaultText>{damage.magicalDamage ? 'Sim' : 'Não'}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Distância (Metros)
                  </Label>
                  <DefaultText>{damage.distanceMeters ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Ações de Recarga
                  </Label>
                  <DefaultText>{damage.reloadActions ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Usa Munição
                  </Label>
                  <DefaultText>
                    {damage.usesAmmunition ? 'Sim' : 'Não'}
                  </DefaultText>
                </div>
              </div>
            );
          })}
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
          <FiZap style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
          <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
            Dano Extra
          </Label>
        </div>
        <div className="flex flex-col gap-3 px-3 py-3">
          {weapon.extraDamages.length === 0 && (
            <DefaultText>Nenhum item adicionado.</DefaultText>
          )}
          {weapon.extraDamages.map((damage) => {
            const extraDamageDieLabel = WEAPON_DAMAGE_DIE_OPTIONS.find(
              (option) => option.value === damage.damageDie,
            )?.label;

            return (
              <div
                key={damage.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Valor
                  </Label>
                  <DefaultText>{damage.damageValue ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Dado
                  </Label>
                  <DefaultText>{extraDamageDieLabel ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Tipo de dano
                  </Label>
                  <DefaultText>
                    {damage.damageType?.name ?? NOT_INFORMED}
                  </DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Dano Mágico
                  </Label>
                  <DefaultText>{damage.magicalDamage ? 'Sim' : 'Não'}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Distância (Metros)
                  </Label>
                  <DefaultText>{damage.distanceMeters ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Ações de Recarga
                  </Label>
                  <DefaultText>{damage.reloadActions ?? NOT_INFORMED}</DefaultText>
                </div>
                <div>
                  <Label component="span" sx={{ margin: 0 }}>
                    Usa Munição
                  </Label>
                  <DefaultText>
                    {damage.usesAmmunition ? 'Sim' : 'Não'}
                  </DefaultText>
                </div>
              </div>
            );
          })}
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
          <RichTextViewer value={weapon.description} emptyLabel={NOT_INFORMED} />
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
              value={weapon.privateInformation}
              emptyLabel={NOT_INFORMED}
            />
          </div>
        </div>
      )}
    </div>
  );
};
