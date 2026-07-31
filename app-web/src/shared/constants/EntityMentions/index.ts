// Rótulo em pt-BR exibido ao lado do nome no menu de sugestão de menção
// (ex.: "Joao (criatura)").
export const ENTITY_MENTION_TYPE_LABELS: Record<string, string> = {
  creature: 'criatura',
  user: 'usuário',
  tag: 'tag',
  location: 'local',
  race: 'raça',
  era: 'era',
  event: 'evento',
  divinity: 'divindade',
  character: 'personagem',
  organization: 'organização',
  family: 'família',
  equipment: 'equipamento',
  material: 'material',
  consumable: 'consumível',
  ammunition: 'munição',
  rule: 'regra',
  skill: 'perícia',
  condition: 'condição',
  utility: 'utilitário',
  training: 'treinamento',
  talent: 'talento',
  characteristic: 'característica',
  technique: 'técnica',
  spell: 'magia',
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
  tag: (id) => `/tags/${id}`,
  location: (id) => `/locations/${id}`,
  race: (id) => `/races/${id}`,
  era: (id) => `/eras/${id}`,
  event: (id) => `/events/${id}`,
  divinity: (id) => `/divinities/${id}`,
  character: (id) => `/characters/${id}`,
  organization: (id) => `/organizations/${id}`,
  family: (id) => `/families/${id}`,
  equipment: (id) => `/equipment/${id}`,
  material: (id) => `/materials/${id}`,
  consumable: (id) => `/consumables/${id}`,
  ammunition: (id) => `/ammunition/${id}`,
  rule: (id) => `/rules/${id}`,
  skill: (id) => `/skills/${id}`,
  condition: (id) => `/conditions/${id}`,
  utility: (id) => `/utilities/${id}`,
  training: (id) => `/trainings/${id}`,
  talent: (id) => `/talents/${id}`,
  characteristic: (id) => `/characteristics/${id}`,
  technique: (id) => `/techniques/${id}`,
  spell: (id) => `/spells/${id}`,
};

// Tipos de entidade com view registrada no EntityMentionViewDispatcher — usado pelo
// RichTextViewer para decidir se uma tag de menção é clicável. Deve ser mantido em
// sincronia com o mapa de views em shared/components/EntityMentionViewDispatcher.
export const ENTITY_MENTION_VIEWABLE_TYPES: string[] = [
  'creature',
  'location',
  'race',
  'era',
  'event',
  'divinity',
  'character',
  'organization',
  'family',
  'equipment',
  'material',
  'consumable',
  'ammunition',
  'rule',
  'skill',
  'condition',
  'utility',
  'training',
  'talent',
  'characteristic',
  'technique',
  'spell',
];
