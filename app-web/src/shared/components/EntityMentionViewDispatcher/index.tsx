'use client';

import { ReactNode } from 'react';
import { ViewModal } from '@/shared/components/Modals';
import { useEntityMentionViewStore } from '@/store';
import { CreatureView } from '@/app/(authorized)/criaturas/components/CreatureView';
import { LocationView } from '@/app/(authorized)/locais/components/LocationView';
import { RaceView } from '@/app/(authorized)/racas/components/RaceView';
import { EraView } from '@/app/(authorized)/eras/components/EraView';
import { EventView } from '@/app/(authorized)/eventos/components/EventView';
import { DivinityView } from '@/app/(authorized)/divindades/components/DivinityView';

interface EntityMentionViewRendererParams {
  entityId: string;
  onNotFound: () => void;
}

/**
 * Mapa entityType -> renderização da view correspondente. Tipos sem entrada
 * aqui (ex.: "user" e "tag" nesta entrega, que ainda não têm um componente de
 * visualização) são tratados de forma graciosa: o dispatcher simplesmente não
 * renderiza nenhum modal para eles.
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
  race: ({ entityId, onNotFound }) => (
    <RaceView raceId={entityId} onNotFound={onNotFound} />
  ),
  era: ({ entityId, onNotFound }) => (
    <EraView eraId={entityId} onNotFound={onNotFound} />
  ),
  event: ({ entityId, onNotFound }) => (
    <EventView eventId={entityId} onNotFound={onNotFound} />
  ),
  divinity: ({ entityId, onNotFound }) => (
    <DivinityView divinityId={entityId} onNotFound={onNotFound} />
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
