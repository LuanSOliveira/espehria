'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { IconButton, TextField, Tooltip } from '@mui/material';
import { FiHeart, FiHelpCircle } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetHitPointsPanelProps {
  currentValue: number | null;
  onCurrentChange: (value: number | null) => void;
  temporaryValue: number | null;
  onTemporaryChange: (value: number | null) => void;
  maxValue: number;
  onOpenDetail: () => void;
}

const INTEGER_PATTERN = /^-?\d+$/;

const toBufferValue = (value: number | null) =>
  value === null ? '' : String(value);

const NO_BORDER_TEXT_FIELD_SX = {
  '& .MuiInput-root:before': { borderBottom: 'none' },
  '& .MuiInput-root:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
  '& .MuiInput-root:after': { borderBottom: `2px solid ${APP_COLORS.gold}` },
};

/**
 * Buffer de string local para PV atual/temporário: diferente de
 * `SheetLevelField`, aqui vazio é um estado válido (persiste `null`) e
 * negativo é permitido, então um estado intermediário como `-` sozinho
 * precisa ficar só no buffer sem ser propagado ao pai — se o valor
 * controlado nunca refletisse o `-`, o campo "esnaparia" de volta a cada
 * keystroke inválida.
 */
export const SheetHitPointsPanel = ({
  currentValue,
  onCurrentChange,
  temporaryValue,
  onTemporaryChange,
  maxValue,
  onOpenDetail,
}: SheetHitPointsPanelProps) => {
  const [currentRawValue, setCurrentRawValue] = useState(
    toBufferValue(currentValue),
  );
  const [temporaryRawValue, setTemporaryRawValue] = useState(
    toBufferValue(temporaryValue),
  );

  useEffect(() => {
    setCurrentRawValue(toBufferValue(currentValue));
  }, [currentValue]);

  useEffect(() => {
    setTemporaryRawValue(toBufferValue(temporaryValue));
  }, [temporaryValue]);

  const handleChange = (
    rawValue: string,
    setRawValue: (value: string) => void,
    onChange: (value: number | null) => void,
  ) => {
    setRawValue(rawValue);

    if (rawValue === '') {
      onChange(null);
      return;
    }

    if (INTEGER_PATTERN.test(rawValue)) {
      onChange(Number(rawValue));
    }
  };

  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiHeart style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Pontos de Vida
        </Label>
      </div>

      <div className="flex flex-col items-center gap-6 p-4 sm:flex-row sm:justify-center">
        <div className="flex items-end gap-2">
          <div className="flex flex-col items-center">
            <Label htmlFor="sheet-hit-points-current">PV atual</Label>
            <TextField
              id="sheet-hit-points-current"
              variant="standard"
              type="number"
              value={currentRawValue}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange(
                  event.target.value,
                  setCurrentRawValue,
                  onCurrentChange,
                )
              }
              slotProps={{
                htmlInput: {
                  style: {
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: APP_COLORS.goldSoft,
                    width: '72px',
                  },
                },
              }}
              sx={NO_BORDER_TEXT_FIELD_SX}
            />
          </div>

          <DefaultText
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              color: APP_COLORS.textBrownDark,
              marginBottom: '4px',
            }}
          >
            /
          </DefaultText>

          <div className="flex flex-col items-center">
            <Label>PV máximo</Label>
            <DefaultText
              id="sheet-hit-points-max"
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: APP_COLORS.textBrownDark,
              }}
            >
              {maxValue}
            </DefaultText>
          </div>

          <Tooltip title="Ver detalhamento do bônus">
            <IconButton
              aria-label="Ver detalhamento do bônus"
              onClick={onOpenDetail}
              size="small"
              sx={{
                color: APP_COLORS.textBrownDark,
                border: `1px solid ${APP_COLORS.gold}`,
                marginBottom: '4px',
              }}
            >
              <FiHelpCircle style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </div>

        <div className="flex flex-col items-center">
          <Label htmlFor="sheet-hit-points-temporary">PV temporário</Label>
          <TextField
            id="sheet-hit-points-temporary"
            variant="standard"
            type="number"
            value={temporaryRawValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleChange(
                event.target.value,
                setTemporaryRawValue,
                onTemporaryChange,
              )
            }
            slotProps={{
              htmlInput: {
                style: {
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  width: '56px',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
