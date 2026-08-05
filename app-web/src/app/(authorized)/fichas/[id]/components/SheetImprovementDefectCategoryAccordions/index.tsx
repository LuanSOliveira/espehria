'use client';

import { SyntheticEvent, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { FiChevronDown } from 'react-icons/fi';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { ISheetImprovementDefectSnapshot } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import {
  SHEET_IMPROVEMENT_DEFECT_CATEGORIES,
  SheetImprovementDefectCategoryKey,
} from '../../data';

export interface SheetImprovementDefectCategoryAccordionsProps {
  items: ISheetImprovementDefectSnapshot;
  emptyMessage?: string;
}

export const SheetImprovementDefectCategoryAccordions = ({
  items,
  emptyMessage = 'Nenhum item adicionado.',
}: SheetImprovementDefectCategoryAccordionsProps) => {
  const [expandedKeys, setExpandedKeys] = useState<
    Set<SheetImprovementDefectCategoryKey>
  >(new Set());

  const handleExpandAll = () => {
    setExpandedKeys(
      new Set(SHEET_IMPROVEMENT_DEFECT_CATEGORIES.map((category) => category.key)),
    );
  };

  const handleCollapseAll = () => {
    setExpandedKeys(new Set());
  };

  const handleAccordionChange =
    (key: SheetImprovementDefectCategoryKey) =>
    (_: SyntheticEvent, isExpanded: boolean) => {
      setExpandedKeys((previous) => {
        const next = new Set(previous);

        if (isExpanded) {
          next.add(key);
        } else {
          next.delete(key);
        }

        return next;
      });
    };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <SecondaryButton
          type="button"
          onClick={handleExpandAll}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Expandir todos
        </SecondaryButton>

        <SecondaryButton
          type="button"
          onClick={handleCollapseAll}
          sx={{ width: 'auto', padding: '10px 20px' }}
        >
          Recolher todos
        </SecondaryButton>
      </div>

      {SHEET_IMPROVEMENT_DEFECT_CATEGORIES.map((category) => {
        const categoryItems = items[category.key];

        return (
          <Accordion
            key={category.key}
            disableGutters
            expanded={expandedKeys.has(category.key)}
            onChange={handleAccordionChange(category.key)}
            sx={{
              backgroundColor: APP_COLORS.parchmentLight,
              border: `1px solid ${APP_COLORS.goldDark}`,
              borderRadius: '6px !important',
              overflow: 'hidden',
              '&::before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={
                <FiChevronDown style={{ color: APP_COLORS.goldSoft }} />
              }
              sx={{
                backgroundImage: `linear-gradient(180deg, ${APP_COLORS.woodLight} 0%, ${APP_COLORS.wood} 100%)`,
              }}
            >
              <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
                {category.label.toUpperCase()}
              </Label>
            </AccordionSummary>

            <AccordionDetails>
              <div className="flex flex-col gap-2">
                {categoryItems.length === 0 && (
                  <DefaultText>{emptyMessage}</DefaultText>
                )}

                {categoryItems.map((item) => (
                  <div
                    key={`${item.id ?? 'livre'}-${item.type.id}-${item.property.id}`}
                    className="flex flex-col gap-1"
                  >
                    <ImprovementDefectCard item={item} />
                    {item.sourceName && (
                      <DefaultText sx={{ fontStyle: 'italic', marginLeft: '8px' }}>
                        {`Concedida por: ${item.sourceName}`}
                      </DefaultText>
                    )}
                  </div>
                ))}
              </div>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
};
