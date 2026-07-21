# Task Web: Tags (CRUD completo)

## Contexto
Não há `spec.md` para esta demanda — pedido já esclarecido diretamente pelo usuário.

Requisitos de negócio:
- Nova página "Tags" na seção "Gerenciamento" do menu lateral (Sidebar), ao lado de "Usuários".
- Rota registrada em `shared/routes.ts` (`APP_ROUTES.private`).
- Listagem paginada com filtro por nome (seção de filtros dedicada).
- Cada item da lista exibe: nome, cor (exibição visual da cor) e ações de editar/excluir.
- Formulário de criar/editar em `FormModal`, com campos Nome (texto) e Cor (seleção de cor).
- Schema de validação zod em `shared/formSchemas/`.
- Integração via hooks genéricos de `hooks/Queries`, com invalidação da listagem após mutações.
- Store Zustand para tag selecionada, em `store/PageStore/`.
- Confirmação de exclusão via `ConfirmationModal`.
- Referência estrutural: feature `usuarios` (`app-web/src/app/(authorized)/usuarios/`).

Investigação de código existente relevante:
- `app-web/src/app/(authorized)/usuarios/` é o CRUD de referência: `page.tsx` (orquestra estado de filtros, modal de formulário e modal de confirmação), `components/UsersList` (tabela + `TablePagination`), `components/UsersListItem` (linha com ações editar/excluir via `IconButton` + `Tooltip` com `FiEdit2`/`FiTrash2`), `components/UserCreateForm` (formulário `react-hook-form` com `usePostEntity`/`usePutEntity`, alterna entre schema de criação e de edição), `components/UsersFilterSection` (formulário de filtro isolado, com `DefaultTextInput` + `PrimaryButton`).
- `shared/formSchemas/UserFormSchema` mostra o padrão: campos base compartilhados + `userFormSchema`/`userEditFormSchema`, `*FormResolver` via `zodResolver`, `*FormDefaultValues`, tipo `*FormData` via `z.infer`.
- `shared/interfaces/Entities/User` e `Entities/Creature` mostram o padrão de interfaces: `I<Entidade>` (estende `IEntity`) e `I<Entidade>ListFilters` (campos de filtro + `page`/`perPage`).
- `store/PageStore/UsersStore` e `CreaturesStore` mostram o padrão de store Zustand por feature: `selected<Entidade>`, `setSelected<Entidade>`, `resetSelected<Entidade>`.
- `hooks/Queries` expõe os genéricos `useGetEntityList`, `usePostEntity`, `usePutEntity`, `useDeleteEntity` (`DefaultQueries`) — `useGetEntityList` recebe `url`/`filters` e retorna `IPaginatedResponse<TItem>`; os demais recebem `url`, `invalidateQueryKeys` e callbacks `onSuccess`/`onError`.
- `shared/components/Inputs` expõe `DefaultInputs` (`DefaultTextInput`, `DefaultPasswordInput`, `DefaultAutocompleteInput`) e `FormInputs` (`FormTextInput`, `FormPasswordInput`, `FormAutocompleteInput`, `FormRichTextInput`). **Não existe nenhum input de seleção/escolha de cor (color picker) em `shared/components/Inputs`** — precisa ser criado.
- `shared/components/Modals` expõe `FormModal` e `ConfirmationModal` prontos para reuso, sem alterações necessárias.
- `app-web/src/app/(authorized)/components/Sidebar/index.tsx` define `NAV_SECTIONS`, incluindo a seção `title: 'Gerenciamento'` que hoje só tem o item "Usuários" — precisa receber um novo item "Tags" apontando para a nova rota, com um ícone de `react-icons/fi` (ex.: `FiTag`).

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/shared/components/Inputs/FormInputs/FormColorInput/index.tsx; app-web/src/app/(authorized)/tags/components/TagsFilterSection/index.tsx; app-web/src/app/(authorized)/tags/components/TagsList/index.tsx; app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx
Arquivos: app-web/src/app/(authorized)/tags/page.tsx; app-web/src/app/(authorized)/tags/components/TagCreateForm/index.tsx; app-web/src/shared/routes.ts; app-web/src/app/(authorized)/components/Sidebar/index.tsx; app-web/src/shared/interfaces/Entities/Tag/index.ts; app-web/src/shared/interfaces/Entities/index.ts; app-web/src/store/PageStore/TagsStore/index.ts; app-web/src/store/index.ts; app-web/src/shared/formSchemas/TagFormSchema/index.ts; app-web/src/shared/formSchemas/index.ts; app-web/src/shared/components/Inputs/FormInputs/index.ts

#### Componentes

- Componente: `FormColorInput` (novo, em `shared/components/Inputs/FormInputs/FormColorInput/`)
  - Decisão: **criar novo componente**, pois não existe nenhum input de seleção de cor reaproveitável em `shared/components/Inputs` (nem em `DefaultInputs`, nem em `FormInputs`). Seguir o mesmo padrão estrutural de `FormTextInput` (uso de `Controller` do `react-hook-form`, `Label` acima do campo, `fieldState.error` exibido como `helperText`, estilos vindos de `APP_INPUT_STYLES`/`APP_INPUT_BASE_FONT_SIZE`, suporte a `useAccessibleFontSize`).
  - Props: `name: FieldPath<TFieldValues>`, `control: Control<TFieldValues>`, `id?: string`, `label?: ReactNode`, restante de props compatíveis com um input de cor nativo (ex.: `disabled`).
  - Comportamento esperado: usa um `<input type="color">` (ou um MUI `TextField` com `type="color"`) controlado via `Controller`, exibindo o valor hexadecimal atual como preview visual (retângulo/círculo preenchido com a cor selecionada) e permitindo que o usuário escolha uma nova cor pelo seletor nativo do navegador; exibe erro de validação abaixo do campo, no mesmo padrão visual dos demais `FormInputs`. Deve ser exportado em `shared/components/Inputs/FormInputs/index.ts` e re-exportado por `shared/components/Inputs/index.ts`.
  - Observação: caso o time de design/produto já tenha um requisito mais específico de UX para o seletor de cor (ex.: paleta pré-definida vs. seletor livre), isso não foi informado no pedido — sinalizar essa lacuna caso surja durante a implementação; por padrão, seguir com seletor de cor livre (`type="color"`), que é suficiente para os requisitos descritos.

- Componente: `TagsFilterSection` (novo, em `app/(authorized)/tags/components/TagsFilterSection/`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void` (mesma assinatura de `UsersFilterSectionProps`, trocando `email` por `name`).
  - Comportamento esperado: mesmo padrão de `UsersFilterSection` — formulário com `DefaultTextInput` (label "Nome", placeholder "Buscar por nome", ícone `FiSearch`) e `PrimaryButton` do tipo submit com texto "Filtrar"; nunca inline em `page.tsx`.

#### Funcionalidade

- Rota: adicionar `tags: '/tags'` em `MENU_ROUTES` e expor em `APP_ROUTES.private.tags` (`shared/routes.ts`).
- Sidebar: adicionar item `{ label: 'Tags', href: APP_ROUTES.private.tags, icon: FiTag }` (import de `react-icons/fi`) à seção `title: 'Gerenciamento'` em `app/(authorized)/components/Sidebar/index.tsx`, junto ao item "Usuários" já existente.
- Interfaces (`shared/interfaces/Entities/Tag/index.ts`, exportado via `shared/interfaces/Entities/index.ts`):
  - `ITag extends IEntity { name: string; color: string; }`
  - `ITagListFilters { name?: string; page?: number; perPage?: number; }`
- Store: `store/PageStore/TagsStore/index.ts`, seguindo exatamente o padrão de `UsersStore`/`CreaturesStore`: `useSelectedTagStore` com `selectedTag: ITag | null`, `setSelectedTag`, `resetSelectedTag`; exportar em `store/index.ts` (ou equivalente barrel já usado pelos demais stores).
- Schema de formulário: `shared/formSchemas/TagFormSchema/index.ts`, exportado em `shared/formSchemas/index.ts`:
  - `tagFormSchema = z.object({ name: z.string().min(1, 'Informe o nome').min(2, 'Nome muito curto'), color: z.string().min(1, 'Informe a cor') })` — validar formato hexadecimal (ex.: `.regex(/^#([0-9A-Fa-f]{6})$/, 'Informe uma cor válida')), compatível com o valor produzido pelo `FormColorInput`.
  - Como não há necessidade de negócio diferente entre criar e editar (não há campo opcional como senha), pode-se usar um único `tagFormSchema`/`tagFormResolver` para ambos os modos, seguindo o mesmo padrão de nomenclatura (`tagFormResolver`, `tagFormDefaultValues: { name: '', color: '#000000' }`, tipo `TagFormData` via `z.infer`). Caso o revisor entenda necessário separar em variante de edição (como em `UserFormSchema`), isso pode ser ajustado, mas não há requisito de negócio que hoje justifique a diferenciação.
- Página `app/(authorized)/tags/page.tsx` (Client Component), espelhando `usuarios/page.tsx`:
  - Estado local: `nameInput`, `isFormModalOpen`, `tagPendingDelete: ITag | null`, `filters: ITagListFilters` (`page`, `perPage: APP_DEFAULT_PAGE_SIZE`).
  - `useSelectedTagStore` para `selectedTag`/`setSelectedTag`/`resetSelectedTag`.
  - `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters })` para a listagem.
  - `useDeleteEntity({ url: '/tags/${tagPendingDelete?.id}', invalidateQueryKeys: [['/tags']], onSuccess, onError })` com toasts em pt-BR ("Tag excluída com sucesso." / "Não foi possível excluir a tag.").
  - `handleSearch` atualiza `filters.name` a partir de `nameInput` (trim, `undefined` se vazio) e reseta `page` para 1.
  - `handlePageChange`, `handleOpenCreateModal` (reset + abre modal), `handleEdit` (seleciona tag + abre modal), `handleCloseFormModal` (fecha + reset).
  - Render: `PageContainer` com `Title` "Tags", botão "Novo" (`PrimaryButton`), `TagsFilterSection`, `TagsList`, `FormModal` (título "Editar tag" / "Nova tag") contendo `TagCreateForm`, `ConfirmationModal` de exclusão com mensagem `Tem certeza que deseja excluir a tag "${tagPendingDelete?.name}"?`.
- Componentes de listagem (mesmo padrão de `UsersList`/`UsersListItem`, específicos da página, sem necessidade de ir para `shared/components/`):
  - `app/(authorized)/tags/components/TagsList/index.tsx`: `Table` com colunas "Nome", "Cor" e "Ações", `TableBody` com estado vazio ("Nenhuma tag encontrada.") e `TablePagination` igual ao padrão de `UsersList`.
  - `app/(authorized)/tags/components/TagsListItem/index.tsx`: célula "Cor" exibindo um indicador visual (ex.: `Box`/`span` quadrado ou circular com `backgroundColor: tag.color`, borda sutil) ao lado (ou não) do valor hexadecimal em texto; célula "Ações" com `IconButton` + `Tooltip` "Editar" (`FiEdit2`) e "Excluir" (`FiTrash2`), no mesmo padrão de `UsersListItem`.
- Formulário `app/(authorized)/tags/components/TagCreateForm/index.tsx`, espelhando `UserCreateForm`:
  - `useForm<TagFormData>({ resolver: tagFormResolver, defaultValues: tagFormDefaultValues })`.
  - `useEffect` que faz `reset` com os dados de `selectedTag` (nome e cor) ao entrar em modo de edição, ou com `tagFormDefaultValues` ao criar.
  - `usePostEntity<ITag, TagFormData>({ url: '/tags', invalidateQueryKeys: [['/tags']], ... })` e `usePutEntity<ITag, TagFormData>({ url: '/tags/${selectedTag?.id}', invalidateQueryKeys: [['/tags']], ... })`, com toasts em pt-BR ("Tag cadastrada com sucesso." / "Tag atualizada com sucesso." / mensagens de erro com fallback caso a API não retorne `message`).
  - Campos do formulário: `FormTextInput` (name="name", label "Nome", placeholder "Digite o nome da tag") e `FormColorInput` (name="color", label "Cor").
  - Botão `PrimaryButton` de submit com label "Salvar" (edição) / "Cadastrar" (criação), com `isLoading` a partir do estado `isPending` combinado das duas mutations.
- Integrações com API:
  - `GET /tags` — listagem paginada, aceita `page`, `perPage` e `name` (filtro) como query params, retorno no formato `IPaginatedResponse<ITag>` (mesmo formato usado por `/users`).
  - `POST /tags` — criação, payload `{ name: string; color: string }`.
  - `PUT /tags/:id` — atualização, mesmo payload de criação.
  - `DELETE /tags/:id` — exclusão.
- Formulário/validação:
  - `name`: obrigatório, mínimo de 1 caractere (mensagem "Informe o nome"), mínimo de 2 caracteres (mensagem "Nome muito curto").
  - `color`: obrigatório, deve corresponder a um hexadecimal válido de 6 dígitos (`#RRGGBB`), mensagem "Informe uma cor válida".

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/shared/components/Inputs/FormInputs/FormColorInput/index.tsx
- app-web/src/shared/components/Inputs/FormInputs/index.ts
- app-web/src/shared/components/Inputs/index.ts
- app-web/src/app/(authorized)/tags/components/TagsFilterSection/index.tsx
- app-web/src/app/(authorized)/tags/components/TagsList/index.tsx
- app-web/src/app/(authorized)/tags/components/TagsListItem/index.tsx
- app-web/src/app/(authorized)/tags/components/TagCreateForm/index.tsx
- app-web/src/app/(authorized)/tags/page.tsx
- app-web/src/shared/routes.ts
- app-web/src/app/(authorized)/components/Sidebar/index.tsx
- app-web/src/shared/interfaces/Entities/Tag/index.ts
- app-web/src/shared/interfaces/Entities/index.ts
- app-web/src/store/PageStore/TagsStore/index.ts
- app-web/src/store/index.ts
- app-web/src/shared/formSchemas/TagFormSchema/index.ts
- app-web/src/shared/formSchemas/index.ts

Observações de conformidade verificadas (sem achados de problema, apenas registro do que foi validado):
- `FormColorInput` segue exatamente o padrão estrutural de `FormTextInput` (`Controller`, `Label` com `htmlFor`, `fieldState.error` como `helperText`, `APP_INPUT_STYLES`/`APP_INPUT_BASE_FONT_SIZE`, `useAccessibleFontSize`), usa `<TextField type="color">` (equivalente ao `<input type="color">` nativo pedido no plano) e é exportado corretamente em `FormInputs/index.ts` e reexportado em `Inputs/index.ts`.
- `TagsFilterSection` é um componente apresentacional dedicado (sem estado/chamada de API própria), recebendo `nameValue`/`onNameChange`/`onSubmit` via props — não há `<form>` de filtro inline em `tags/page.tsx`, atendendo ao padrão `web-secao-filtros`.
- `TagsList`/`TagsListItem` seguem o mesmo padrão estrutural de `UsersList`/`UsersListItem` (Table + TablePagination, estado vazio em pt-BR, `IconButton`+`Tooltip` com `aria-label` em pt-BR para editar/excluir, ícones `FiEdit2`/`FiTrash2`/`FiSearch`/`FiTag` de `react-icons/fi`); a célula "Cor" usa um indicador visual (`Box` com `backgroundColor: tag.color`) além do valor hexadecimal em texto.
- `TagCreateForm` segue o padrão `web-form-cadastro`: modo criar/editar derivado de `useSelectedTagStore` (não de prop manual), `usePostEntity`/`usePutEntity` de `hooks/Queries` com `invalidateQueryKeys: [['/tags']]` apontando corretamente para a query da listagem (`useGetEntityList({ url: '/tags' })` em `page.tsx`), toasts de sucesso/erro em pt-BR com fallback de mensagem, `reset` via `useEffect` a partir de `selectedTag`. O uso de um único `tagFormSchema`/`tagFormResolver` (sem variante `*EditFormSchema`) é adequado, pois não há diferença de regra de negócio entre criar e editar (diferentemente de `UserFormSchema`, que trata senha opcional).
- `tags/page.tsx` espelha `usuarios/page.tsx` no mesmo formato (estado de filtros, `FormModal`+`ConfirmationModal`, `useDeleteEntity` com `invalidateQueryKeys` e toasts em pt-BR).
- Rota `tags` registrada em `MENU_ROUTES`/`APP_ROUTES.private` e item de Sidebar adicionado à seção "Gerenciamento" com ícone `FiTag` de `react-icons/fi`.
- `ITag`/`ITagListFilters` e `useSelectedTagStore` seguem exatamente os padrões de `IUser`/`IUserListFilters` e `useSelectedUserStore`, devidamente exportados nos barrels (`shared/interfaces/Entities/index.ts`, `store/index.ts`).
- `tagFormSchema` valida `name` (mínimo 1/2 caracteres) e `color` (regex `^#([0-9A-Fa-f]{6})$`) com mensagens em pt-BR, compatível com o valor produzido pelo `FormColorInput` e com o payload esperado pela API (`{ name, color }`).
