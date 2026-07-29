'use client';

import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { FiGitBranch } from 'react-icons/fi';
import { Label } from '@/shared/components/Texts';
import { FamilyGenealogyBoard } from '@/shared/components/FamilyGenealogyBoard';
import { useGetEntityById } from '@/hooks/Queries';
import { IFamily } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CharacterFamilyTreeSectionProps {
  familyId: string;
  familyName: string;
}

export const CharacterFamilyTreeSection = ({
  familyId,
  familyName,
}: CharacterFamilyTreeSectionProps) => {
  const {
    data: family,
    isLoading,
    isError,
    error,
  } = useGetEntityById<IFamily>({ url: `/families/${familyId}` });

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar a árvore genealógica.',
      type: 'error',
    });
  }, [isError, error]);

  return (
    <div
      className="flex-1 min-w-0 flex flex-col"
      style={APP_CONTAINER_STYLES.detailSectionBox}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiGitBranch style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Árvore genealógica — {familyName}
        </Label>
      </div>
      <div className="flex-1 px-3 py-3">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <CircularProgress size={24} />
          </div>
        )}

        {!isLoading && family && (
          <FamilyGenealogyBoard
            mode="readOnly"
            members={family.members.map((member) => ({
              character: member.character,
              positionX: member.positionX,
              positionY: member.positionY,
            }))}
            relationships={family.relationships.map((relationship) => ({
              id: relationship.id,
              sourceCharacterId: relationship.sourceCharacter.id,
              targetCharacterId: relationship.targetCharacter.id,
              type: relationship.type,
            }))}
          />
        )}
      </div>
    </div>
  );
};
