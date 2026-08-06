'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { FiHelpCircle } from 'react-icons/fi';
import { DefaultTextInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetKnowledgeCardProps {
  title: string;
  gradationName: string;
  sourceName: string;
  editable: boolean;
  note: string | null;
  total: number;
  onOpenDetail: () => void;
  onSaveNote: (note: string) => void;
  isSavingNote?: boolean;
}

export const SheetKnowledgeCard = ({
  title,
  gradationName,
  sourceName,
  editable,
  note,
  total,
  onOpenDetail,
  onSaveNote,
  isSavingNote,
}: SheetKnowledgeCardProps) => {
  const totalLabel = total > 0 ? `+${total}` : `${total}`;

  const [noteValue, setNoteValue] = useState(note ?? '');
  const lastSavedNoteRef = useRef(note ?? '');

  useEffect(() => {
    setNoteValue(note ?? '');
    lastSavedNoteRef.current = note ?? '';
  }, [note]);

  const handleBlur = () => {
    if (noteValue === lastSavedNoteRef.current) {
      return;
    }

    lastSavedNoteRef.current = noteValue;
    onSaveNote(noteValue);
  };

  return (
    <Box sx={{ position: 'relative', ...APP_CONTAINER_STYLES.detailSectionBox }}>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="flex flex-1 flex-col gap-1">
          <Label component="span" sx={{ margin: 0 }}>
            {title}
          </Label>
          <DefaultText>{`Graduação: ${gradationName}`}</DefaultText>
          <DefaultText sx={{ fontStyle: 'italic' }}>
            {`Concedida por: ${sourceName}`}
          </DefaultText>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-row items-center gap-2">
            <Tooltip title="Ver detalhamento do bônus">
              <IconButton
                aria-label="Ver detalhamento do bônus"
                onClick={onOpenDetail}
                size="small"
                sx={{
                  color: APP_COLORS.textBrownDark,
                  border: `1px solid ${APP_COLORS.gold}`,
                }}
              >
                <FiHelpCircle style={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: APP_COLORS.wood,
                border: `1px solid ${APP_COLORS.gold}`,
              }}
            >
              <DefaultText
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: APP_COLORS.goldSoft,
                }}
              >
                {totalLabel}
              </DefaultText>
            </Box>
          </div>

          {editable && (
            <DefaultTextInput
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              onBlur={handleBlur}
              disabled={isSavingNote}
              placeholder="Anotações"
              slotProps={{
                htmlInput: {
                  maxLength: 2000,
                  'aria-label': `Anotação do saber ${title}`,
                },
              }}
            />
          )}
        </div>
      </div>
    </Box>
  );
};
