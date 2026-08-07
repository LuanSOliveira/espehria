# Task Web: Exibir nome e tipo da tag nos autocompletes de seleção de tags

## Contexto
Não existe `.claude/tasks/tags-autocomplete-label/spec.md` para esta demanda — o
pedido do usuário já é claro e foi usado diretamente como base deste plano.

Pedido: nos inputs de seleção de tag (autocomplete multi-seleção usado nos
formulários de criação/edição das entidades), o texto exibido para cada tag deve
passar a mostrar nome e tipo, no formato `"{name} ({type})"` (ex.:
`Treinamento (Habilidade)`), em vez de apenas `"{name}"`. Se `tag.type` for
ausente/vazio, exibir apenas `"{name}"` (sem parênteses vazios).

## Investigação de código já realizada

- Não existe componente dedicado de autocomplete de tags. Os 24 formulários
  listados abaixo usam o componente genérico
  `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`,
  que recebe a prop `getOptionLabel: (option: TOption) => string` e a usa em dois
  pontos: no `getOptionLabel` do `Autocomplete` do MUI (texto das opções do
  dropdown, linha `getOptionLabel={getOptionLabel}`) e no `label` dos `Chip`s em
  `renderValue` (tags já selecionadas, linha `label={getOptionLabel(option)}`).
  Ajustar a função passada nos 24 consumidores resolve os dois pontos de exibição
  de uma vez. O componente genérico **não deve ser alterado** — ele é reaproveitado
  por outras entidades além de tags (props genéricas `TOption`).
- `ITag` (`app-web/src/shared/interfaces/Entities/Tag/index.ts`) já é
  `{ name: string; color: string; type?: string; } extends IEntity` — nenhuma
  alteração de interface necessária. `type` é texto livre vindo da API, sem enum
  nem mapa de labels no frontend (confirmado em
  `app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx`, que já
  renderiza `{tag.type || '-'}` cru).
- `useTagOptionsQuery` (`app-web/src/hooks/Queries/EntityQueries/useTagOptionsQuery/index.ts`)
  já retorna `tagOptions: ITag[]` com `type` disponível — nenhuma mudança de
  hook/query necessária.
- Padrão de utilitários do projeto: `app-web/src/shared/util/<NomePascalCase>/index.ts`
  exportando uma função em camelCase, tipada com interfaces de `@/shared/interfaces`,
  re-exportada no barrel `app-web/src/shared/util/index.ts` (ver
  `FormatPriceWithCurrency/index.ts` → `formatPriceWithCurrency`). Consumidores
  importam de `@/shared/util`.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` referencia
  `ITag`, mas apenas para exibir tags já resolvidas como `TagBadge` (`<TagBadge
  key={tag.id} name={tag.name} color={tag.color} />`) em uma tabela de itens
  selecionáveis — não há `Autocomplete`/`getOptionLabel` nesse arquivo, e ele não
  serve para **selecionar tags** (seleciona entidades como treinamentos, talentos
  etc., cujas tags aparecem apenas como badges informativos). **Fora de escopo**:
  não deve ser alterado nesta demanda, pois não usa a formatação de label de tag
  que está sendo ajustada; se no futuro se desejar exibir o tipo também nos
  `TagBadge`, isso é uma decisão de UI diferente (badge, não autocomplete) e deve
  ser tratada como demanda própria.

## Etapas

### 1. web-dev
Status: concluído
Componentes: nenhum
Arquivos:
- app-web/src/shared/util/FormatTagLabel/index.ts (novo)
- app-web/src/shared/util/index.ts (registro do export no barrel)
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx
- app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx
- app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx
- app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx
- app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx
- app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx
- app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx
- app-web/src/app/(authorized)/organizacoes/components/OrganizationCreateForm/index.tsx
- app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx
- app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx
- app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx
- app-web/src/app/(authorized)/equipamentos/components/EquipmentCreateForm/index.tsx
- app-web/src/app/(authorized)/materiais/components/MaterialCreateForm/index.tsx
- app-web/src/app/(authorized)/consumiveis/components/ConsumableCreateForm/index.tsx
- app-web/src/app/(authorized)/municoes/components/AmmunitionCreateForm/index.tsx
- app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx
- app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx
- app-web/src/app/(authorized)/personagens/components/CharacterCreateForm/index.tsx
- app-web/src/app/(authorized)/familias/components/FamilyCreateForm/index.tsx

#### Funcionalidade

**A. Utilitário de formatação `formatTagLabel`**

Criar `app-web/src/shared/util/FormatTagLabel/index.ts`, seguindo o padrão de
`FormatPriceWithCurrency`, exportando:

```ts
import { ITag } from '@/shared/interfaces';

export const formatTagLabel = (tag: ITag): string =>
  tag.type ? `${tag.name} (${tag.type})` : tag.name;
```

Regra de formatação (confirmada): se `tag.type` existir e não for vazio, exibir
`"{name} ({type})"`; caso contrário (ausente/string vazia), exibir apenas
`"{name}"`, sem parênteses vazios.

Registrar o export no barrel `app-web/src/shared/util/index.ts`
(`export * from './FormatTagLabel';`), na mesma lista onde já estão
`FormatPriceWithCurrency`, `GetContrastTextColor` etc.

Este utilitário precisa existir antes de ser consumido nos 24 formulários abaixo
(mesma etapa `web-dev`, sem dependência entre agentes — apenas ordem lógica
dentro da implementação).

**B. Atualizar os 24 formulários consumidores**

Em cada um dos arquivos abaixo, trocar a linha `getOptionLabel={(tag) => tag.name}`
do `FormMultiAutocompleteInput<..., ITag>` usado para o campo de tags por
`getOptionLabel={formatTagLabel}`, e importar `formatTagLabel` de `@/shared/util`.
Todos esses arquivos já importam algo de `@/shared/util` (tipicamente `showToast`)
— mesclar `formatTagLabel` no import existente (`import { formatTagLabel, showToast } from '@/shared/util';`,
ordem alfabética), sem criar um segundo `import ... from '@/shared/util'`. Nenhuma
outra prop do `FormMultiAutocompleteInput` (`options`, `getOptionValue`,
`getOptionColor`, `value`/`onChange` via `Controller`) muda — a alteração é só na
label exibida (dropdown e chips selecionados, já que o componente genérico usa
`getOptionLabel` para os dois).

Lista completa (24 arquivos):
1. `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
2. `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
3. `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
4. `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`
5. `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
6. `app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`
7. `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`
8. `app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx`
9. `app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx`
10. `app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx`
11. `app-web/src/app/(authorized)/organizacoes/components/OrganizationCreateForm/index.tsx`
12. `app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx`
13. `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx`
14. `app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx`
15. `app-web/src/app/(authorized)/equipamentos/components/EquipmentCreateForm/index.tsx`
16. `app-web/src/app/(authorized)/materiais/components/MaterialCreateForm/index.tsx`
17. `app-web/src/app/(authorized)/consumiveis/components/ConsumableCreateForm/index.tsx`
18. `app-web/src/app/(authorized)/municoes/components/AmmunitionCreateForm/index.tsx`
19. `app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx`
20. `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
21. `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
22. `app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx`
23. `app-web/src/app/(authorized)/personagens/components/CharacterCreateForm/index.tsx`
24. `app-web/src/app/(authorized)/familias/components/FamilyCreateForm/index.tsx`

**C. Fora de escopo (registrar, não alterar)**

`app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` referencia
`ITag`, mas apenas para renderizar `TagBadge` (nome + cor) em uma tabela de
seleção de entidades — não é um autocomplete de seleção de tags e não usa
`getOptionLabel`. Não deve ser tocado nesta demanda (ver justificativa na seção
de investigação acima).

Tela de administração de tags (`app-web/src/app/(authorized)/tags/`, listagem e
`TagCreateForm`) também fora de escopo: não usa `FormMultiAutocompleteInput` para
selecionar tags, apenas cadastra/edita tags individuais.

#### Integrações com API
Nenhum endpoint novo e nenhuma alteração de contrato: os 24 formulários e o
`useTagOptionsQuery` continuam consumindo `GET /tags` exatamente como hoje. A
mudança é puramente de apresentação no frontend (label calculada a partir de
campos já retornados pela API, `name` e `type`).

#### Formulário/validação
Nenhuma alteração de schema (`shared/formSchemas/`) ou de payload enviado ao
backend: o campo `tagIds: string[]` de cada formulário continua guardando apenas
os ids das tags selecionadas (via `getOptionValue`), independentemente do texto
exibido em `getOptionLabel`.

#### Acesso Google
Não aplicável a esta demanda — nenhuma ação de criar/editar/excluir é alterada;
a formatação de label do autocomplete de tags é exibida da mesma forma para
todos os usuários, incluindo `provider: 'google'` (que já opera em modo somente
visualização nas telas onde isso se aplica, sem relação com este ajuste).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - `formatTagLabel` implementa exatamente a regra `"{name} ({type})"` /
    `"{name}"` (sem parênteses vazios quando `type` for `undefined`/string vazia),
    e está corretamente registrado no barrel `app-web/src/shared/util/index.ts`.
  - Os 24 arquivos da lista usam `getOptionLabel={formatTagLabel}` no
    `FormMultiAutocompleteInput<..., ITag>` do campo de tags, com o import de
    `formatTagLabel` mesclado ao import existente de `@/shared/util` em cada
    arquivo (sem import duplicado do módulo).
  - Nenhum outro `getOptionLabel` (de campos que não sejam tags, ex.: raças,
    famílias, personagens em `CharacterCreateForm`/`FamilyCreateForm`) foi
    alterado por engano.
  - `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`
    não foi modificado.
  - `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` e a
    tela `app-web/src/app/(authorized)/tags/` não foram alterados (fora de
    escopo, conforme justificado no plano).
  - Nenhuma alteração em schema de formulário, payload de submissão ou em
    `app-api`.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/shared/util/FormatTagLabel/index.ts — implementa exatamente
  `tag.type ? `${tag.name} (${tag.type})` : tag.name`, cobrindo a regra de
  "sem parênteses vazios" quando `type` é `undefined`/string vazia (falsy).
- app-web/src/shared/util/index.ts — `export * from './FormatTagLabel';`
  registrado no barrel, na mesma lista de `FormatPriceWithCurrency`,
  `GetContrastTextColor` etc.
- Os 24 formulários da lista (caracteristicas, treinamentos, talentos,
  biografias, racas, criaturas, divindades, eras, eventos, locais,
  organizacoes, condicoes, campanhas/[id]/PlannedSessionCreateForm, pericias,
  equipamentos, materiais, consumiveis, municoes, utilitarios, tecnicas,
  magias, campanhas, personagens, familias) — todos usam
  `getOptionLabel={formatTagLabel}` exatamente uma vez no
  `FormMultiAutocompleteInput<..., ITag>` do campo de tags, e o import de
  `formatTagLabel` foi mesclado ao import já existente de `@/shared/util`
  (`import { formatTagLabel, showToast } from '@/shared/util';`, ordem
  alfabética, sem import duplicado do módulo) em cada um dos 24 arquivos.
- Confirmado que nenhum outro `getOptionLabel` (moedas/currency, eras, raças,
  famílias, categorias, atributos, ordens, e o `option.label` genérico em
  `FamilyCreateForm`) foi alterado por engano — permanecem com suas funções
  originais (ex.: `(currency) => ...`, `(era) => era.name`,
  `(race) => race.name`, `(family) => family.name`,
  `(category) => category.name`, `(attribute) => attribute.name`,
  `(order) => String(order)`).
- app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx
  — não foi modificado; continua genérico (`getOptionLabel: (option: TOption) => string`)
  usado tanto no `Autocomplete` (`getOptionLabel={getOptionLabel}`) quanto nos
  `Chip`s de `renderValue` (`label={getOptionLabel(option)}`).
- app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx — não
  foi alterado; segue apenas renderizando `TagBadge` (nome + cor) em uma
  tabela de seleção de entidades, sem `Autocomplete`/`getOptionLabel` de tags.
- app-web/src/app/(authorized)/tags/ — confirmado que não usa
  `FormMultiAutocompleteInput`/`getOptionLabel` para selecionar tags (fora de
  escopo, não tocado).
- Nenhuma alteração em `shared/formSchemas/`, no payload `tagIds: string[]`
  enviado ao backend, ou em `app-api`.