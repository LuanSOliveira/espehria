---
name: web-integracao-api
description: Use sempre que for necessário integrar o app-web com um endpoint da API (buscar, criar, atualizar ou excluir dados). Decide entre reaproveitar um dos hooks genéricos já existentes em hooks/Queries ou criar um novo, e define o padrão a seguir em ambos os casos (React Query + ApiFactory).
---

# Padrão de integração com a API (app-web)

Referência completa no código: `app-web/src/hooks/Queries/` (`useGetEntityList`,
`usePostEntity`, `usePutEntity`, `useDeleteEntity`) e uso em
`app-web/src/app/(authorized)/usuarios/`.

## Primeiro: os 4 hooks genéricos quase sempre resolvem

Antes de criar qualquer coisa nova, verifique se a integração que você precisa é um dos
quatro casos abaixo — se for, **não crie um hook novo**, apenas chame o hook genérico
com a `url` do endpoint:

| Operação          | Hook               | Retorno         |
|-------------------|---------------------|-----------------|
| Listar (paginado) | `useGetEntityList`  | `useQuery`      |
| Criar             | `usePostEntity`     | `useMutation`   |
| Atualizar         | `usePutEntity`      | `useMutation`   |
| Excluir           | `useDeleteEntity`   | `useMutation`   |

Todos internamente já usam `ApiFactory(getAuthToken())` (autenticado) e tipam o erro
como `AxiosError<IAxioDataError>` — o componente que os chama não lida com axios
diretamente em nenhum momento.

Uso típico (veja `usuarios/page.tsx` e `UserCreateForm`):
```ts
const { data, isLoading } = useGetEntityList<IUser, IUserListFilters>({
  url: '/users',
  filters,
});

const createMutation = usePostEntity<IUser, UserFormData>({
  url: '/users',
  invalidateQueryKeys: [['/users']],
  onSuccess: () => { showToast({ message: '...', type: 'success' }); },
  onError: (error) => {
    showToast({
      message: error.response?.data?.message ?? 'Mensagem padrão em pt-BR.',
      type: 'error',
    });
  },
});
```

Pontos que sempre devem ser seguidos:
- `invalidateQueryKeys` deve incluir a `queryKey` usada pela listagem correspondente
  (o primeiro elemento da tupla passada a `useGetEntityList`, tipicamente `[url]`) para
  que a lista se atualize sozinha após a mutação.
- Toda mutação trata `onSuccess` (toast de sucesso via `showToast`, de
  `shared/util`) e `onError` (toast de erro, usando `error.response?.data?.message` com
  fallback em pt-BR) — nunca deixe uma mutação sem feedback visual de erro.
- `useGetEntityList` já preserva `placeholderData` entre trocas de filtro/página —
  não implemente loading manual para isso.

## Quando criar um hook novo em `hooks/Queries`

Só crie um hook novo quando a interação **não** for um CRUD padrão via um dos quatro
verbos acima (ex.: uma ação específica tipo `/users/:id/activate`, ou um retorno que não
é nem entidade única nem lista paginada). Nesse caso, siga exatamente a mesma
estrutura dos hooks existentes:
- Pasta própria em `hooks/Queries/<useNomeDoHook>/index.ts`, reexportada pelo barrel
  `hooks/Queries/index.ts`.
- Parâmetros de entrada tipados via generics (`TResponse`, `TPayload`, `TFilters`),
  incluindo `url` e, se for mutação, `invalidateQueryKeys?`/`onSuccess?`/`onError?`.
- `ApiFactory(getAuthToken())` para chamada autenticada (ou `ApiAuthFactory()` só para
  fluxos não autenticados, como login).
- Erro tipado como `AxiosError<IAxioDataError>` (de `shared/interfaces`).
- `'use client'` no topo do arquivo.

Não escreva `useQuery`/`useMutation` diretamente dentro de um componente de página —
mesmo para um caso não coberto pelos 4 genéricos, a chamada de API deve morar em um
hook dedicado em `hooks/Queries`, nunca inline.
