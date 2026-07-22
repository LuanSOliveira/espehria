'use client';

import { ReactNode } from 'react';
import { ViewModal } from '@/shared/components/Modals';
import { useEntityMentionViewStore } from '@/store';
import { CreatureView } from '@/app/(authorized)/criaturas/components/CreatureView';
import { LocationView } from '@/app/(authorized)/locais/components/LocationView';

interface EntityMentionViewRendererParams {
  entityId: string;
  onNotFound: () => void;
}

/**
 * Mapa entityType -> renderização da view correspondente. Tipos sem entrada
 * aqui (ex.: "user" nesta entrega) são tratados de forma graciosa: o
 * dispatcher simplesmente não renderiza nenhum modal para eles.
 */
const ENTITY_MENTION_VIEW_REGISTRY: Record<
  string,
  (params: EntityMentionViewRendererParams) => ReactNode
> = {
  creature: ({ entityId, onNotFound }) => (
    <CreatureView creatureId={entityId} onNotFound={onNotFound} />
  ),
  location: ({ entityId, onNotFound }) => (
    <LocationView locationId={entityId} onNotFound={onNotFound} />
  ),
};

export const EntityMentionViewDispatcher = () => {
  const { pendingView, closeEntityView } = useEntityMentionViewStore();

  const renderView = pendingView
    ? ENTITY_MENTION_VIEW_REGISTRY[pendingView.entityType]
    : undefined;

  if (!pendingView || !renderView) {
    return null;
  }

  return (
    <ViewModal open title="Detalhes" size="wide" onClose={closeEntityView}>
      {renderView({
        entityId: pendingView.entityId,
        onNotFound: closeEntityView,
      })}
    </ViewModal>
  );
};
