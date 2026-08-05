'use client';

import { useMemo } from 'react';
import { DefaultAutocompleteInput } from '@/shared/components/Inputs';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ProficiencyCard } from '@/shared/components/ProficiencyCard';
import {
  IProficiencyProperty,
  ISheetProficiencyAdjustmentEntry,
} from '@/shared/interfaces';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetAdjustedProficienciesSectionProps {
  items: ISheetProficiencyAdjustmentEntry[];
  /**
   * Todas as propriedades de proficiência, já excluindo as que estão
   * aplicadas na aba principal da ficha (calculado pelo componente pai). O
   * restante da regra de ocultação (propriedade original de qualquer ajuste
   * e propriedade substituta já escolhida em outro ajuste) é calculado aqui,
   * por item, a partir de `items`.
   */
  propertyOptions: IProficiencyProperty[];
  onSelectSubstitute: (adjustmentId: string, propertyId: string) => void;
  isSaving?: (adjustmentId: string) => boolean;
  emptyMessage?: string;
}

export const SheetAdjustedProficienciesSection = ({
  items,
  propertyOptions,
  onSelectSubstitute,
  isSaving,
  emptyMessage = 'Nenhum ajuste pendente.',
}: SheetAdjustedProficienciesSectionProps) => {
  const optionsByAdjustmentId = useMemo(() => {
    const originalPropertyIds = new Set(
      items.map((item) => item.originalProperty.id),
    );

    return new Map(
      items.map((item) => {
        const otherChosenIds = new Set(
          items
            .filter(
              (other) => other.id !== item.id && other.adjustedProperty,
            )
            .map((other) => other.adjustedProperty!.id),
        );

        const options = propertyOptions.filter(
          (property) =>
            !originalPropertyIds.has(property.id) &&
            !otherChosenIds.has(property.id),
        );

        return [item.id, options] as const;
      }),
    );
  }, [items, propertyOptions]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Label component="span" sx={{ margin: 0 }}>
          Proficiências Ajustadas
        </Label>
        <DefaultText>{emptyMessage}</DefaultText>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Label component="span" sx={{ margin: 0 }}>
        Proficiências Ajustadas
      </Label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 px-3 py-3"
            style={APP_CONTAINER_STYLES.detailSectionBox}
          >
            <ProficiencyCard
              item={{
                property: item.originalProperty,
                gradation: item.originalGradation,
              }}
            />

            <DefaultText sx={{ fontStyle: 'italic' }}>
              {`Concedida por: ${item.sourceName}`}
            </DefaultText>

            <DefaultAutocompleteInput<IProficiencyProperty>
              id={`sheet-proficiency-adjustment-${item.id}`}
              label="Propriedade substituta"
              options={optionsByAdjustmentId.get(item.id) ?? []}
              getOptionLabel={(property) => property.name}
              value={item.adjustedProperty}
              onChange={(newValue) => {
                if (newValue) {
                  onSelectSubstitute(item.id, newValue.id);
                }
              }}
              placeholder="Selecione a propriedade substituta"
              disabled={isSaving?.(item.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
