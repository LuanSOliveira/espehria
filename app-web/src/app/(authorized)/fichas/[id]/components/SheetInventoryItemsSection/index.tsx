'use client';

import { useState } from 'react';
import { CircularProgress, Tab, Tabs } from '@mui/material';
import { FiPlus } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import {
  IAccessory,
  IAmmunition,
  IArmor,
  IConsumable,
  IMaterial,
  ISheetInventoryItem,
  ISheetInventoryItemCategory,
  ISheetInventoryMutationResult,
  IShield,
  IUtility,
  IWeapon,
} from '@/shared/interfaces';
import { AddSheetInventoryItemPayload } from '../../hooks/useSheetInventoryItems';
import {
  useEquipSheetInventoryItemMutation,
  useIncreaseSheetInventoryItemQuantityMutation,
  usePostEntity,
  useRemoveSheetInventoryItemMutation,
  useUnequipSheetInventoryItemMutation,
} from '@/hooks/Queries';
import {
  SHEET_INVENTORY_CATEGORIES,
  SHEET_INVENTORY_EQUIPABLE_CATEGORIES,
  SHEET_TABS_SX,
} from '../../data';
import { SheetInventoryItemCard } from '../SheetInventoryItemCard';
import { SheetInventoryAddChoiceModal } from '../SheetInventoryAddChoiceModal';
import { SheetInventoryQuantityModal } from '../SheetInventoryQuantityModal';
import {
  SheetUtilityStandaloneForm,
  UtilityCustomDataPayload,
} from '../SheetUtilityStandaloneForm';
import {
  SheetConsumableStandaloneForm,
  ConsumableCustomDataPayload,
} from '../SheetConsumableStandaloneForm';
import {
  SheetMaterialStandaloneForm,
  MaterialCustomDataPayload,
} from '../SheetMaterialStandaloneForm';
import {
  SheetAmmunitionStandaloneForm,
  AmmunitionCustomDataPayload,
} from '../SheetAmmunitionStandaloneForm';
import {
  SheetWeaponStandaloneForm,
  WeaponCustomDataPayload,
} from '../SheetWeaponStandaloneForm';
import {
  SheetArmorStandaloneForm,
  ArmorCustomDataPayload,
} from '../SheetArmorStandaloneForm';
import {
  SheetAccessoryStandaloneForm,
  AccessoryCustomDataPayload,
} from '../SheetAccessoryStandaloneForm';
import {
  SheetShieldStandaloneForm,
  ShieldCustomDataPayload,
} from '../SheetShieldStandaloneForm';
import { SheetUtilityCatalogPickerModal } from '../SheetUtilityCatalogPickerModal';
import { SheetConsumableCatalogPickerModal } from '../SheetConsumableCatalogPickerModal';
import { SheetMaterialCatalogPickerModal } from '../SheetMaterialCatalogPickerModal';
import { SheetAmmunitionCatalogPickerModal } from '../SheetAmmunitionCatalogPickerModal';
import { SheetWeaponCatalogPickerModal } from '../SheetWeaponCatalogPickerModal';
import { SheetArmorCatalogPickerModal } from '../SheetArmorCatalogPickerModal';
import { SheetAccessoryCatalogPickerModal } from '../SheetAccessoryCatalogPickerModal';
import { SheetShieldCatalogPickerModal } from '../SheetShieldCatalogPickerModal';
import { UtilityView } from '@/app/(authorized)/utilitarios/components/UtilityView';
import { ConsumableView } from '@/app/(authorized)/consumiveis/components/ConsumableView';
import { MaterialView } from '@/app/(authorized)/materiais/components/MaterialView';
import { AmmunitionView } from '@/app/(authorized)/municoes/components/AmmunitionView';
import { WeaponView } from '@/app/(authorized)/armas/components/WeaponView';
import { ArmorView } from '@/app/(authorized)/armaduras/components/ArmorView';
import { AccessoryView } from '@/app/(authorized)/acessorios/components/AccessoryView';
import { ShieldView } from '@/app/(authorized)/escudos/components/ShieldView';

type SheetInventoryParentTab = 'carregados' | 'equipados';

type OmitEntityMeta<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export interface SheetInventoryItemsSectionProps {
  /** Não usado diretamente aqui (mutations já vêm resolvidas via props), mantido por completude do contrato do componente. */
  sheetId: string;
  items: ISheetInventoryItem[];
  counts: Record<ISheetInventoryItemCategory, number>;
  isLoadingItems: boolean;
  currentLoadedVolume: number;
  limitVolume: number;
  addInventoryItemMutation: ReturnType<
    typeof usePostEntity<ISheetInventoryMutationResult, AddSheetInventoryItemPayload>
  >;
  removeInventoryItemMutation: ReturnType<typeof useRemoveSheetInventoryItemMutation>;
  increaseInventoryItemMutation: ReturnType<
    typeof useIncreaseSheetInventoryItemQuantityMutation
  >;
  equipInventoryItemMutation: ReturnType<typeof useEquipSheetInventoryItemMutation>;
  unequipInventoryItemMutation: ReturnType<typeof useUnequipSheetInventoryItemMutation>;
}

interface PendingAdd {
  category: ISheetInventoryItemCategory;
  unitVolume: number;
  catalogItemId?: string;
  customData?: Record<string, unknown>;
}

interface PendingRemoveConfirmation {
  item: ISheetInventoryItem;
  quantity: number;
}

/**
 * Orquestrador da nova dinâmica de gestão de itens da aba Inventário —
 * renderizado abaixo de `SheetVolumePanel`/`SheetCoinsPanel`, dentro do
 * bloco `activeTab === 'inventario'` de `page.tsx`. Concentra a sequência de
 * modais dos fluxos de adicionar/remover/equipar/desequipar/visualizar
 * descrita em `task-web.md`.
 */
export const SheetInventoryItemsSection = ({
  items,
  counts,
  isLoadingItems,
  currentLoadedVolume,
  limitVolume,
  addInventoryItemMutation,
  removeInventoryItemMutation,
  increaseInventoryItemMutation,
  equipInventoryItemMutation,
  unequipInventoryItemMutation,
}: SheetInventoryItemsSectionProps) => {
  const isGoogleUser = useIsGoogleUser();

  const [parentTab, setParentTab] = useState<SheetInventoryParentTab>('carregados');
  const [loadedCategory, setLoadedCategory] = useState<ISheetInventoryItemCategory>(
    SHEET_INVENTORY_CATEGORIES[0].category,
  );
  const [equippedCategory, setEquippedCategory] = useState<ISheetInventoryItemCategory>(
    SHEET_INVENTORY_EQUIPABLE_CATEGORIES[0].category,
  );

  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const [standaloneFormOpen, setStandaloneFormOpen] = useState(false);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);

  const [itemPendingRemove, setItemPendingRemove] = useState<ISheetInventoryItem | null>(
    null,
  );
  const [removeConfirmation, setRemoveConfirmation] =
    useState<PendingRemoveConfirmation | null>(null);

  const [itemPendingView, setItemPendingView] = useState<ISheetInventoryItem | null>(
    null,
  );

  const [itemPendingIncrease, setItemPendingIncrease] =
    useState<ISheetInventoryItem | null>(null);

  const activeCategory = parentTab === 'carregados' ? loadedCategory : equippedCategory;
  const activeCategoryConfig = SHEET_INVENTORY_CATEGORIES.find(
    (config) => config.category === activeCategory,
  )!;

  const visibleItems = items.filter((item) => {
    if (item.category !== activeCategory) {
      return false;
    }

    return parentTab === 'equipados' ? item.equipped : true;
  });

  const handleOpenAddChoice = () => {
    setAddChoiceOpen(true);
  };

  const handleChooseStandalone = () => {
    setAddChoiceOpen(false);
    setStandaloneFormOpen(true);
  };

  const handleChooseExisting = () => {
    setAddChoiceOpen(false);
    setCatalogPickerOpen(true);
  };

  type StandaloneCustomDataPayload =
    | UtilityCustomDataPayload
    | ConsumableCustomDataPayload
    | MaterialCustomDataPayload
    | AmmunitionCustomDataPayload
    | WeaponCustomDataPayload
    | ArmorCustomDataPayload
    | AccessoryCustomDataPayload
    | ShieldCustomDataPayload;

  const handleStandaloneSubmit = (customData: StandaloneCustomDataPayload) => {
    setStandaloneFormOpen(false);
    setPendingAdd({
      category: activeCategory,
      unitVolume: customData.volume ?? 0,
      customData: customData as unknown as Record<string, unknown>,
    });
  };

  const handleCatalogSelect = (
    catalogItem:
      | IUtility
      | IConsumable
      | IMaterial
      | IAmmunition
      | IWeapon
      | IArmor
      | IAccessory
      | IShield,
  ) => {
    setCatalogPickerOpen(false);
    setPendingAdd({
      category: activeCategory,
      unitVolume: catalogItem.volume ?? 0,
      catalogItemId: catalogItem.id,
    });
  };

  const handleConfirmAdd = (quantity: number) => {
    if (!pendingAdd) {
      return;
    }

    addInventoryItemMutation.mutate(
      {
        category: pendingAdd.category,
        quantity,
        catalogItemId: pendingAdd.catalogItemId,
        customData: pendingAdd.customData,
      },
      { onSuccess: () => setPendingAdd(null) },
    );
  };

  const handleRemove = (item: ISheetInventoryItem) => {
    setItemPendingRemove(item);
  };

  const handleConfirmRemoveQuantity = (quantity: number) => {
    if (!itemPendingRemove) {
      return;
    }

    setRemoveConfirmation({ item: itemPendingRemove, quantity });
    setItemPendingRemove(null);
  };

  const handleConfirmRemove = () => {
    if (!removeConfirmation) {
      return;
    }

    removeInventoryItemMutation.mutate(
      { itemId: removeConfirmation.item.id, quantity: removeConfirmation.quantity },
      { onSuccess: () => setRemoveConfirmation(null) },
    );
  };

  const handleIncrease = (item: ISheetInventoryItem) => {
    setItemPendingIncrease(item);
  };

  const handleConfirmIncrease = (quantity: number) => {
    if (!itemPendingIncrease) {
      return;
    }

    increaseInventoryItemMutation.mutate(
      { itemId: itemPendingIncrease.id, quantity },
      { onSuccess: () => setItemPendingIncrease(null) },
    );
  };

  const handleEquip = (item: ISheetInventoryItem) => {
    equipInventoryItemMutation.mutate(item.id);
  };

  const handleUnequip = (item: ISheetInventoryItem) => {
    unequipInventoryItemMutation.mutate(item.id);
  };

  const renderStandaloneForm = () => {
    switch (activeCategory) {
      case 'utility':
        return <SheetUtilityStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'consumable':
        return <SheetConsumableStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'material':
        return <SheetMaterialStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'ammunition':
        return <SheetAmmunitionStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'weapon':
        return <SheetWeaponStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'armor':
        return <SheetArmorStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'accessory':
        return <SheetAccessoryStandaloneForm onSubmit={handleStandaloneSubmit} />;
      case 'shield':
        return <SheetShieldStandaloneForm onSubmit={handleStandaloneSubmit} />;
      default:
        return null;
    }
  };

  const renderCatalogPickerModal = () => {
    switch (activeCategory) {
      case 'utility':
        return (
          <SheetUtilityCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'consumable':
        return (
          <SheetConsumableCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'material':
        return (
          <SheetMaterialCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'ammunition':
        return (
          <SheetAmmunitionCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'weapon':
        return (
          <SheetWeaponCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'armor':
        return (
          <SheetArmorCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'accessory':
        return (
          <SheetAccessoryCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      case 'shield':
        return (
          <SheetShieldCatalogPickerModal
            open={catalogPickerOpen}
            onClose={() => setCatalogPickerOpen(false)}
            onSelect={handleCatalogSelect}
          />
        );
      default:
        return null;
    }
  };

  const renderItemView = () => {
    if (!itemPendingView) {
      return null;
    }

    switch (itemPendingView.category) {
      case 'utility':
        return (
          <UtilityView
            utility={itemPendingView.data as OmitEntityMeta<IUtility>}
          />
        );
      case 'consumable':
        return (
          <ConsumableView
            consumable={itemPendingView.data as OmitEntityMeta<IConsumable>}
          />
        );
      case 'material':
        return (
          <MaterialView
            material={itemPendingView.data as OmitEntityMeta<IMaterial>}
          />
        );
      case 'ammunition':
        return (
          <AmmunitionView
            ammunition={itemPendingView.data as OmitEntityMeta<IAmmunition>}
          />
        );
      case 'weapon':
        return (
          <WeaponView weapon={itemPendingView.data as OmitEntityMeta<IWeapon>} />
        );
      case 'armor':
        return <ArmorView armor={itemPendingView.data as OmitEntityMeta<IArmor>} />;
      case 'accessory':
        return (
          <AccessoryView
            accessory={itemPendingView.data as OmitEntityMeta<IAccessory>}
          />
        );
      case 'shield':
        return (
          <ShieldView shield={itemPendingView.data as OmitEntityMeta<IShield>} />
        );
      default:
        return null;
    }
  };

  if (isLoadingItems) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando itens do inventário...</DefaultText>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <Tabs
        value={parentTab}
        onChange={(_event, newValue: SheetInventoryParentTab) => setParentTab(newValue)}
        sx={SHEET_TABS_SX}
      >
        <Tab value="carregados" label="Carregados" />
        <Tab value="equipados" label="Equipados" />
      </Tabs>

      {parentTab === 'carregados' && (
        <Tabs
          value={loadedCategory}
          onChange={(_event, newValue: ISheetInventoryItemCategory) =>
            setLoadedCategory(newValue)
          }
          variant="scrollable"
          scrollButtons="auto"
          sx={SHEET_TABS_SX}
        >
          {SHEET_INVENTORY_CATEGORIES.map((config) => (
            <Tab
              key={config.category}
              value={config.category}
              label={`${config.label} (${counts[config.category]})`}
            />
          ))}
        </Tabs>
      )}

      {parentTab === 'equipados' && (
        <Tabs
          value={equippedCategory}
          onChange={(_event, newValue: ISheetInventoryItemCategory) =>
            setEquippedCategory(newValue)
          }
          variant="scrollable"
          scrollButtons="auto"
          sx={SHEET_TABS_SX}
        >
          {SHEET_INVENTORY_EQUIPABLE_CATEGORIES.map((config) => (
            <Tab
              key={config.category}
              value={config.category}
              label={`${config.label} (${
                items.filter(
                  (item) => item.category === config.category && item.equipped,
                ).length
              })`}
            />
          ))}
        </Tabs>
      )}

      {parentTab === 'carregados' && !isGoogleUser && (
        <div className="flex justify-end">
          <PrimaryButton
            type="button"
            startIcon={<FiPlus />}
            onClick={handleOpenAddChoice}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Adicionar
          </PrimaryButton>
        </div>
      )}

      {visibleItems.length === 0 && (
        <DefaultText>Nenhum item adicionado nesta categoria.</DefaultText>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <SheetInventoryItemCard
            key={item.id}
            item={item}
            onView={setItemPendingView}
            onRemove={handleRemove}
            onIncrease={handleIncrease}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
        ))}
      </div>

      <SheetInventoryAddChoiceModal
        open={addChoiceOpen}
        categoryLabel={activeCategoryConfig.label}
        onClose={() => setAddChoiceOpen(false)}
        onChooseStandalone={handleChooseStandalone}
        onChooseExisting={handleChooseExisting}
      />

      <FormModal
        open={standaloneFormOpen}
        onClose={() => setStandaloneFormOpen(false)}
        title={`Novo item avulso — ${activeCategoryConfig.label}`}
        size="wide"
      >
        {renderStandaloneForm()}
      </FormModal>

      {renderCatalogPickerModal()}

      <SheetInventoryQuantityModal
        open={!!pendingAdd}
        mode="add"
        itemName={activeCategoryConfig.label}
        unitVolume={pendingAdd?.unitVolume ?? 0}
        currentLoadedVolume={currentLoadedVolume}
        limitVolume={limitVolume}
        onConfirm={handleConfirmAdd}
        onCancel={() => setPendingAdd(null)}
        isLoading={addInventoryItemMutation.isPending}
      />

      <SheetInventoryQuantityModal
        open={!!itemPendingRemove}
        mode="remove"
        itemName={itemPendingRemove?.data.name ?? ''}
        unitVolume={itemPendingRemove?.unitVolume ?? 0}
        maxQuantity={itemPendingRemove?.quantity}
        currentLoadedVolume={currentLoadedVolume}
        limitVolume={limitVolume}
        onConfirm={handleConfirmRemoveQuantity}
        onCancel={() => setItemPendingRemove(null)}
      />

      <SheetInventoryQuantityModal
        open={!!itemPendingIncrease}
        mode="add"
        itemName={itemPendingIncrease?.data.name ?? ''}
        unitVolume={itemPendingIncrease?.unitVolume ?? 0}
        currentLoadedVolume={currentLoadedVolume}
        limitVolume={limitVolume}
        onConfirm={handleConfirmIncrease}
        onCancel={() => setItemPendingIncrease(null)}
        isLoading={increaseInventoryItemMutation.isPending}
      />

      <ConfirmationModal
        open={!!removeConfirmation}
        title="Remover item"
        message={`Tem certeza que deseja remover ${removeConfirmation?.quantity} unidade(s) de "${removeConfirmation?.item.data.name}"?`}
        confirmLabel="Remover"
        isLoading={removeInventoryItemMutation.isPending}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveConfirmation(null)}
      />

      <ViewModal
        open={!!itemPendingView}
        onClose={() => setItemPendingView(null)}
        title={`Detalhes de ${activeCategoryConfig.label}`}
        size="wide"
      >
        {renderItemView()}
      </ViewModal>
    </div>
  );
};
