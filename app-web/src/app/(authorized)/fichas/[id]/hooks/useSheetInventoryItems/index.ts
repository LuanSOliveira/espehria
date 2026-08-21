'use client';

import { useEffect } from 'react';
import {
  useEquipSheetInventoryItemMutation,
  useGetEntityById,
  useIncreaseSheetInventoryItemQuantityMutation,
  usePostEntity,
  useRemoveSheetInventoryItemMutation,
  useUnequipSheetInventoryItemMutation,
} from '@/hooks/Queries';
import {
  ISheetInventoryItemCategory,
  ISheetInventoryList,
  ISheetInventoryMutationResult,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';

export interface AddSheetInventoryItemPayload {
  category: ISheetInventoryItemCategory;
  quantity: number;
  catalogItemId?: string;
  customData?: Record<string, unknown>;
}

export interface UseSheetInventoryItemsParams {
  sheetId: string;
}

const EMPTY_INVENTORY: ISheetInventoryList = {
  counts: {
    utility: 0,
    consumable: 0,
    material: 0,
    ammunition: 0,
    weapon: 0,
    armor: 0,
    accessory: 0,
    shield: 0,
  },
  items: [],
};

/**
 * Estado e mutações do inventário de itens da ficha (aba Inventário,
 * `SheetInventoryItemsSection`) — mesmo espírito de `useSheetAbilities`: hook
 * dedicado que concentra query + mutations e devolve tudo pronto para os
 * componentes de apresentação. Diferente de `useSheetAbilities`, aqui não é
 * necessário `queryClient.setQueryData` manual — toda mutação já invalida
 * `[\`/sheets/${sheetId}\`, \`/sheets/${sheetId}/inventory-items\`]` e o
 * refetch subsequente traz a lista/ficha (com `loadedVolume`/`itemsVolume`
 * já recomputados pelo backend) atualizadas.
 */
export const useSheetInventoryItems = ({
  sheetId,
}: UseSheetInventoryItemsParams) => {
  const inventoryUrl = `/sheets/${sheetId}/inventory-items`;
  const invalidateQueryKeys = [
    ['/sheets'],
    [`/sheets/${sheetId}`],
    [inventoryUrl],
  ];

  const {
    data: inventoryData,
    isLoading: isLoadingItems,
    isError: isInventoryError,
    error: inventoryError,
  } = useGetEntityById<ISheetInventoryList>({ url: inventoryUrl });

  useEffect(() => {
    if (!isInventoryError) {
      return;
    }

    showToast({
      message:
        inventoryError?.response?.data?.message ??
        'Não foi possível carregar os itens do inventário.',
      type: 'error',
    });
  }, [isInventoryError, inventoryError]);

  const inventory = inventoryData ?? EMPTY_INVENTORY;
  const items = inventory.items;

  const itemsVolumeTotal = items.reduce(
    (sum, item) => sum + item.unitVolume * item.quantity,
    0,
  );

  const addInventoryItemMutation = usePostEntity<
    ISheetInventoryMutationResult,
    AddSheetInventoryItemPayload
  >({
    url: inventoryUrl,
    invalidateQueryKeys,
    onSuccess: () => {
      showToast({
        message: 'Item adicionado ao inventário com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível adicionar o item ao inventário.',
        type: 'error',
      });
    },
  });

  const removeInventoryItemMutation = useRemoveSheetInventoryItemMutation({
    sheetId,
    invalidateQueryKeys,
    onSuccess: () => {
      showToast({
        message: 'Item removido do inventário com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível remover o item do inventário.',
        type: 'error',
      });
    },
  });

  const increaseInventoryItemMutation =
    useIncreaseSheetInventoryItemQuantityMutation({
      sheetId,
      invalidateQueryKeys,
      onSuccess: () => {
        showToast({
          message: 'Quantidade aumentada com sucesso.',
          type: 'success',
        });
      },
      onError: (error) => {
        showToast({
          message:
            error.response?.data?.message ??
            'Não foi possível aumentar a quantidade do item.',
          type: 'error',
        });
      },
    });

  const equipInventoryItemMutation = useEquipSheetInventoryItemMutation({
    sheetId,
    invalidateQueryKeys,
    onSuccess: () => {
      showToast({ message: 'Item equipado com sucesso.', type: 'success' });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível equipar o item.',
        type: 'error',
      });
    },
  });

  const unequipInventoryItemMutation = useUnequipSheetInventoryItemMutation({
    sheetId,
    invalidateQueryKeys,
    onSuccess: () => {
      showToast({ message: 'Item desequipado com sucesso.', type: 'success' });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível desequipar o item.',
        type: 'error',
      });
    },
  });

  return {
    inventory,
    items,
    counts: inventory.counts,
    itemsVolumeTotal,
    isLoadingItems,
    addInventoryItemMutation,
    removeInventoryItemMutation,
    increaseInventoryItemMutation,
    equipInventoryItemMutation,
    unequipInventoryItemMutation,
  };
};
