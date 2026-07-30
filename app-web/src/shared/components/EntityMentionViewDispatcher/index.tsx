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
import { CharacterView } from '@/app/(authorized)/personagens/components/CharacterView';
import { OrganizationView } from '@/app/(authorized)/organizacoes/components/OrganizationView';
import { FamilyView } from '@/app/(authorized)/familias/components/FamilyView';
import { EquipmentView } from '@/app/(authorized)/equipamentos/components/EquipmentView';
import { MaterialView } from '@/app/(authorized)/materiais/components/MaterialView';
import { ConsumableView } from '@/app/(authorized)/consumiveis/components/ConsumableView';
import { AmmunitionView } from '@/app/(authorized)/municoes/components/AmmunitionView';
import { RuleView } from '@/app/(authorized)/regras/components/RuleView';
import { SkillView } from '@/app/(authorized)/pericias/components/SkillView';
import { ConditionView } from '@/app/(authorized)/condicoes/components/ConditionView';

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
  character: ({ entityId, onNotFound }) => (
    <CharacterView characterId={entityId} onNotFound={onNotFound} />
  ),
  organization: ({ entityId, onNotFound }) => (
    <OrganizationView organizationId={entityId} onNotFound={onNotFound} />
  ),
  family: ({ entityId, onNotFound }) => (
    <FamilyView familyId={entityId} onNotFound={onNotFound} />
  ),
  equipment: ({ entityId, onNotFound }) => (
    <EquipmentView equipmentId={entityId} onNotFound={onNotFound} />
  ),
  material: ({ entityId, onNotFound }) => (
    <MaterialView materialId={entityId} onNotFound={onNotFound} />
  ),
  consumable: ({ entityId, onNotFound }) => (
    <ConsumableView consumableId={entityId} onNotFound={onNotFound} />
  ),
  ammunition: ({ entityId, onNotFound }) => (
    <AmmunitionView ammunitionId={entityId} onNotFound={onNotFound} />
  ),
  rule: ({ entityId, onNotFound }) => (
    <RuleView ruleId={entityId} onNotFound={onNotFound} />
  ),
  skill: ({ entityId, onNotFound }) => (
    <SkillView skillId={entityId} onNotFound={onNotFound} />
  ),
  condition: ({ entityId, onNotFound }) => (
    <ConditionView conditionId={entityId} onNotFound={onNotFound} />
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
