import Mention from '@tiptap/extension-mention';

/**
 * Extensão base de menção a entidades, compartilhada entre o editor
 * (FormRichTextInput) e a visualização somente-leitura (RichTextViewer).
 * Estende a extensão nativa `Mention` do TipTap apenas para adicionar o
 * atributo `entityType`, mantendo a serialização nativa (data-id/data-label)
 * já provida pela extensão original.
 */
export const EntityMentionExtension = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      entityType: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-entity-type'),
        renderHTML: (attributes: { entityType?: string | null }) => {
          if (!attributes.entityType) {
            return {};
          }

          return { 'data-entity-type': attributes.entityType };
        },
      },
    };
  },
});
