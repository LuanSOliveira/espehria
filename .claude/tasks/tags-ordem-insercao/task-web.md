# Task Web: Ordem de inserção das tags

## Contexto
Ver .claude/tasks/tags-ordem-insercao/spec.md

## Etapas

### 1. web-dev
**Status:** Concluído

**Arquivo alterado:** `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`

- Corrigido o cálculo de `value` do `Autocomplete`: passou a percorrer `field.value`
  (ordem de inserção mantida no form) e mapear cada id para a `option`
  correspondente em `options` via `.find(...)`, em vez de `options.filter(...)`
  (que produzia ordem alfabética). Ids sem `option` correspondente carregada são
  descartados com `.filter((option): option is TOption => option !== undefined)`,
  sem gerar `undefined` no array nem lançar erro — assim que `options` carregar,
  a tag correspondente passa a aparecer na posição correta.
- `onChange` mantido inalterado (`field.onChange(newValue.map(getOptionValue))`);
  como o `value` já respeita a ordem de `field.value`, adicionar tag ao final e
  remover tag do meio preservando a ordem relativa das demais passam a funcionar
  sem lógica adicional de merge.
- Assinatura pública do componente (`FormMultiAutocompleteInputProps`) não foi
  alterada; nenhuma prop nova foi adicionada. A correção é genérica, não
  acoplada a tags.
- Dropdown de opções do `Autocomplete` (prop `options`) e a página `/tags`
  não foram tocados, conforme exceção confirmada no spec.

**Revisão dos 24 pares ListItem/View + 4 pontos transversais:** feita via Grep
em todo `app-web/src` por `.sort()`/`localeCompare` envolvendo `tags` — nenhuma
ordenação client-side sobre `entity.tags` foi encontrada em nenhum dos
componentes listados na task (todos usam `entity.tags.map(...)` direto, na
ordem recebida da API), confirmando o levantamento já registrado na task. Nada
precisou ser removido. Os 4 pontos transversais (`EntityReferenceCard`,
`EntityReferenceSelectionModal`, `SheetBiographyCard`, `SheetRaceCard`,
`SheetBiographyAssignModal`) também foram conferidos individualmente e estão
limpos.

**Componentes:** nenhum componente novo criado; nenhuma alteração em
componentes de listagem/visualização (nenhuma ordenação encontrada para
remover).

**Pendências/observações:** nenhuma. Comportamento depende do backend já
devolver as tags na ordem de inserção (dependência já implementada, conforme
contexto informado).

#### Funcionalidade

**A. Correção do `FormMultiAutocompleteInput` (`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`)**

Este é o ponto central da correção no frontend. Hoje:
```ts
value={options.filter((option) =>
  ((field.value as string[] | undefined) ?? []).includes(getOptionValue(option)),
)}
```
percorre `options` (ordem alfabética vinda da API/props) e não `field.value` (ordem de seleção do usuário), então os chips selecionados sempre saem em ordem alfabética. O `onChange` (`field.onChange(newValue.map(getOptionValue))`) recebe `newValue` do MUI já nessa ordem normalizada e regrava o form nela, propagando o problema para o estado e para o payload.

Ajustar para que o `value` do `Autocomplete` seja derivado percorrendo `field.value` (a ordem de inserção mantida no form) e mapeando cada id para a `option` correspondente em `options`, e não o inverso. Ou seja, a lógica deve ser equivalente a "para cada id em `field.value`, na ordem em que aparece, encontrar a opção com aquele valor" — preservando a ordem de `field.value` e não a de `options`.

Tratar o caso de um id presente em `field.value` sem opção correspondente ainda carregada em `options` (ex.: options ainda carregando via `useGetEntityList`, ou tag removida/inacessível): esses ids devem ser ignorados na montagem do `value` (não podem quebrar o `.map`/gerar `undefined` dentro do array passado ao `Autocomplete`, nem lançar erro), continuando a exibir corretamente as demais tags já resolvidas assim que `options` chegar.

O `onChange` deve continuar convertendo `newValue` (que é o array de opções que o MUI decide devolver ao usuário adicionar/remover um chip) para ids via `getOptionValue`, mas como o novo `value` já respeita a ordem de `field.value`, o comportamento de adicionar uma tag ao fim da lista e remover uma tag do meio (mantendo a ordem relativa das demais) passa a funcionar corretamente sem que seja necessária lógica adicional de merge — validar esse comportamento (adicionar sempre ao final; remover preserva ordem relativa) como critério de aceite desta etapa.

Como este componente é genérico (`FormMultiAutocompleteInput<TFieldValues, TOption>`) e não exclusivo de tags, a correção deve ser feita na lógica compartilhada de resolução de `value`, sem acoplar a nada específico de tag (cor, ícone etc.). Hoje, todos os 24 consumidores existentes no código (`RaceCreateForm`, `BiographyCreateForm`, `CharacteristicCreateForm`, `TrainingCreateForm`, `TalentCreateForm`, `CampaignCreateForm`, `SpellCreateForm`, `TechniqueCreateForm`, `UtilityCreateForm`, `AmmunitionCreateForm`, `ConsumableCreateForm`, `MaterialCreateForm`, `EquipmentCreateForm`, `SkillCreateForm`, `PlannedSessionCreateForm`, `ConditionCreateForm`, `CharacterCreateForm`, `FamilyCreateForm`, `OrganizationCreateForm`, `LocationCreateForm`, `EventCreateForm`, `EraCreateForm`, `DivinityCreateForm`, `CreatureCreateForm`) usam o componente exclusivamente para o campo `tagIds`/`ITag`, mas passar a preservar a ordem de seleção deve se tornar o comportamento padrão do componente (não um modo opcional), já que é estritamente mais correto para qualquer uso futuro de múltipla seleção. Nenhuma prop nova é necessária — não alterar a assinatura pública do componente.

Não alterar o array `options` recebido via props nem a ordem em que as opções aparecem no dropdown do `Autocomplete` (isso continua alfabético, vindo de `useGetEntityList<ITag, ...>({ url: '/tags', ... })` em cada `*CreateForm` — fora de escopo, conforme exceção confirmada no spec).

**B. Componentes de listagem/visualização — apenas garantir que não reordenam `entity.tags`**

Levantamento feito: nenhum componente abaixo aplica `.sort()`/`localeCompare` sobre `tags` — todos hoje fazem `entity.tags.map(...)` direto na ordem recebida da API. Ou seja, não é esperado remover lógica de ordenação nesses arquivos (não existe), mas o `web-dev` deve **revisitar cada um** ao implementar para confirmar que nenhum `.sort()`/ordenação client-side foi introduzido incidentalmente em algum destes e que, uma vez o app-api passar a devolver as tags na ordem de inserção, a renderização simplesmente reflete essa ordem sem alterações de código. Caso encontre alguma ordenação client-side não mapeada aqui, removê-la.

Lista completa dos pontos de exibição de tags de entidade a conferir (24 entidades + telas compartilhadas):

| Entidade | ListItem | View / detalhe | CreateForm (campo `tagIds`) |
|---|---|---|---|
| Munição | `municoes/components/AmmunitionListItem` | `municoes/components/AmmunitionView` | `municoes/components/AmmunitionCreateForm` |
| Biografia | `biografias/components/BiographiesListItem` | `biografias/components/BiographyView` | `biografias/components/BiographyCreateForm` |
| Campanha | `campanhas/components/CampaignsListItem` | `campanhas/[id]/page.tsx` (tela de detalhe, sem `CampaignView` separado) | `campanhas/components/CampaignCreateForm` |
| Personagem | `personagens/components/CharactersListItem` | `personagens/components/CharacterView` | `personagens/components/CharacterCreateForm` |
| Característica | `caracteristicas/components/CharacteristicsListItem` | `caracteristicas/components/CharacteristicView` | `caracteristicas/components/CharacteristicCreateForm` |
| Condição | `condicoes/components/ConditionsListItem` | `condicoes/components/ConditionView` | `condicoes/components/ConditionCreateForm` |
| Consumível | `consumiveis/components/ConsumablesListItem` | `consumiveis/components/ConsumableView` | `consumiveis/components/ConsumableCreateForm` |
| Criatura | `criaturas/components/CreaturesListItem` | `criaturas/components/CreatureView` | `criaturas/components/CreatureCreateForm` |
| Divindade | `divindades/components/DivinitiesListItem` | `divindades/components/DivinityView` | `divindades/components/DivinityCreateForm` |
| Equipamento | `equipamentos/components/EquipmentListItem` | `equipamentos/components/EquipmentView` | `equipamentos/components/EquipmentCreateForm` |
| Era | `eras/components/ErasListItem` | `eras/components/EraView` | `eras/components/EraCreateForm` |
| Evento | `eventos/components/EventsListItem` | `eventos/components/EventView` | `eventos/components/EventCreateForm` |
| Família | `familias/components/FamiliesListItem` | `familias/components/FamilyView` | `familias/components/FamilyCreateForm` |
| Local | `locais/components/LocationsListItem` | `locais/components/LocationView` | `locais/components/LocationCreateForm` |
| Material | `materiais/components/MaterialsListItem` | `materiais/components/MaterialView` | `materiais/components/MaterialCreateForm` |
| Organização | `organizacoes/components/OrganizationsListItem` | `organizacoes/components/OrganizationView` | `organizacoes/components/OrganizationCreateForm` |
| Sessão planejada | `campanhas/[id]/components/PlannedSessionsListItem` | `campanhas/[id]/components/PlannedSessionView` | `campanhas/[id]/components/PlannedSessionCreateForm` |
| Raça | `racas/components/RacesListItem` | `racas/components/RaceView` | `racas/components/RaceCreateForm` |
| Perícia | `pericias/components/SkillsListItem` | `pericias/components/SkillView` | `pericias/components/SkillCreateForm` |
| Magia | `magias/components/SpellsListItem` | `magias/components/SpellView` | `magias/components/SpellCreateForm` |
| Talento | `talentos/components/TalentsListItem` | `talentos/components/TalentView` | `talentos/components/TalentCreateForm` |
| Técnica | `tecnicas/components/TechniquesListItem` | `tecnicas/components/TechniqueView` | `tecnicas/components/TechniqueCreateForm` |
| Treinamento | `treinamentos/components/TrainingsListItem` | `treinamentos/components/TrainingView` | `treinamentos/components/TrainingCreateForm` |
| Utilitário | `utilitarios/components/UtilitiesListItem` | `utilitarios/components/UtilityView` | `utilitarios/components/UtilityCreateForm` |

Pontos adicionais compartilhados/transversais que também exibem `tags` de uma entidade e devem ser conferidos:
- `shared/components/EntityReferenceCard/index.tsx` — card genérico de referência (usado, por ex., para exibir características/talentos referenciados dentro de `RaceView` e outras telas via `IEntityReference.tags`).
- `shared/components/EntityReferenceSelectionModal/index.tsx` — modal genérico de seleção de referências, exibe `item.tags` na listagem de itens selecionáveis.
- `fichas/[id]/components/SheetBiographyCard/index.tsx` e `fichas/[id]/components/SheetRaceCard/index.tsx` — cards da ficha de personagem que exibem as tags da biografia/raça vinculada.
- `fichas/[id]/components/SheetBiographyAssignModal/index.tsx` — modal de atribuição de biografia à ficha, exibe `biography.tags` na lista de opções.

Fora de escopo (exceções confirmadas no spec, não alterar):
- Dropdown de opções do `Autocomplete` dentro do `FormMultiAutocompleteInput` (lista de tags ainda não selecionadas) — continua em ordem alfabética, como já vem de `useGetEntityList<ITag, ...>({ url: '/tags' })` em cada `*CreateForm`.
- `app-web/src/app/(authorized)/tags/` (página de administração de tags: `TagsList`, `TagsListItem`, `TagsFilterSection`, `TagCreateForm`) — lista as próprias tags cadastradas, não as tags atribuídas a uma entidade; permanece alfabética.

#### Integrações com API
Nenhum endpoint novo. Os endpoints já consumidos por cada `*CreateForm`/`*View`/`*ListItem` (`/races`, `/biographies`, `/campaigns`, `/characters`, `/characteristics`, `/conditions`, `/consumables`, `/creatures`, `/divinities`, `/equipment`, `/eras`, `/events`, `/families`, `/locations`, `/materials`, `/organizations`, `/campaigns/:id/planned-sessions` (ou equivalente), `/skills`, `/spells`, `/talents`, `/techniques`, `/trainings`, `/utilities`, e `/tags` para as opções do autocomplete) continuam os mesmos. A correção depende de o app-api passar a devolver o array `tags` de cada entidade já na ordem de inserção (dependência de backend, fora deste plano) — o frontend deve apenas parar de reordenar o que a API devolver.

#### Formulário/validação
Nenhuma mudança de schema/validação (`shared/formSchemas/`) é necessária — o campo `tagIds: string[]` já existe em todos os 24 formularios e seu formato de payload não muda; apenas a ordem dos ids dentro do array passa a refletir a ordem de seleção do usuário em vez da ordem alfabética das `options`.

#### Acesso Google
Não aplicável a esta demanda — não há alteração em ações de criar/editar/excluir nem no comportamento para `provider: 'google'`; a correção é puramente sobre ordem de exibição/seleção de tags, disponível igualmente para todos os usuários com acesso à tela.

#### Observação
Como não haverá backfill (spec), registros já existentes continuarão exibindo as tags em ordem indefinida/arbitrária até serem editados novamente — isso é esperado e não deve ser tratado como bug pelo `web-dev` nem pelo revisor.

### 2. web-dev-codereviewer
**Status:** Concluído
- Revisar tudo acima, com atenção especial a:
  - A correção do `value` no `FormMultiAutocompleteInput` de fato deriva a ordem de `field.value` (não de `options`), e ids órfãos (sem opção correspondente carregada) são tratados sem quebrar a renderização.
  - Nenhum dos 24 pares ListItem/View passou a ter (ou manteve) `.sort()`/ordenação alfabética client-side sobre `entity.tags`.
  - O dropdown de opções do Autocomplete e a página `/tags` permanecem inalterados e alfabéticos.
  - Nenhuma regressão em outros consumidores do `FormMultiAutocompleteInput` (mesmo não havendo hoje nenhum fora de tags, a lógica corrigida deve continuar genérica e funcionar corretamente para qualquer `TOption`).

## Revisão

- **`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx:53-57`** — Risco real (não bloqueante para este merge, mas deve ser documentado/tratado): quando existe algum id em `field.value` sem `option` correspondente carregada em `options` (ex.: todo `*CreateForm` busca tags com `filters: { perPage: 100 }` — se a entidade tiver uma tag além das primeiras 100/alfabeticamente carregadas, ou referenciar uma tag já excluída do sistema), esse id fica órfão: some do `value` renderizado (correto, não quebra a UI) mas **continua presente em `field.value`** até que o usuário interaja com o próprio campo de tags. O problema é que, assim que o usuário adiciona OU remove qualquer chip nesse estado, o `onChange` do MUI Autocomplete calcula `newValue` a partir do `value` controlado (que já exclui os ids órfãos) — ou seja, `newValue` nunca inclui as opções órfãs. Como `field.onChange(newValue.map(getOptionValue))` sobrescreve o array inteiro, esse único gesto do usuário apaga silenciosamente os ids órfãos de `field.value`, sem qualquer aviso, e o submit subsequente envia um payload com `tagIds` truncado. Esse comportamento já existia na versão anterior (com `options.filter(...)`) e não foi introduzido por esta correção, mas o resumo da etapa 1 ("assim que `options` carregar, a tag correspondente passa a aparecer na posição correta") não deixa claro esse risco de perda de dado ao interagir antes do carregamento completo/com tag excluída.
  - Trecho: `field.onChange(newValue.map(getOptionValue))` combinado com `value={(field.value ?? []).map(...).filter((option): option is TOption => option !== undefined)}`.
  - Sugestão: no `onChange`, preservar os ids órfãos que não têm opção carregada em vez de confiar cegamente em `newValue` — por exemplo, calcular o novo array como `ids órfãos atuais (presentes em field.value mas ausentes de options) + newValue.map(getOptionValue)`, ou documentar explicitamente (e cobrir com aumento do `perPage`/busca paginada) que o componente assume que `options` sempre contém o universo completo de ids possíveis antes de qualquer interação do usuário.

- **`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx:53-57`** — Custo O(n×m) do `.find()` aninhado dentro do `.map()` (para cada id selecionado, percorre todo `options`). Aceitável no volume atual (tags limitadas a `perPage: 100` em todos os 24 consumidores, e número de tags selecionadas por entidade tipicamente pequeno), então não bloqueia o merge, mas é uma oportunidade de melhoria caso o volume de opções cresça.
  - Trecho: `.map((selectedId) => options.find((option) => getOptionValue(option) === selectedId))`
  - Sugestão: construir um `Map<string, TOption>` a partir de `options` (`new Map(options.map((o) => [getOptionValue(o), o]))`) antes do `.map()` e usar `map.get(selectedId)`, reduzindo para O(n+m).

**Pontos validados sem problemas:**
- Ordem de inserção: a derivação de `value` a partir de `field.value` (em vez de `options`) está correta e genérica para qualquer `TOption`. Como o `onChange` permanece inalterado e `value` agora reflete a ordem de `field.value`, adicionar um chip (MUI anexa ao final do array `value` atual) e remover um chip do meio (MUI filtra pelo índice, preservando a ordem relativa dos demais) funcionam corretamente sem lógica de merge adicional — confirmado por leitura do fluxo de `onChange`/`renderValue`/`getItemProps`.
- Assinatura pública (`FormMultiAutocompleteInputProps<TFieldValues, TOption>`) e parâmetros do componente não foram alterados; nenhuma prop nova foi adicionada; a correção está isolada à lógica de resolução de `value` e não depende de nada específico de tags (cor, ícone).
- Confirmado via grep em `app-web/src` que não há `.sort()`/`localeCompare` aplicado a `tags`/`entity.tags` em nenhum ListItem/View dos 24 pares nem nos 4 pontos transversais (`EntityReferenceCard`, `EntityReferenceSelectionModal`, `SheetBiographyCard`, `SheetRaceCard`, `SheetBiographyAssignModal`) — a única ocorrência de `.sort()` encontrada no projeto é em `app-web/src/app/(authorized)/fichas/[id]/page.tsx:156`, sobre propriedades de atributo (`attributeProperties`), não relacionada a tags.
- O array `options` recebido via props e a prop `options` do `Autocomplete` (dropdown) não foram tocados — continuam vindo diretamente de `useGetEntityList<ITag, ...>({ url: '/tags' })` em cada `*CreateForm`, em ordem alfabética. A página `app-web/src/app/(authorized)/tags/` (listagem/administração de tags) não foi alterada.
- Nenhuma regressão de tipagem/hooks: `Controller`/`field`/`fieldState` usados de forma incondicional dentro do único `render`; cast de `field.value as string[] | undefined` já existia antes da mudança (apenas reordenado), sem novo `any`.
