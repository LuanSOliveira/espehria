// Rótulo em pt-BR exibido ao lado do nome no menu de sugestão de menção
// (ex.: "Joao (criatura)").
export const ENTITY_MENTION_TYPE_LABELS: Record<string, string> = {
  creature: 'criatura',
  user: 'usuário',
};

// Endpoint de detalhe usado para resolver o nome atual de uma entidade mencionada
// (reaproveita os endpoints de detalhe já existentes, não há endpoint de resolução
// dedicado).
export const ENTITY_MENTION_DETAIL_URL_BY_TYPE: Record<
  string,
  (id: string) => string
> = {
  creature: (id) => `/creatures/${id}`,
  user: (id) => `/users/${id}`,
};

// Tipos de entidade com view registrada no EntityMentionViewDispatcher — usado pelo
// RichTextViewer para decidir se uma tag de menção é clicável. Deve ser mantido em
// sincronia com o mapa de views em shared/components/EntityMentionViewDispatcher.
export const ENTITY_MENTION_VIEWABLE_TYPES: string[] = ['creature'];
