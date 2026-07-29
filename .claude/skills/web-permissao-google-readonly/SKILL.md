---
name: web-permissao-google-readonly
description: Use sempre que uma página nova (ou já existente) tiver listagem com ações de criar, editar e excluir uma entidade no app-web. Define como ocultar essas ações — deixando apenas "visualizar" — para usuários autenticados via Google (`provider: 'google'`), usando o hook `useIsGoogleUser`, a menos que a demanda explicitamente peça outro comportamento.
---

# Restrição de acesso para usuários Google (app-web)

A aplicação tem dois tipos de usuário (`provider`: `local` | `google`). Por padrão de
produto, usuários `google` só podem **visualizar** entidades com listagem
criar/editar/excluir — o botão "Novo" e as ações de editar/excluir ficam ocultos, nunca
apenas desabilitados. Esse padrão já está aplicado em todas as páginas de conteúdo
(`criaturas`, `divindades`, `locais`, `racas`, `personagens`, `organizacoes`,
`familias`, `eras`, `eventos`, `tags`). A entrada de navegação "Usuários" e a rota
`/usuarios` são totalmente ocultas/bloqueadas para `google` (ver seção final). Aplique o
mesmo padrão em qualquer página CRUD nova, **a menos que a task peça explicitamente
outro comportamento**.

Este padrão espelha, na UI, a restrição já aplicada no backend pela skill
`api-permissao-google-readonly` (`GoogleAccessGuard`) — o backend já rejeita a
requisição, mas os botões precisam ficar ocultos para uma UX coerente.

## Peça do padrão (já existe — apenas reutilize)

- `useIsGoogleUser` em `app-web/src/hooks/Auth/index.ts` — deriva de `useMeQuery()`
  (`data?.provider === 'google'`). Não recrie esse hook nem leia `provider` de outra
  forma (ex.: decodificando o token manualmente em componentes React).

## Como aplicar em uma página CRUD nova

**1. Botão "Novo" em `page.tsx`** — envolva com a checagem, não desabilite:

```tsx
import { useIsGoogleUser } from '@/hooks/Auth';

export default function NomePage() {
  const isGoogleUser = useIsGoogleUser();
  // ...
  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1">Nome</Title>
        {!isGoogleUser && (
          <PrimaryButton onClick={handleOpenCreateModal}>Novo</PrimaryButton>
        )}
      </div>
      {/* ... */}
    </PageContainer>
  );
}
```

**2. Ações de editar/excluir no `<Nome>sListItem`** — a checagem fica **dentro do
próprio ListItem**, não em `page.tsx` nem nas props do componente `List` (evita
propagar `onEdit`/`onDelete` opcionais por toda a cadeia de props):

```tsx
import { useIsGoogleUser } from '@/hooks/Auth';

export const NomesListItem = ({ nome, onView, onEdit, onDelete }: NomesListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow>
      {/* ...células de dados... */}
      <TableCell align="right">
        <Tooltip title="Visualizar">
          <IconButton onClick={() => onView(nome)}><FiEye /></IconButton>
        </Tooltip>
        {!isGoogleUser && (
          <>
            <Tooltip title="Editar">
              <IconButton onClick={() => onEdit(nome)}><FiEdit2 /></IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton onClick={() => onDelete(nome)}><FiTrash2 /></IconButton>
            </Tooltip>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};
```

- "Visualizar" nunca é ocultado — é a única ação permitida para `google`.
- Se a entidade não tiver ação de visualizar (ex.: `tags`, que edita direto na linha),
  oculte apenas editar/excluir do mesmo jeito.

## Ocultar item de navegação / bloquear rota (para recursos de gerenciamento restrito)

Use isto apenas para páginas de gerenciamento que `google` não deve nem acessar (o caso
já aplicado é `usuarios`) — não é o padrão para páginas de conteúdo comuns, que
continuam visíveis/navegáveis, só com ações ocultas conforme acima.

- **Sidebar**: em `app/(authorized)/components/Sidebar/index.tsx`, filtre o item de
  `NAV_SECTIONS` correspondente com `useIsGoogleUser()` antes de renderizar (ver o
  filtro já aplicado para `APP_ROUTES.private.users`).
- **Rota**: o middleware (`src/proxy.ts`) decodifica o token com `decodeToken()`
  (`services/jwt`, que já tipa o payload com `provider` via `IAuthTokenPayload`) e
  redireciona para `APP_ROUTES.private.home` se `decoded.provider === 'google'` e o
  pathname for a rota restrita — sem chamada extra à API, pois `provider` já vem no JWT.
- **Backend**: o controller correspondente deve usar `@GoogleAccess('blocked')` (skill
  `api-permissao-google-readonly`), não `'read-only'`.

## Regra importante

Se a task pedir explicitamente outro comportamento para usuários Google numa entidade
específica (ex.: acesso total, ou nem visualizar), siga o que foi pedido — este é o
padrão **default**, não uma regra rígida.
