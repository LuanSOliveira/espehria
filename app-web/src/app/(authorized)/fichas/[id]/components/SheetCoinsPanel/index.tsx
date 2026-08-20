'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { IconButton, TextField, Tooltip } from '@mui/material';
import { FiArrowLeft, FiArrowRight, FiDollarSign } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetCoinsValues {
  pc: number;
  pp: number;
  po: number;
  pl: number;
}

export interface SheetCoinsPanelProps {
  values: SheetCoinsValues;
  onChange: (values: SheetCoinsValues) => void;
}

type CoinKey = keyof SheetCoinsValues;

const COIN_FIELDS: { key: CoinKey; label: string }[] = [
  { key: 'pc', label: 'PC (Cobre)' },
  { key: 'pp', label: 'PP (Prata)' },
  { key: 'po', label: 'PO (Ouro)' },
  { key: 'pl', label: 'PL (Platina)' },
];

const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;

const toBuffers = (values: SheetCoinsValues): Record<CoinKey, string> => ({
  pc: String(values.pc),
  pp: String(values.pp),
  po: String(values.po),
  pl: String(values.pl),
});

const ARROW_BUTTON_SX = {
  color: APP_COLORS.textBrownDark,
  border: `1px solid ${APP_COLORS.gold}`,
};

/**
 * Buffer de string local por moeda, sincronizado com `values` (mesmo padrão
 * de `SheetHitPointsPanel`) — necessário porque `values` também muda
 * externamente ao clicar nas setas de conversão, e não apenas por digitação.
 */
export const SheetCoinsPanel = ({ values, onChange }: SheetCoinsPanelProps) => {
  const [buffers, setBuffers] = useState<Record<CoinKey, string>>(() =>
    toBuffers(values),
  );

  useEffect(() => {
    setBuffers(toBuffers(values));
  }, [values.pc, values.pp, values.po, values.pl]);

  const handleInputChange = (
    key: CoinKey,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const rawValue = event.target.value;

    if (!NON_NEGATIVE_INTEGER_PATTERN.test(rawValue)) {
      return;
    }

    setBuffers((previous) => ({ ...previous, [key]: rawValue }));
    onChange({ ...values, [key]: Number(rawValue) });
  };

  const handleConvertUp = (lowerKey: CoinKey, higherKey: CoinKey) => {
    if (values[lowerKey] < 10) {
      return;
    }

    onChange({
      ...values,
      [lowerKey]: values[lowerKey] - 10,
      [higherKey]: values[higherKey] + 1,
    });
  };

  const handleConvertDown = (lowerKey: CoinKey, higherKey: CoinKey) => {
    if (values[higherKey] < 1) {
      return;
    }

    onChange({
      ...values,
      [lowerKey]: values[lowerKey] + 10,
      [higherKey]: values[higherKey] - 1,
    });
  };

  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiDollarSign style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Moedas
        </Label>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-center gap-6">
          {COIN_FIELDS.map((field, index) => (
            <div key={field.key} className="flex items-end gap-6">
              <div className="flex flex-col items-center">
                <Label htmlFor={`sheet-coins-${field.key}`}>
                  {field.label}
                </Label>
                <TextField
                  id={`sheet-coins-${field.key}`}
                  variant="standard"
                  type="number"
                  value={buffers[field.key]}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(field.key, event)
                  }
                  slotProps={{
                    htmlInput: {
                      style: { textAlign: 'center', width: '64px' },
                    },
                  }}
                />
              </div>

              {index < COIN_FIELDS.length - 1 && (
                <div className="flex flex-col items-center gap-1 pb-1">
                  <Tooltip
                    title={`Converter 10 ${field.label} em 1 ${COIN_FIELDS[index + 1].label}`}
                  >
                    <span>
                      <IconButton
                        aria-label={`Converter 10 ${field.label} em 1 ${COIN_FIELDS[index + 1].label}`}
                        size="small"
                        disabled={values[field.key] < 10}
                        onClick={() =>
                          handleConvertUp(field.key, COIN_FIELDS[index + 1].key)
                        }
                        sx={ARROW_BUTTON_SX}
                      >
                        <FiArrowRight style={{ fontSize: 14 }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={`Converter 1 ${COIN_FIELDS[index + 1].label} em 10 ${field.label}`}
                  >
                    <span>
                      <IconButton
                        aria-label={`Converter 1 ${COIN_FIELDS[index + 1].label} em 10 ${field.label}`}
                        size="small"
                        disabled={values[COIN_FIELDS[index + 1].key] < 1}
                        onClick={() =>
                          handleConvertDown(
                            field.key,
                            COIN_FIELDS[index + 1].key,
                          )
                        }
                        sx={ARROW_BUTTON_SX}
                      >
                        <FiArrowLeft style={{ fontSize: 14 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              )}
            </div>
          ))}
        </div>

        <DefaultText sx={{ fontStyle: 'italic', textAlign: 'center' }}>
          *A cada 1000 moedas 1 volume será adicionado ao inventário
        </DefaultText>
      </div>
    </div>
  );
};
