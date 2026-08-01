# Task Web: Itens - Preço numérico e Moeda

## Contexto
Ver .claude/tasks/itens-preco-moeda/spec.md

## Pré-requisito
Esta implementação depende do backend desta mesma demanda (app-api), que precisa estar concluído/disponível antes ou em paralelo:
- Novo endpoint de listagem somente leitura de moedas (sem paginação), retornando `id`, `abbreviation` e `name` dos 4 registros fixos. Presume-se o path `/currencies`, seguindo o mesmo padrão de exposição já usado por `/attributes`; **confirmar o path exato com a implementação real do backend (ou com `task-api.md`, se existir) antes de codificar o hook**, pois este plano assume esse valor por convenção.
- Contratos atualizados das 5 entidades (Equipamentos, Materiais, Consumíveis, Munições, Utilitários):
  - `price` passa de `string | null` para `number | null` (inteiro) nos DTOs de resposta (detalhe e item de listagem).
  - Novo campo `currency` (objeto `{ id, abbreviation, name }`, opcional) nos DTOs de resposta (detalhe e item de listagem).
  - DTOs de criação/edição passam a aceitar `price?: number` e `currencyId?: string`, com a regra condicional (moeda obrigatória quando preço informado) validada no backend.

Caso os nomes de campo/endpoint definidos pelo backend divirjam do que está assumido aqui (`currency`, `currencyId`, `/currencies`), os arquivos abaixo devem ser ajustados para os nomes reais — a estrutura do plano permanece a mesma.

## Etapas

### 1. web-dev
Status: concluído

Implementado exatamente conforme o plano, com dois ajustes decididos pelo usuário após o plano ter sido escrito (ambos aplicados, sobrescrevendo o texto original desta seção):
- `formatPriceWithCurrency`: quando nem `price` nem `currency` estão preenchidos, retorna `'Não informado'` (mesmo texto usado hoje pelos `<X>View`), em vez de deixar a lacuna em aberto.
- `buildPayload` dos 5 `<X>CreateForm`: quando o campo de preço do formulário está vazio, o payload envia `price: null` (não `undefined`), pois o backend (`equipment.service.ts` e equivalentes) só limpa `currency` quando recebe `price: null` explicitamente — enviar `undefined` faria o backend ignorar o campo e manter preço/moeda antigos ao editar. `currencyId` continua sendo enviado como `data.currencyId || undefined`; o backend ignora esse valor e força `currency = null` sempre que `price` chega `null`, então não há inconsistência.

Contrato do backend confirmado por leitura direta de `app-api/src/modules/currencies/` e dos DTOs das 5 entidades (`create-*.dto.ts`, `*-response.dto.ts`, `*-list-item-response.dto.ts`) antes de implementar — sem divergência em relação ao assumido no plano (`GET /currencies`, `{ id, abbreviation, name }`, `price: number | null`, `currency: { id, abbreviation, name } | null`, `currencyId?: string`).

#### Funcionalidade

**Interface e hook compartilhados (pré-requisito das 5 features)**
- Nova interface `ICurrency` em `app-web/src/shared/interfaces/Entities/Currency/index.ts`, seguindo o mesmo formato de `IAttribute` (`{ id: string; abbreviation: string; name: string }`), exportada em `app-web/src/shared/interfaces/Entities/index.ts`.
- Novo hook `useCurrenciesQuery` em `app-web/src/hooks/Queries/EntityQueries/useCurrenciesQuery/index.ts`, replicando exatamente o padrão de `useAttributesQuery` (`useQuery` com `ApiFactory(getAuthToken())`, `queryKey` fixo, `staleTime` de 5 min, `GET /currencies` retornando `ICurrency[]`), exportado em `app-web/src/hooks/Queries/EntityQueries/index.ts`.
- Novo utilitário de formatação em `app-web/src/shared/util/FormatPriceWithCurrency/index.ts` (padrão de pasta já usado por `GetContrastTextColor`, `IsRichTextEmpty` etc.), exportado em `app-web/src/shared/util/index.ts`, para não duplicar a mesma lógica de composição em 10 arquivos (5 Views + 5 ListItems). Função recebe `price?: number | null` e `currency?: ICurrency | null` e devolve a string já formatada:
  - Ambos preenchidos: `"100 PO - Ouro"` (`"{price} {abbreviation} - {name}"`).
  - Só `price` preenchido: `"100"`.
  - Só `currency` preenchido: `"PO - Ouro"`.
  - Nenhum preenchido: assume-se manter o texto padrão `"Não informado"` usado hoje (a regra confirmada no spec trata explicitamente apenas do caso em que um dos dois está preenchido e o outro não — o caso "nenhum preenchido" não foi coberto; **sinalizando esta lacuna**: se o comportamento desejado para "nenhum dos dois preenchido" for diferente do fallback atual — por exemplo ocultar o bloco inteiro na listagem — isso precisa ser confirmado antes ou ajustado em revisão).

**Interfaces das 5 entidades (atualizar contratos no frontend)**
Em cada um dos 5 arquivos abaixo:
- `app-web/src/shared/interfaces/Entities/Equipment/index.ts`
- `app-web/src/shared/interfaces/Entities/Material/index.ts`
- `app-web/src/shared/interfaces/Entities/Consumable/index.ts`
- `app-web/src/shared/interfaces/Entities/Ammunition/index.ts`
- `app-web/src/shared/interfaces/Entities/Utility/index.ts`

Alterar:
- `price?: string | null` → `price?: number | null` na interface de detalhe (`IEquipment`, `IMaterial`, `IConsumable`, `IAmmunition`, `IUtility`).
- Adicionar `currency?: ICurrency | null` na mesma interface de detalhe.
- Adicionar `price?: number | null` e `currency?: ICurrency | null` na interface de item de listagem (`IEquipmentListItem`, `IMaterialListItem`, `IConsumableListItem`, `IAmmunitionListItem`, `IUtilityListItem`) — hoje esses tipos não expõem preço/moeda.

**Schemas de formulário das 5 entidades**
Em cada um dos 5 arquivos abaixo:
- `app-web/src/shared/formSchemas/EquipmentFormSchema/index.ts`
- `app-web/src/shared/formSchemas/MaterialFormSchema/index.ts`
- `app-web/src/shared/formSchemas/ConsumableFormSchema/index.ts`
- `app-web/src/shared/formSchemas/AmmunitionFormSchema/index.ts`
- `app-web/src/shared/formSchemas/UtilityFormSchema/index.ts`

Todos os 5 têm hoje exatamente o mesmo shape (`name`, `referenceImage`, `price: z.string()`, `tagIds`, `description`, `privateInformation`). Alterar em cada um:
- `price`: manter como `z.string()` no formulário (input controlado como texto/número via `FormTextInput type="number"`, convertido para `number` só no payload), validando que, se não vazio, representa um inteiro não negativo (ex.: `z.string().refine((v) => v === '' || /^\d+$/.test(v), 'Informe um preço inteiro válido')`).
- Adicionar `currencyId: z.string()`.
- Adicionar validação condicional via `.superRefine` no objeto do schema: se `price` estiver preenchido (`!== ''`) e `currencyId` estiver vazio, adicionar issue no path `currencyId` (ex.: `'Selecione a moeda quando o preço for informado'`).
- Atualizar `*FormDefaultValues` incluindo `currencyId: ''`.
- O `*FormData` inferido (`EquipmentFormData`, `MaterialFormData`, `ConsumableFormData`, `AmmunitionFormData`, `UtilityFormData`) passa a incluir `currencyId`.

**Formulários de criação/edição (`<X>CreateForm`)**
Arquivos:
- `app-web/src/app/(authorized)/equipamentos/components/EquipmentCreateForm/index.tsx`
- `app-web/src/app/(authorized)/materiais/components/MaterialCreateForm/index.tsx`
- `app-web/src/app/(authorized)/consumiveis/components/ConsumableCreateForm/index.tsx` (confirmar nome exato da pasta ao implementar)
- `app-web/src/app/(authorized)/municoes/components/AmmunitionCreateForm/index.tsx`
- `app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx`

Todos os 5 seguem hoje exatamente o mesmo padrão do `EquipmentCreateForm` (confirmado por leitura de código). Em cada um:
- Chamar `useCurrenciesQuery()` (mesmo padrão de `useAttributesQuery()` em `SkillCreateForm`) e usar `data ?? []` como `options`.
- Adicionar `FormAutocompleteInput<XFormData, ICurrency>` para `currencyId`, com `getOptionLabel={(currency) => \`${currency.abbreviation} - ${currency.name}\`}`, `getOptionValue={(currency) => currency.id}`, label "Moeda".
- Alterar o `FormTextInput` de `price` para `type="number"` com `slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}`, seguindo exatamente o padrão já usado em `EventCreateForm` para `startYear`/`endYear`.
- No `buildPayload`, converter `price: data.price ? Number(data.price) : undefined` e `currencyId: data.currencyId || undefined` (mesmo padrão de conversão numérica do `EventCreateForm`).
- No `reset` do modo de edição, mapear `price: <entidade>.price != null ? String(<entidade>.price) : ''` e `currencyId: <entidade>.currency?.id ?? ''`.
- Ajuste de layout: hoje "Descrição" e "Informações Privadas" ficam lado a lado em `<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">`. Trocar para dois blocos empilhados, cada um ocupando a linha inteira, com "Informações Privadas" abaixo de "Descrição" — mesmo padrão já usado em `EventCreateForm` (cada `FormRichTextInput` em seu próprio container de largura total, em sequência, sem grid de 2 colunas).

**Visualização de detalhe (`<X>View`)**
Arquivos:
- `app-web/src/app/(authorized)/equipamentos/components/EquipmentView/index.tsx`
- `app-web/src/app/(authorized)/materiais/components/MaterialView/index.tsx`
- `app-web/src/app/(authorized)/consumiveis/components/ConsumableView/index.tsx`
- `app-web/src/app/(authorized)/municoes/components/AmmunitionView/index.tsx`
- `app-web/src/app/(authorized)/utilitarios/components/UtilityView/index.tsx`

Todos os 5 seguem hoje o mesmo padrão do `EquipmentView` (bloco "Preço" com ícone `FiDollarSign`, usando `equipment.price || NOT_INFORMED`). Em cada um:
- Substituir a exibição atual (`{equipment.price || NOT_INFORMED}`) pela chamada ao novo utilitário `formatPriceWithCurrency(entidade.price, entidade.currency)`.
- Manter o restante do layout do bloco (ícone, `Label` "Preço") inalterado.
- Os blocos de "Descrição" e "Informações Privadas" em si (com fallback `NOT_INFORMED` via `RichTextViewer emptyLabel`) não são afetados por esta demanda — só o layout do formulário muda, não o da visualização.

**Listagem (`<X>ListItem` e `<X>List`)**
Arquivos de item de linha:
- `app-web/src/app/(authorized)/equipamentos/components/EquipmentListItem/index.tsx`
- `app-web/src/app/(authorized)/materiais/components/MaterialsListItem/index.tsx`
- `app-web/src/app/(authorized)/consumiveis/components/ConsumableListItem/index.tsx` (confirmar nome exato da pasta ao implementar)
- `app-web/src/app/(authorized)/municoes/components/AmmunitionListItem/index.tsx`
- `app-web/src/app/(authorized)/utilitarios/components/UtilityListItem/index.tsx`

Arquivos de tabela/cabeçalho:
- `app-web/src/app/(authorized)/equipamentos/components/EquipmentList/index.tsx`
- `app-web/src/app/(authorized)/materiais/components/MaterialsList/index.tsx`
- `app-web/src/app/(authorized)/consumiveis/components/ConsumableList/index.tsx` (confirmar nome exato da pasta ao implementar)
- `app-web/src/app/(authorized)/municoes/components/AmmunitionList/index.tsx`
- `app-web/src/app/(authorized)/utilitarios/components/UtilityList/index.tsx`

Hoje nenhuma das 5 listagens exibe preço. Em cada par `<X>List`/`<X>ListItem`:
- Adicionar nova coluna "Preço" no `TableHead` do `<X>List` (nova `TableCell` com `Label` "Preço"), ajustando o `colSpan` da linha de "nenhum item encontrado" de 4 para 5.
- Adicionar a `TableCell` correspondente no `<X>ListItem`, exibindo `formatPriceWithCurrency(item.price, item.currency)` (mesmo utilitário usado na View).
- Não alterar as colunas/ações existentes (Imagem, Nome, Tags, Ações) nem a lógica de exibir/ocultar Editar/Excluir.

**Filtros**
- Os componentes `<X>FilterSection` das 5 entidades (`EquipmentFilterSection`, `MaterialsFilterSection`, `ConsumableFilterSection`, `AmmunitionFilterSection`, `UtilityFilterSection`) permanecem inalterados — sem filtro por moeda ou faixa de preço.

**Acesso Google**
- Nenhuma mudança de comportamento nesta demanda: `<X>ListItem` já oculta os ícones de Editar/Excluir para `provider: 'google'` (padrão `web-permissao-google-readonly`, confirmado no código atual via `useIsGoogleUser`), mantendo somente Visualizar. A nova coluna "Preço" e o campo "Moeda" no formulário são apenas mais um dado exibido/editável dentro do fluxo já existente — usuários Google continuam sem acesso a criar/editar/excluir, mas veem preço+moeda normalmente na visualização e na listagem.

Status: concluído
Componentes: `app-web/src/app/(authorized)/equipamentos/components/{EquipmentCreateForm,EquipmentView,EquipmentList,EquipmentListItem}/index.tsx`, `app-web/src/app/(authorized)/materiais/components/{MaterialCreateForm,MaterialView,MaterialsList,MaterialsListItem}/index.tsx`, `app-web/src/app/(authorized)/consumiveis/components/{ConsumableCreateForm,ConsumableView,ConsumablesList,ConsumablesListItem}/index.tsx`, `app-web/src/app/(authorized)/municoes/components/{AmmunitionCreateForm,AmmunitionView,AmmunitionList,AmmunitionListItem}/index.tsx`, `app-web/src/app/(authorized)/utilitarios/components/{UtilityCreateForm,UtilityView,UtilitiesList,UtilitiesListItem}/index.tsx`
Arquivos: `app-web/src/shared/interfaces/Entities/Currency/index.ts` (novo), `app-web/src/shared/interfaces/Entities/index.ts`, `app-web/src/shared/interfaces/Entities/{Equipment,Material,Consumable,Ammunition,Utility}/index.ts`, `app-web/src/hooks/Queries/EntityQueries/useCurrenciesQuery/index.ts` (novo), `app-web/src/hooks/Queries/EntityQueries/index.ts`, `app-web/src/shared/util/FormatPriceWithCurrency/index.ts` (novo), `app-web/src/shared/util/index.ts`, `app-web/src/shared/formSchemas/{Equipment,Material,Consumable,Ammunition,Utility}FormSchema/index.ts`

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas, todas conformes:

1. **Consistência entre as 5 features** — `EquipmentCreateForm`, `MaterialCreateForm`, `ConsumableCreateForm`, `AmmunitionCreateForm`, `UtilityCreateForm` são idênticos em estrutura (apenas nomes de entidade/URL/variável trocados), assim como os 5 `*View`, os 5 pares `*List`/`*ListItem` e os 5 `*FormSchema`. Nenhuma feature ficou divergente ou para trás.

2. **Integração com o contrato real do backend** — Confirmado por leitura direta:
   - `app-api/src/modules/currencies/currencies.controller.ts` expõe `GET /currencies` retornando `CurrencyResponseDto[]` com `{ id, abbreviation, name }`, batendo exatamente com `ICurrency` e `useCurrenciesQuery`.
   - `equipment-response.dto.ts`/`equipment-list-item-response.dto.ts` (e os 4 equivalentes de materials/consumables/ammunition/utilities) expõem `price: number | null` e `currency: CurrencyResponseDto | null` tanto no detalhe quanto no item de listagem, batendo com as interfaces `IEquipment`/`IEquipmentListItem` (e equivalentes) no frontend.
   - `create-equipment.dto.ts` (e os 4 equivalentes) aceitam `price?: number` e `currencyId?: string`, com `@ValidateIf((dto) => dto.price !== undefined && dto.price !== null)` tornando `currencyId` obrigatório apenas quando `price` é informado — coerente com a validação `.superRefine` do zod no frontend.

3. **Regra crítica de payload (`price: null` vs `undefined`)** — Confirmado nos 5 `buildPayload`: `price: data.price ? Number(data.price) : null` (nunca `undefined`) e `currencyId: data.currencyId || undefined`. Isso bate com `equipment.service.ts` (e equivalentes), que só zera `equipment.currency = null` quando `dto.price === null` explicitamente (linhas ~155-161), ignorando o campo quando `undefined`. Comportamento correto nas 5 entidades.

4. **`formatPriceWithCurrency`** (`app-web/src/shared/util/FormatPriceWithCurrency/index.ts`) — Os 4 casos batem com o esperado: ambos preenchidos → `"{price} {abbreviation} - {name}"`; só preço → `"{price}"`; só moeda → `"{abbreviation} - {name}"`; nenhum → `NOT_INFORMED` (`'Não informado'`). Usa `price != null` (comparação com `null`/`undefined`, não falsy check), portanto `price === 0` é tratado corretamente como valor válido e não cai no fallback.

5. **Validação zod condicional** — Os 5 `*FormSchema` usam `.superRefine` adicionando issue em `currencyId` quando `price !== '' && currencyId === ''`, com mensagem em pt-BR ("Selecione a moeda quando o preço for informado"), consistente entre as 5 entidades e com a regra do backend.

6. **Layout dos 5 formulários** — Em todos, "Descrição" está em `<div className="grid grid-cols-1 gap-4">` (largura total) seguida diretamente por "Informações Privadas" fora de qualquer grid de 2 colunas — mesmo padrão usado em `EventCreateForm` (referência confirmada por leitura direta), com "Informações Privadas" corretamente abaixo de "Descrição".

7. **Filtros** — `EquipmentFilterSection`, `MaterialsFilterSection`, `ConsumablesFilterSection`, `AmmunitionFilterSection`, `UtilitiesFilterSection` não contêm nenhuma referência a `price`/`currency`/"Preço"/"Moeda" — permanecem inalterados, conforme exigido.

Verificações adicionais do padrão geral do projeto (também conformes): hooks genéricos de `hooks/Queries` (`useCurrenciesQuery`, `usePostEntity`, `usePutEntity`, `useGetEntityById`) em vez de `useQuery`/`useMutation` bespoke; `invalidateQueryKeys` apontando para a query de listagem em todas as 10 mutações (5 create + 5 update); loading/erro tratados com feedback visual (`CircularProgress` + `showToast`) nos 5 formulários e nas 5 views; ícones via `react-icons` (`FiDollarSign`, `FiEdit2`, `FiEye`, `FiTrash2` etc.) com `aria-label` em pt-BR nos `IconButton`; `useIsGoogleUser` continua ocultando Editar/Excluir nos 5 `*ListItem`, sem alteração de comportamento; reaproveitamento de `FormAutocompleteInput`, `FormTextInput`, `FormRichTextInput` existentes, sem duplicação de UI.