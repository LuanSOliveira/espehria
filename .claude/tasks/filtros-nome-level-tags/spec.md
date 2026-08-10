# Spec: Filtros de nome, level e tags em Treinamentos, Talentos e Características

## Pedido original
Adicionar filtros nas páginas de listagem de Treinamentos, Talentos e Características do
`app-web`, com o suporte necessário no `app-api`: filtro por nome, por level e por tags.
Incluir botão de "Limpar filtros".

## Perguntas e respostas
- P: O filtro de level deve aceitar um valor exato único ou uma faixa (mínimo/máximo)? → R: Valor exato único — o usuário informa um level específico e retorna os registros com exatamente esse valor.
- P: Ao selecionar múltiplas tags, a busca deve retornar registros que possuem QUALQUER uma das tags selecionadas (OR) ou TODAS as tags selecionadas (AND)? → R: TODAS as tags selecionadas devem estar presentes no registro (AND).
- P: Como as tags devem ser selecionadas na UI de filtro? → R: Reaproveitar o mesmo autocomplete de múltipla seleção já usado nos formulários de criação/edição dessas entidades.
- P: Os filtros de nome, level e tags são combinados cumulativamente (AND entre si) ou existe alguma prioridade/exclusão entre eles? → R: Cumulativos — nome E level E tags são aplicados simultaneamente.
- P: O botão "Limpar filtros" deve estar presente nas três páginas e resetar todos os filtros de uma vez? → R: Sim, presente nas três páginas, resetando nome, level e tags de uma vez.
- P: As três páginas (Treinamentos, Talentos, Características) devem ter comportamento idêntico? → R: Sim, paridade total entre as três.

## Escopo confirmado

### Situação atual (levantada no código)
- As três entidades (`Training`, `Talent`, `Characteristic`) têm estrutura idêntica: campo
  `name` (obrigatório, único), campo `level` (inteiro, obrigatório) e relacionamento com
  `tags` (múltiplas tags, via tabela de junção própria de cada entidade, com ordenação).
  Não há divergência estrutural entre as três — a paridade solicitada é viável nos três casos.
- Hoje, os DTOs de listagem (`FindTrainingsQueryDto`, `FindTalentsQueryDto`,
  `FindCharacteristicsQueryDto`) já suportam apenas filtro por `name` (busca parcial,
  case-insensitive), além de paginação (`page`/`perPage`). Não existe filtro por `level`
  nem por tags em nenhuma das três listagens.
- Nas telas de listagem do `app-web`, os componentes de filtro existentes
  (`TrainingsFilterSection`, `TalentsFilterSection`, `CharacteristicsFilterSection`) hoje
  só expõem um campo de busca por nome e um botão "Filtrar". Não existe campo de level,
  seleção de tags, nem botão de limpar filtros em nenhuma das três telas.
- As três entidades já possuem, nos formulários de criação/edição, um componente de
  autocomplete de múltipla seleção para escolha de tags — este é o componente a ser
  reaproveitado na seleção de tags do filtro, conforme decisão do usuário.

### Escopo da demanda
Adicionar, de forma idêntica nas três páginas de listagem (Treinamentos, Talentos e
Características) e no suporte de API correspondente, os seguintes filtros combináveis:

1. **Filtro por nome**: já existe (busca parcial, case-insensitive) — mantém o
   comportamento atual, sem alterações de regra.
2. **Filtro por level**: novo. Valor exato único informado pelo usuário; retorna apenas
   registros cujo `level` seja exatamente igual ao valor informado.
3. **Filtro por tags**: novo. Seleção múltipla de tags via o mesmo componente de
   autocomplete já usado nos formulários de criação/edição. Quando mais de uma tag é
   selecionada, a busca aplica lógica AND — o registro só é retornado se possuir TODAS as
   tags selecionadas.
4. **Combinação dos filtros**: nome, level e tags são aplicados de forma cumulativa
   (AND entre si) quando mais de um estiver preenchido.
5. **Botão "Limpar filtros"**: novo, presente nas três páginas, que reseta de uma vez os
   três filtros (nome, level e tags) e retorna a listagem ao estado sem filtro.
6. **Paridade entre as três páginas**: o comportamento de filtros (campos disponíveis,
   regras de combinação, botão de limpar) deve ser idêntico nas telas de Treinamentos,
   Talentos e Características, refletindo a paridade já existente na estrutura das
   entidades no backend.

### Fora de escopo
- Alterações de regra no filtro de nome existente.
- Qualquer decisão de arquitetura, nomes de arquivos/classes/funções ou forma de
  implementação — isso será definido em etapa posterior de planejamento técnico.
