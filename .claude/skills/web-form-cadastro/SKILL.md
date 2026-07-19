---
name: web-form-cadastro
description: Use sempre que for necessário criar um formulário de cadastro/edição de uma entidade no app-web. Define o padrão já estabelecido — formulário renderizado dentro de um FormModal, alternando entre modo criar/editar via uma store de "entidade selecionada", com o submit de sucesso invalidando a query de listagem correspondente para que a lista recarregue automaticamente.
---

# Padrão de formulário de cadastro/edição em modal (app-web)

Referência completa no código: `app-web/src/app/(authorized)/usuarios/` — página
(`page.tsx`), formulário (`components/UserCreateForm`), modal (`shared/components/
Modals/FormModal`) e store (`store/PageStore/UsersStore`).

Este é um componente **específico de página** (ver skill `web-componentes`), fica em
`app/(<grupo>)/<pagina>/components/<Feature>CreateForm/index.tsx`. Antes de escrever o
schema de validação, use a skill `web-form-schema`; antes de escrever as chamadas de
API, use `web-integracao-api`.

## 1. O formulário sempre vive dentro de um `FormModal`

Nunca implemente o cadastro como página separada ou modal customizado — reaproveite
`FormModal` de `shared/components/Modals`. Quem controla `open`/`onClose` e o `title`
do modal é a **página**, não o formulário:

```tsx
<FormModal
  open={isFormModalOpen}
  onClose={handleCloseFormModal}
  title={selectedEntity ? 'Editar <entidade>' : 'Novo <entidade>'}
>
  <EntityCreateForm onSaved={handleCloseFormModal} />
</FormModal>
```

O formulário recebe só um `onSaved: () => void` como prop — ele não sabe fechar o modal
sozinho, apenas avisa a página quando terminou com sucesso.

### Largura do modal e organização dos campos (formulários com muitos campos)

`FormModal` aceita uma prop `size?: 'default' | 'wide'` (default: `'default'`, modal
estreito de coluna única — ver `UserCreateForm`, 3 campos). Use `size="wide"` sempre
que o formulário tiver **mais de 4 campos** ou **qualquer `FormRichTextInput`**:

```tsx
<FormModal
  open={isFormModalOpen}
  onClose={handleCloseFormModal}
  title={selectedEntity ? 'Editar <entidade>' : 'Novo <entidade>'}
  size="wide"
>
  <EntityCreateForm onSaved={handleCloseFormModal} />
</FormModal>
```

Dentro do formulário, agrupe os campos em duas grids separadas (nesta ordem), em vez
da antiga coluna única (`flex flex-col gap-4`) — ver `CreatureCreateForm` como
referência completa:

```tsx
<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {/* FormTextInput, FormAutocompleteInput, FormPasswordInput, etc — 4 colunas */}
  </div>

  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {/* FormRichTextInput — até 2 colunas, cada um ocupando uma célula da grid */}
  </div>

  <PrimaryButton type="submit" isLoading={isPending}>...</PrimaryButton>
</form>
```

- Primeira grid: todos os campos "padrão" (texto, autocomplete, senha) em até 4
  colunas (`lg:grid-cols-4`, colapsando para 2 em telas médias e 1 em telas pequenas).
- Segunda grid: todos os `FormRichTextInput`, em até 2 colunas (`lg:grid-cols-2`).
- Não misture os dois tipos de campo na mesma grid — separar em duas seções deixa a
  leitura do formulário mais previsível quando há muitos campos.

## 2. Modo criar vs. editar é decidido por uma store de "entidade selecionada"

Siga o padrão de `useSelectedUserStore` (`store/PageStore/<Feature>Store`):

```ts
interface SelectedEntityState {
  selectedEntity: IEntity | null;
  setSelectedEntity: (entity: IEntity) => void;
  resetSelectedEntity: () => void;
}
```

- Na página: `handleOpenCreateModal` chama `resetSelectedEntity()` antes de abrir;
  `handleEdit(entity)` chama `setSelectedEntity(entity)` antes de abrir.
  `handleCloseFormModal` também chama `resetSelectedEntity()` ao fechar, para o modal
  nunca reabrir em modo edição por engano.
- No formulário: `const isEditMode = !!selectedEntity;` deriva o modo a partir da
  store — não crie uma prop separada `mode`/`isEditing` passada manualmente.

## 3. Formulário: schema, defaults e reset ao trocar de entidade selecionada

```tsx
const { control, handleSubmit, reset } = useForm<EntityFormData>({
  resolver: isEditMode ? entityEditFormResolver : entityFormResolver,
  defaultValues: entityFormDefaultValues,
});

useEffect(() => {
  reset(selectedEntity ? { ...camposDaEntidadeSelecionada } : entityFormDefaultValues);
}, [selectedEntity, reset]);
```

Resolver e defaults vêm do arquivo gerado pela skill `web-form-schema` — nunca declare
validação solta dentro do componente de formulário.

## 4. Duas mutations (criar/editar) — a regra que não pode faltar: `invalidateQueryKeys`

```tsx
const createMutation = usePostEntity<IEntity, EntityFormData>({
  url: '/<entidades>',
  invalidateQueryKeys: [['/<entidades>']],
  onSuccess: () => {
    showToast({ message: '<Entidade> cadastrado com sucesso.', type: 'success' });
    reset(entityFormDefaultValues);
    onSaved();
  },
  onError: (error) => {
    showToast({
      message: error.response?.data?.message ?? 'Não foi possível cadastrar.',
      type: 'error',
    });
  },
});

const updateMutation = usePutEntity<IEntity, UpdateEntityPayload>({
  url: `/<entidades>/${selectedEntity?.id}`,
  invalidateQueryKeys: [['/<entidades>']],
  onSuccess: () => {
    showToast({ message: '<Entidade> atualizado com sucesso.', type: 'success' });
    onSaved();
  },
  onError: (error) => {
    showToast({
      message: error.response?.data?.message ?? 'Não foi possível atualizar.',
      type: 'error',
    });
  },
});
```

- **`invalidateQueryKeys` deve sempre incluir a mesma `queryKey` usada pela
  listagem** (`useGetEntityList` daquela entidade — normalmente `[url]`, ex.:
  `[['/<entidades>']]`). É isso, e só isso, que garante que a lista recarregue
  sozinha após o submit — nunca implemente o recarregamento chamando `refetch()`
  manualmente ou recarregando a página.
- Toda mutation trata `onSuccess` (toast + `onSaved()`) e `onError` (toast com
  mensagem da API e fallback em pt-BR) — nunca deixe uma mutation sem as duas.
- `onSubmit` decide qual mutation disparar com base em `isEditMode`, montando o
  payload de update sem incluir campos vazios que não devem sobrescrever o valor atual
  (ex.: senha em branco na edição não é enviada — ver `UserCreateForm`).

## 5. Botão de submit reflete o estado de loading das duas mutations

```tsx
const isPending = createMutation.isPending || updateMutation.isPending;
// <PrimaryButton type="submit" isLoading={isPending}>...</PrimaryButton>
```
