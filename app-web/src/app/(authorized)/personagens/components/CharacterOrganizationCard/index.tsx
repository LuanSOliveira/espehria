'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiEye } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { useEntityMentionViewStore } from '@/store';
import { IOrganizationSummary } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CharacterOrganizationCardProps {
  organization: IOrganizationSummary;
}

/**
 * Card somente leitura — o quadro de Organizações do CharacterView é derivado
 * (calculado pelo backend a partir dos vínculos de membro de organização), não
 * havendo ação de editar/remover aqui.
 */
export const CharacterOrganizationCard = ({
  organization,
}: CharacterOrganizationCardProps) => {
  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <ImageAvatarPreview
        imageUrl={organization.referenceImage}
        alt={organization.name}
      />
      <DefaultText className="flex-1">{organization.name}</DefaultText>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${organization.name}`}
          onClick={() => openEntityView('organization', organization.id)}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>
    </div>
  );
};
