# Spec: Ordem de inserção das tags

## Pedido original
Atualmente, as tags atribuídas às entidades do sistema são reordenadas
alfabeticamente em vez de preservar a ordem em que o usuário as inseriu/selecionou.
O pedido é que a ordem de inserção das tags seja preservada de ponta a ponta
(frontend e backend), tanto na tela de edição/cadastro (chips selecionados no
`FormMultiAutocompleteInput`) quanto nas listagens e telas de visualização que
exibem as tags de uma entidade.

## Perguntas e respostas
- P: O escopo é só frontend (não reordenar o que já vem da API) ou também
  backend (persistir e devolver a ordem de inserção)? → R: Frontend + Backend
  (ponta a ponta). Persistir a ordem de inserção no banco (migrations nas 24
  tabelas de junção de tags) E corrigir o app-web (`FormMultiAutocompleteInput`
  e componentes de listagem/visualização) para não reordenar alfabeticamente.
- P: Para registros já existentes, deve haver backfill atribuindo uma ordem
  (ex.: alfabética) às tags já associadas, ou eles ficam com ordem
  indefinida até serem editados novamente? → R: Sem backfill. Registros já
  existentes ficam com ordem indefinida/arbitrária até serem editados
  novamente — não atribuir ordem alfabética retroativa na migration.
- P: A correção deve cobrir todas as entidades com relação de tags do sistema,
  ou apenas um subconjunto específico? → R: Todas as 24 entidades com relação
  de tags, sem exceção.
- P: Existe algum lugar onde a ordenação alfabética das tags deve ser mantida
  de propósito (ex.: dropdown de opções do autocomplete, página de
  administração de tags)? → R: Sim. A ordem de inserção vale apenas para as
  tags já atribuídas a uma entidade (chips selecionados no input, listagens,
  telas de visualização). O dropdown de opções disponíveis do Autocomplete e
  a página de administração de tags (`/tags`) continuam ordenados
  alfabeticamente, sem alteração.

## Escopo confirmado

### Comportamento esperado
A ordem em que o usuário insere/seleciona as tags em uma entidade deve ser
preservada de ponta a ponta:
- Estado do formulário: ao selecionar/remover tags no
  `FormMultiAutocompleteInput`, a ordem dos chips exibidos deve refletir a
  ordem de seleção do usuário, não a ordem alfabética das opções disponíveis.
- Payload enviado à API: a ordem dos identificadores de tags enviados no
  payload de criação/edição deve corresponder à ordem exibida no formulário.
- Persistência: o backend deve armazenar a ordem de inserção das tags
  associadas a cada entidade.
- Leitura: ao buscar uma entidade (detalhe ou listagem), a API deve devolver
  as tags na ordem em que foram inseridas, e não em ordem alfabética ou
  arbitrária do banco.
- Renderização: componentes de listagem e de visualização no app-web devem
  exibir as tags na ordem recebida da API, sem reordená-las.

Esse comportamento se aplica exclusivamente às tags já atribuídas a uma
entidade (chips selecionados, listagens, telas de visualização). O dropdown de
opções disponíveis do Autocomplete (tags ainda não selecionadas) e a página de
administração de tags (`/tags`) permanecem ordenados alfabeticamente, sem
qualquer alteração.

### Decisões confirmadas
1. **Escopo**: mudança ponta a ponta — backend (persistência da ordem de
   inserção no banco, via migrations nas 24 tabelas de junção de tags) e
   frontend (`FormMultiAutocompleteInput` e componentes de listagem/
   visualização) para não reordenar alfabeticamente.
2. **Backfill**: não haverá backfill. Registros já existentes permanecem com
   ordem indefinida/arbitrária até serem editados novamente; a migration não
   deve atribuir ordem alfabética retroativa.
3. **Abrangência**: as 24 entidades com relação de tags do sistema, sem
   exceção.
4. **Exceções**: a ordem de inserção vale apenas para as tags já atribuídas a
   uma entidade. O dropdown de opções disponíveis do Autocomplete e a página
   de administração de tags (`/tags`) continuam ordenados alfabeticamente.

### Tabelas de junção afetadas (24)
1. `ammunition_tags`
2. `biography_tags`
3. `campaign_tags`
4. `character_tags`
5. `characteristic_tags`
6. `condition_tags`
7. `consumable_tags`
8. `creature_tags`
9. `divinity_tags`
10. `equipment_tags`
11. `era_tags`
12. `event_tags`
13. `family_tags`
14. `location_tags`
15. `material_tags`
16. `organization_tags`
17. `planned_session_tags`
18. `race_tags`
19. `skill_tags`
20. `spell_tags`
21. `talent_tags`
22. `technique_tags`
23. `training_tags`
24. `utility_tags`

### Pontos técnicos já mapeados (para referência do planejamento)
- **app-web** — `FormMultiAutocompleteInput`
  (`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`):
  o `value` do `Autocomplete` é calculado como
  `options.filter((option) => field.value.includes(getOptionValue(option)))`.
  Como `filter` percorre `options` (que está em ordem alfabética) e não
  `field.value` (que reflete a ordem de seleção do usuário), os chips
  selecionados acabam sempre exibidos em ordem alfabética, independentemente
  da ordem em que foram escolhidos. O `onChange`
  (`field.onChange(newValue.map(getOptionValue))`) também depende dessa
  mesma base ordenada alfabeticamente vinda do MUI, propagando o problema
  para o estado do formulário.
- **app-api** — padrão repetido em todos os 24 services (ex.:
  `races.service.ts`, `talents.service.ts`, etc.): o método privado
  `findTagsByIds(tagIds: string[])` faz
  `this.tagsRepository.findBy({ id: In(uniqueIds) })` (ou equivalente com
  `tagsRepository.find({ where: { id: In(uniqueIds) } })`). A cláusula
  `In(...)` do TypeORM não garante que o resultado retorne na mesma ordem dos
  IDs informados — o banco pode devolver as linhas em qualquer ordem (tipicamente
  ordem de armazenamento/índice), descartando a ordem de inserção enviada pelo
  frontend antes mesmo de persistir a relação.

### Observação para o planejamento
Como não haverá backfill, a nova coluna/mecanismo de ordem precisa tolerar
registros legados que não possuem valor de ordem definido (por exemplo,
permitir default 0 ou aceitar valor nulo para linhas já existentes na tabela
de junção). Além disso, como múltiplas linhas legadas podem ter o mesmo valor
de ordem (ou ausência dele), a ordenação usada na leitura precisa ser
determinística mesmo nesses casos — ou seja, deve haver um critério de
desempate estável (por exemplo, um segundo campo de ordenação consistente
entre requisições) para evitar que a ordem das tags mude de forma instável
entre uma consulta e outra.
