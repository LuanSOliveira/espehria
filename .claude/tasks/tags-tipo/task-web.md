# Task Web: Adição da propriedade "tipo" em Tags

## Contexto
Ver .claude/tasks/tags-tipo/spec.md

Alteração de página já existente (`app-web/src/app/(authorized)/tags/`). Não é criação
de feature nova: reaproveitar integralmente a estrutura atual de list + filtros +
formulário de criação/edição, apenas estendendo-a com o novo campo `type`
(label "Tipo").

## Etapas

### 1. web-dev
Status: concluído
Componentes: `app-web/src/app/(authorized)/tags/components/TagsFilterSection/index.tsx`, `app-web/src/app/(authorized)/tags/components/TagsList/index.tsx`, `app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx`, `app-web/src/app/(authorized)/tags/components/TagCreateForm/index.tsx`
Arquivos: `app-web/src/shared/interfaces/Entities/Tag/index.ts`, `app-web/src/shared/formSchemas/TagFormSchema/index.ts`, `app-web/src/app/(authorized)/tags/page.tsx`

#### Funcionalidade
- Páginas/rotas: `app-web/src/app/(authorized)/tags/page.tsx` (sem nova rota — página
  existente é alterada).

- Arquivos a alterar:
  - `app-web/src/shared/interfaces/Entities/Tag/index.ts`: adicionar `type?: string`
    em `ITag` e `type?: string` em `ITagListFilters` (opcional, mesmo padrão de `name`).
  - `app-web/src/shared/formSchemas/TagFormSchema/index.ts`: adicionar `type` ao
    `tagFormSchema` como `z.string().optional()` (campo opcional, sem regra de tamanho
    mínimo — o limite de 100 caracteres é responsabilidade do backend; não há pedido
    explícito de validação de tamanho máximo no formulário no spec, então não
    adicionar `.max()` a menos que se decida replicar o limite da API por consistência
    — sinalizar essa escolha como detalhe de implementação, não como requisito). Incluir
    `type: ''` em `tagFormDefaultValues`. `TagFormData` é inferido automaticamente do
    schema, não precisa de alteração manual.
  - `app-web/src/app/(authorized)/tags/components/TagsFilterSection/index.tsx`:
    adicionar um segundo `DefaultTextInput` (label "Tipo", placeholder "Buscar por
    tipo", ícone `FiSearch` — mesmo padrão do input de "Nome" existente), com novas
    props `typeValue: string` e `onTypeChange: (value: string) => void` adicionadas à
    interface `TagsFilterSectionProps`, mantendo o mesmo `<form onSubmit>` único (um
    só botão "Filtrar" que envia ambos os filtros).
  - `app-web/src/app/(authorized)/tags/page.tsx`: adicionar estado local
    `typeInput` (`useState('')`) ao lado do já existente `nameInput`; em
    `handleSearch`, incluir `type: typeInput.trim() || undefined` no `setFilters`
    (mesmo padrão usado para `name`); repassar `typeValue={typeInput}` e
    `onTypeChange={setTypeInput}` para `TagsFilterSection`. A busca por `type` segue
    usando o mesmo hook `useGetEntityList<ITag, ITagListFilters>` já existente — sem
    novo hook de query, apenas o novo campo em `ITagListFilters` sendo enviado como
    query param.
  - `app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx`: adicionar
    nova `TableCell` exibindo `tag.type || '-'` (célula de texto simples, seguindo o
    padrão da célula de "Nome").
  - `app-web/src/app/(authorized)/tags/components/TagsList/index.tsx`: adicionar novo
    `TableCell`/`Label` de cabeçalho "Tipo" na `TableHead` (posicionar entre "Cor" e
    "Ações", refletindo a ordem das colunas de dados) e atualizar o `colSpan` da linha
    de "Nenhuma tag encontrada" de `3` para `4`.
  - `app-web/src/app/(authorized)/tags/components/TagCreateForm/index.tsx`: adicionar
    `FormTextInput` para `type` (label "Tipo", placeholder ex. "Digite o tipo da tag",
    campo opcional — sem asterisco/indicação de obrigatoriedade), posicionado após o
    input de "Cor". Ajustar o `reset` no `useEffect` para incluir
    `type: selectedTag.type ?? ''` ao popular o formulário em modo edição, e garantir
    que `tagFormDefaultValues` (já com `type: ''`) seja usado no modo criação.

- Integrações com API: mesmos endpoints já usados pela página, sem novo endpoint:
  - `GET /tags` (listagem, agora aceitando também query param `type` para filtro
    parcial case-insensitive, combinável com `name`).
  - `POST /tags` (criação, payload passa a incluir `type` opcional).
  - `PUT /tags/:id` (edição, payload passa a incluir `type` opcional).
  - `DELETE /tags/:id` (sem alteração).

- Formulário/validação:
  - Campo `type` opcional em `tagFormSchema`, sem valor obrigatório, podendo ser
    enviado em branco. Não introduz nova mensagem de erro (não há regra de
    obrigatoriedade a validar).
  - Campos existentes (`name`, `color`) permanecem inalterados.

- Acesso Google: ocultar criar/editar/excluir (padrão) — nenhuma mudança necessária
  aqui, o comportamento (`useIsGoogleUser`) já está implementado em `page.tsx` e
  `TagsListItem` e continua válido sem alterações; a nova coluna "Tipo" e o novo
  filtro são visíveis para todos os usuários, inclusive `provider: 'google'`
  (somente visualização).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/interfaces/Entities/Tag/index.ts`
- `app-web/src/shared/formSchemas/TagFormSchema/index.ts`
- `app-web/src/app/(authorized)/tags/page.tsx`
- `app-web/src/app/(authorized)/tags/components/TagsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/tags/components/TagsList/index.tsx`
- `app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx`
- `app-web/src/app/(authorized)/tags/components/TagCreateForm/index.tsx`

Pontos verificados especificamente:
- Cabeçalho de `TagsList` (Nome, Cor, Tipo, Ações) alinhado exatamente com a ordem das
  `TableCell` em `TagsListItem`; `colSpan` do estado vazio atualizado corretamente de 3
  para 4.
- `TagsListItem` exibe `tag.type || '-'` como fallback para tipo nulo/vazio.
- `ITagListFilters.type` é passado dentro do objeto `filters` para `useGetEntityList`,
  que repassa o objeto inteiro como `params` do axios (`api.get(url, { params:
  filters })`) — o novo campo é enviado como query param sem necessidade de alteração
  no hook genérico. Em `page.tsx`, `typeInput`/`setTypeInput` seguem exatamente o
  mesmo padrão de `nameInput` (`type: typeInput.trim() || undefined` e reset de
  `page` para 1 dentro do mesmo `setFilters` em `handleSearch`).
- `TagCreateForm` popula `type: selectedTag.type ?? ''` no modo edição e usa
  `tagFormDefaultValues` (com `type: ''`) no modo criação; o `useEffect` de `reset`
  cobre ambos os ramos (`selectedTag` truthy/falsy) sem deixar valor residual entre
  aberturas do modal — ao fechar o modal, `resetSelectedTag()` zera `selectedTag`, o
  que dispara novo `reset(tagFormDefaultValues)` antes da próxima abertura.
- `tagFormSchema` inclui `type: z.string().max(100, 'Tipo deve ter no máximo 100
  caracteres').optional()`, replicando o limite `varchar(100)` do backend, com
  mensagem em pt-BR consistente com as demais regras do schema (`Informe o nome`,
  `Nome muito curto`).
- Ícones novos (`FiSearch` no filtro, `FiLayers` no formulário) importados de
  `react-icons/fi`, sem uso de `@mui/icons-material` ou ícones custom.
- Nenhum `any` introduzido; tipagem de `ITag`/`ITagListFilters`/`TagFormData` coerente
  com os campos usados nos componentes.
- `TagsFilterSection` permanece apresentacional (recebe `typeValue`/`onTypeChange` via
  props, sem estado ou chamada de API própria), reaproveitando `DefaultTextInput` em
  vez de criar input one-off.
- `TagCreateForm` continua renderizado dentro de `FormModal`, com modo criar/editar
  derivado de `useSelectedTagStore` (não de prop manual), e as mutations de criação e
  edição mantêm `invalidateQueryKeys: [['/tags']]` apontando para a query da
  listagem.
- Comportamento de ocultação para `provider: 'google'` (botão "Novo" em `page.tsx` e
  ações de editar/excluir em `TagsListItem` via `useIsGoogleUser`) permanece intacto e
  não foi afetado pelas mudanças, conforme esperado pela spec (coluna e filtro de tipo
  visíveis para todos os usuários).
