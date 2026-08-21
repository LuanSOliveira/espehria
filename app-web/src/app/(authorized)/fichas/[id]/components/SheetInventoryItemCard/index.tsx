'use client';

import { IconButton, Tooltip } from '@mui/material';
import {
  FiCheckCircle,
  FiEye,
  FiPlusCircle,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { Card } from '@/shared/components/Containers';
import { DefaultText, Label } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { ISheetInventoryItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { SHEET_INVENTORY_CATEGORIES } from '../../data';

export interface SheetInventoryItemCardProps {
  item: ISheetInventoryItem;
  onView: (item: ISheetInventoryItem) => void;
  onRemove: (item: ISheetInventoryItem) => void;
  onIncrease: (item: ISheetInventoryItem) => void;
  onEquip: (item: ISheetInventoryItem) => void;
  onUnequip: (item: ISheetInventoryItem) => void;
}

export const SheetInventoryItemCard = ({
  item,
  onView,
  onRemove,
  onIncrease,
  onEquip,
  onUnequip,
}: SheetInventoryItemCardProps) => {
  const isGoogleUser = useIsGoogleUser();

  const categoryConfig = SHEET_INVENTORY_CATEGORIES.find(
    (config) => config.category === item.category,
  );

  return (
    <Card sizeClassName="w-full max-w-none" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ImageAvatarPreview
          imageUrl={item.data.referenceImage}
          alt={item.data.name}
          size={48}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DefaultText sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
            {item.data.name}
          </DefaultText>

          <div className="flex flex-wrap gap-x-4">
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Volume unitário
              </Label>
              <DefaultText>{item.unitVolume}</DefaultText>
            </div>
            <div>
              <Label component="span" sx={{ margin: 0 }}>
                Quantidade
              </Label>
              <DefaultText>{item.quantity}</DefaultText>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-1 border-t pt-2" style={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(item)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>

        {!isGoogleUser && (
          <>
            <Tooltip title="Aumentar quantidade">
              <IconButton
                aria-label="Aumentar quantidade"
                onClick={() => onIncrease(item)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiPlusCircle />
              </IconButton>
            </Tooltip>

            {categoryConfig?.equipable && !item.equipped && (
              <Tooltip title="Equipar">
                <IconButton
                  aria-label="Equipar"
                  onClick={() => onEquip(item)}
                  sx={{ color: APP_COLORS.textBrownDark }}
                >
                  <FiCheckCircle />
                </IconButton>
              </Tooltip>
            )}

            {categoryConfig?.equipable && item.equipped && (
              <Tooltip title="Desequipar">
                <IconButton
                  aria-label="Desequipar"
                  onClick={() => onUnequip(item)}
                  sx={{ color: APP_COLORS.textBrownDark }}
                >
                  <FiXCircle />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Remover">
              <IconButton
                aria-label="Remover"
                onClick={() => onRemove(item)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiTrash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      </div>
    </Card>
  );
};
