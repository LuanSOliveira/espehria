'use client';

import { KeyboardEvent } from 'react';
import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useGetEntityById } from '@/hooks/Queries';
import { useEntityMentionViewStore } from '@/store';
import {
  ENTITY_MENTION_DETAIL_URL_BY_TYPE,
  ENTITY_MENTION_VIEWABLE_TYPES,
} from '@/shared/constants';
import { EntityMentionExtension } from './EntityMentionExtension';

interface MentionedEntity {
  name: string;
}

const EntityMentionNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id as string | null;
  const entityType = node.attrs.entityType as string | null;
  const label = node.attrs.label as string | null;

  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  const detailUrlBuilder = entityType
    ? ENTITY_MENTION_DETAIL_URL_BY_TYPE[entityType]
    : undefined;

  const { data } = useGetEntityById<MentionedEntity>({
    url: detailUrlBuilder && id ? detailUrlBuilder(id) : '',
    enabled: Boolean(detailUrlBuilder && id),
  });

  const isClickable = Boolean(
    entityType && ENTITY_MENTION_VIEWABLE_TYPES.includes(entityType),
  );

  const displayName = data?.name ?? label ?? id ?? '';

  const handleClick = () => {
    if (isClickable && entityType && id) {
      openEntityView(entityType, id);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!isClickable) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      data-type="mention"
      data-clickable={isClickable ? 'true' : 'false'}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      aria-label={isClickable ? `Ver detalhes de ${displayName}` : undefined}
    >
      @{displayName}
    </NodeViewWrapper>
  );
};

/**
 * Extensão de menção usada apenas na renderização somente-leitura
 * (RichTextViewer): reaproveita os mesmos atributos/serialização de
 * EntityMentionExtension, adicionando um node view em React para permitir
 * clique e resolução do nome atual da entidade.
 */
export const ReadOnlyEntityMentionExtension = EntityMentionExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EntityMentionNodeView);
  },
});
