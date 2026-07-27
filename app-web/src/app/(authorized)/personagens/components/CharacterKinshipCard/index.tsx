'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FiCheck, FiEdit2, FiEye, FiTrash2, FiX } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { useEntityMentionViewStore } from '@/store';
import { ICharacterSummary } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CharacterKinshipCardProps {
  relative: ICharacterSummary;
  kinship: string;
  /**
   * Presente apenas no contexto do formulário de cadastro/edição — habilita a
   * edição inline do texto livre de parentesco. O personagem referenciado
   * (relative) permanece fixo; para trocá-lo, o card deve ser removido e um
   * novo adicionado.
   */
  onEdit?: (newKinship: string) => void;
  /**
   * Presente apenas no contexto do formulário de cadastro/edição.
   */
  onRemove?: () => void;
}

export const CharacterKinshipCard = ({
  relative,
  kinship,
  onEdit,
  onRemove,
}: CharacterKinshipCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftKinship, setDraftKinship] = useState(kinship);

  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  const handleStartEdit = () => {
    setDraftKinship(kinship);
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    if (!draftKinship.trim()) {
      return;
    }

    onEdit?.(draftKinship.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailInfoField}
      >
        <ImageAvatarPreview
          imageUrl={relative.referenceImage}
          alt={relative.name}
        />
        <DefaultText className="flex-1">{relative.name}</DefaultText>
        <div className="flex-1">
          <DefaultTextInput
            id={`character-kinship-edit-${relative.id}`}
            value={draftKinship}
            onChange={(event) => setDraftKinship(event.target.value)}
            placeholder="Grau de parentesco"
          />
        </div>

        <Tooltip title="Confirmar">
          <IconButton
            aria-label="Confirmar edição do parentesco"
            onClick={handleConfirmEdit}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiCheck />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar">
          <IconButton
            aria-label="Cancelar edição do parentesco"
            onClick={handleCancelEdit}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiX />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <ImageAvatarPreview
        imageUrl={relative.referenceImage}
        alt={relative.name}
      />
      <DefaultText className="flex-1">
        {relative.name} — {kinship}
      </DefaultText>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${relative.name}`}
          onClick={() => openEntityView('character', relative.id)}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>

      {onEdit && (
        <Tooltip title="Editar">
          <IconButton
            aria-label={`Editar parentesco com ${relative.name}`}
            onClick={handleStartEdit}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>
      )}

      {onRemove && (
        <Tooltip title="Excluir">
          <IconButton
            aria-label={`Excluir parentesco com ${relative.name}`}
            onClick={onRemove}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
