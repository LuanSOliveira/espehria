'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { IconType } from 'react-icons';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiBookmark,
  FiCheckSquare,
  FiDroplet,
  FiEye,
  FiFeather,
  FiFileText,
  FiGlobe,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiImage,
  FiList,
  FiLock,
  FiSmile,
  FiTag,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiWind,
  FiZap,
} from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { useGetEntityById } from '@/hooks/Queries';
import { IDivinity } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface DivinityViewProps {
  divinityId: string;
  /**
   * Chamado quando a divindade não é encontrada (404) — usado pelo
   * EntityMentionViewDispatcher para fechar o modal aberto a partir de uma
   * menção órfã (entidade excluída).
   */
  onNotFound?: () => void;
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

export const DivinityView = ({ divinityId, onNotFound }: DivinityViewProps) => {
  const {
    data: divinity,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IDivinity>({ url: `/divinities/${divinityId}` });

  const isGoogleUser = useIsGoogleUser();
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isSacredSymbolPreviewOpen, setIsSacredSymbolPreviewOpen] =
    useState(false);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const isNotFound = error?.response?.status === 404;

    showToast({
      message: isNotFound
        ? 'Entidade não encontrada.'
        : (error?.response?.data?.message ??
          'Não foi possível carregar os dados da divindade.'),
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
        <DefaultText>Carregando dados da divindade...</DefaultText>
      </div>
    );
  }

  if (!divinity) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        {divinity.referenceImage ? (
          <>
            <Box
              component="button"
              type="button"
              aria-label={`Ampliar imagem de ${divinity.name}`}
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
                src={divinity.referenceImage}
                alt={divinity.name}
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
              imageUrl={divinity.referenceImage}
              alt={divinity.name}
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

          <div className="flex flex-col items-start gap-1">
            <Label component="span" sx={{ margin: 0 }}>
              Símbolo Sagrado
            </Label>

            {divinity.sacredSymbol ? (
              <>
                <button
                  type="button"
                  aria-label={`Ampliar símbolo sagrado de ${divinity.name}`}
                  onClick={() => setIsSacredSymbolPreviewOpen(true)}
                  className="cursor-pointer self-start border-0 bg-transparent p-0"
                >
                  <Box
                    component="img"
                    src={divinity.sacredSymbol}
                    alt={`Símbolo sagrado de ${divinity.name}`}
                    sx={{
                      width: 96,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: `2px solid ${APP_COLORS.gold}`,
                    }}
                  />
                </button>

                <ImagePreviewDialog
                  open={isSacredSymbolPreviewOpen}
                  onClose={() => setIsSacredSymbolPreviewOpen(false)}
                  imageUrl={divinity.sacredSymbol}
                  alt={`Símbolo sagrado de ${divinity.name}`}
                />
              </>
            ) : (
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: APP_COLORS.wood,
                  color: APP_COLORS.gold,
                  borderRadius: '6px',
                  border: `2px solid ${APP_COLORS.gold}`,
                }}
              >
                <FiImage style={{ fontSize: 32 }} />
              </Box>
            )}
          </div>

          {divinity.titles && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiBookmark
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Títulos
                </Label>
                <DefaultText>{divinity.titles}</DefaultText>
              </div>
            </div>
          )}

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

          {divinity.primaryElement && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiWind
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Elemento Primário
                </Label>
                <DefaultText>{divinity.primaryElement}</DefaultText>
              </div>
            </div>
          )}

          {divinity.sacredAnimal && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiFeather
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Animal Sagrado
                </Label>
                <DefaultText>{divinity.sacredAnimal}</DefaultText>
              </div>
            </div>
          )}

          {divinity.sacredColor && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={APP_CONTAINER_STYLES.detailInfoField}
            >
              <FiDroplet
                style={{ fontSize: 16, color: APP_COLORS.gold, marginTop: 2 }}
              />
              <div>
                <Label component="span" sx={{ margin: 0 }}>
                  Cor Sagrada
                </Label>
                <DefaultText>{divinity.sacredColor}</DefaultText>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DivinitySectionBox
          label="Descrição"
          icon={FiFileText}
          value={divinity.description}
        />

        <DivinitySectionBox
          label="Personalidade"
          icon={FiSmile}
          value={divinity.personality}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DivinitySectionBox
            label="Domínios Divinos"
            icon={FiGlobe}
            value={divinity.divineDomains}
          />

          <DivinitySectionBox
            label="Poderes"
            icon={FiZap}
            value={divinity.powers}
          />
        </div>

        <DivinitySectionBox
          label="Influência no Mundo"
          icon={FiTrendingUp}
          value={divinity.worldInfluence}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DivinitySectionBox
            label="Aparência Divina"
            icon={FiEye}
            value={divinity.divineAppearance}
          />

          <DivinitySectionBox
            label="Avatares"
            icon={FiUsers}
            value={divinity.avatars}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DivinitySectionBox
            label="Igreja"
            icon={FiHome}
            value={divinity.church}
          />

          <DivinitySectionBox
            label="Culto"
            icon={FiUserCheck}
            value={divinity.cult}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DivinitySectionBox
            label="Bênçãos"
            icon={FiHeart}
            value={divinity.blessings}
          />

          <DivinitySectionBox
            label="Maldições"
            icon={FiAlertTriangle}
            value={divinity.curses}
          />
        </div>

        <DivinitySectionBox
          label="Lendas"
          icon={FiBookOpen}
          value={divinity.legends}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DivinitySectionBox
            label="Mandamentos"
            icon={FiList}
            value={divinity.commandments}
          />

          <DivinitySectionBox
            label="Juramentos"
            icon={FiCheckSquare}
            value={divinity.oaths}
          />
        </div>

        <DivinitySectionBox
          label="Curiosidades"
          icon={FiHelpCircle}
          value={divinity.curiosities}
        />

        {!isGoogleUser && (
          <DivinitySectionBox
            label="Informações Privadas"
            icon={FiLock}
            value={divinity.privateInformation}
          />
        )}
      </div>
    </div>
  );
};
