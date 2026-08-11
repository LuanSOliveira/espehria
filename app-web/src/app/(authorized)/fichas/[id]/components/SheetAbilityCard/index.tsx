'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FiAlertTriangle, FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { TagBadge } from '@/shared/components/TagBadge';
import { ConfirmationModal } from '@/shared/components/Modals';
import { useEntityMentionViewStore } from '@/store';
import { ISheetAbilityBucketType, ITag } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetAbilityCardProps {
  name: string;
  level: number;
  tags: ITag[];
  entityType: ISheetAbilityBucketType;
  entityId: string;
  requirementsMet: boolean;
  /**
   * Indicativo textual de origem (ex.: "via Raça Anão"), exibido apenas em
   * cards herdados. Ausente em cards de slot/extra.
   */
  sourceLabel?: string;
  /**
   * Quando ausente, a ação "Remover" não é renderizada — usado para cards
   * herdados, que não podem ser removidos diretamente (spec, decisão de
   * investigação nº 8).
   */
  onRemove?: () => void;
  isRemoving?: boolean;
}

/**
 * Card único reaproveitado nas 3 sub-abas de Habilidades, para os 3 tipos de
 * exibição possíveis: herdado (`sourceLabel` presente, sem `onRemove`), extra
 * e slot preenchido (sem `sourceLabel`, com `onRemove`).
 */
export const SheetAbilityCard = ({
  name,
  level,
  tags,
  entityType,
  entityId,
  requirementsMet,
  sourceLabel,
  onRemove,
  isRemoving = false,
}: SheetAbilityCardProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  return (
    <>
      <div className="h-full" style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            color: APP_COLORS.textBrownDark,
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {level}
        </span>

        <div
          className="flex h-full items-center gap-3 px-3 py-2"
          style={APP_CONTAINER_STYLES.detailInfoField}
        >
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <DefaultText sx={{ fontWeight: 700 }}>{name}</DefaultText>

              {!requirementsMet && (
                <Tooltip title="Requisitos pendentes">
                  <span className="flex items-center">
                    <FiAlertTriangle
                      style={{ fontSize: 16, color: APP_COLORS.alertRed }}
                    />
                  </span>
                </Tooltip>
              )}
            </div>

            {sourceLabel && (
              <DefaultText sx={{ fontStyle: 'italic' }}>
                {sourceLabel}
              </DefaultText>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}
          </div>

          <Tooltip title="Visualizar">
            <IconButton
              aria-label={`Visualizar ${name}`}
              onClick={() => openEntityView(entityType, entityId)}
              sx={{ color: APP_COLORS.textBrownDark }}
            >
              <FiEye />
            </IconButton>
          </Tooltip>

          {onRemove && (
            <Tooltip title="Remover">
              <IconButton
                aria-label={`Remover ${name}`}
                onClick={() => setIsConfirmOpen(true)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiTrash2 />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      {onRemove && (
        <ConfirmationModal
          open={isConfirmOpen}
          title="Remover habilidade"
          message={`Tem certeza que deseja remover "${name}" desta ficha?`}
          confirmLabel="Remover"
          isLoading={isRemoving}
          onConfirm={() => {
            onRemove();
            setIsConfirmOpen(false);
          }}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </>
  );
};
