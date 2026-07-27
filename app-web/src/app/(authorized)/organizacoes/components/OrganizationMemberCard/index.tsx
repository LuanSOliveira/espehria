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

export interface OrganizationMemberCardProps {
  character: ICharacterSummary;
  role: string;
  /**
   * Presente apenas no contexto do formulário de cadastro/edição — habilita a
   * edição inline da função exercida na organização. O personagem
   * referenciado permanece fixo; para trocá-lo, o card deve ser removido e um
   * novo adicionado.
   */
  onEdit?: (newRole: string) => void;
  /**
   * Presente apenas no contexto do formulário de cadastro/edição.
   */
  onRemove?: () => void;
}

export const OrganizationMemberCard = ({
  character,
  role,
  onEdit,
  onRemove,
}: OrganizationMemberCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRole, setDraftRole] = useState(role);

  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  const handleStartEdit = () => {
    setDraftRole(role);
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    if (!draftRole.trim()) {
      return;
    }

    onEdit?.(draftRole.trim());
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
          imageUrl={character.referenceImage}
          alt={character.name}
        />
        <DefaultText className="flex-1">{character.name}</DefaultText>
        <div className="flex-1">
          <DefaultTextInput
            id={`organization-member-edit-${character.id}`}
            value={draftRole}
            onChange={(event) => setDraftRole(event.target.value)}
            placeholder="Função na organização"
          />
        </div>

        <Tooltip title="Confirmar">
          <IconButton
            aria-label="Confirmar edição da função"
            onClick={handleConfirmEdit}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiCheck />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar">
          <IconButton
            aria-label="Cancelar edição da função"
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
        imageUrl={character.referenceImage}
        alt={character.name}
      />
      <DefaultText className="flex-1">
        {character.name} — {role}
      </DefaultText>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${character.name}`}
          onClick={() => openEntityView('character', character.id)}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>

      {onEdit && (
        <Tooltip title="Editar">
          <IconButton
            aria-label={`Editar função de ${character.name}`}
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
            aria-label={`Excluir ${character.name} dos membros`}
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
