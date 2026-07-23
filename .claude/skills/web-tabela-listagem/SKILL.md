---
name: web-tabela-listagem
description: Use sempre que for necessário criar uma tabela/lista de itens de uma entidade no app-web (listagem paginada de usuários, produtos, etc.). Define o padrão já estabelecido de dividir a listagem em um componente List (tabela + paginação) e um componente ListItem (linha), ambos específicos da página — nunca em shared/components.
---

# Padrão de tabela de listagem (app-web)

Referência completa no código: `app-web/src/app/(authorized)/usuarios/components/`
(`UsersList` + `UsersListItem`), consumidos por `usuarios/page.tsx`.

## Por que não é um componente genérico

Uma tabela de listagem sempre conhece a forma dos dados da entidade que lista (colunas,
campos exibidos, ações disponíveis) — por isso ela nunca vai em `shared/components/`,
mesmo sendo um padrão visualmente repetido entre features. Ela é sempre criada dentro
de `components/` da página que a usa (veja a skill `web-componentes` para o critério
geral genérico vs. específico).

## Estrutura: dois componentes, não um

Divida sempre em dois componentes específicos da página:

```
app/(authorized)/<pagina>/components/
  <Entidade>sList/
    index.tsx        # shell da tabela: head, paginação, estado vazio/loading
  <Entidade>sListItem/
    index.tsx        # uma linha (<TableRow>) da tabela
```

### `<Entidade>sList` (shell)

- Recebe via props: a lista de itens, `total`, `page`, `isLoading`, callback de
  mudança de página, e os callbacks de ação (`onEdit`, `onDelete`, etc.) que serão
  repassados a cada item.
- Monta `TableContainer` → `Table` → `TableHead` (uma `TableCell`/`Label` por coluna)
  → `TableBody`, mapeando os itens para `<Entidade>sListItem`.
- Trata o estado vazio explicitamente: se `!isLoading && items.length === 0`, renderiza
  uma `TableRow` com uma `TableCell colSpan={<nº de colunas>}` contendo um
  `DefaultText` com mensagem em pt-BR (ex.: "Nenhum usuário encontrado.").
- Usa `TablePagination` da MUI no rodapé, com `count={total}`, `page={page - 1}`
  (a API é 1-indexed, a MUI é 0-indexed), `rowsPerPage`/`rowsPerPageOptions` a partir de
  `APP_DEFAULT_PAGE_SIZE` (`shared/constants`), e `onPageChange` convertendo de volta
  para 1-indexed (`newPage + 1`).
- Estiliza bordas de célula e cores com `APP_COLORS` (nunca hex direto), consistente
  com o restante da tabela.
- Cabeçalho sempre em negrito: cada `Label` de coluna no `TableHead` leva
  `fontWeight: 700` no `sx`, junto do `margin: 0` já usado para remover o espaçamento
  padrão do `Label`:
  ```tsx
  <TableCell sx={{ borderColor: APP_COLORS.gold }}>
    <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
      Nome
    </Label>
  </TableCell>
  ```

### `<Entidade>sListItem` (linha)

- Recebe o item da entidade e os mesmos callbacks de ação repassados pelo shell.
- Renderiza uma `TableRow` com uma `TableCell` por coluna (mesma ordem/quantidade do
  `TableHead` do shell), usando `DefaultText` de `shared/components/Texts` para o
  conteúdo textual.
- Ações (editar, excluir, etc.) em `IconButton` + `Tooltip` da MUI, com `aria-label`
  descritivo em pt-BR (acessibilidade — leitor de tela precisa do rótulo já que o
  ícone sozinho não é texto).
- Hover suave para indicar a linha em evidência: a `TableRow` sempre leva um `sx` com
  transição e fundo de destaque em cima de `APP_COLORS.gold` via `alpha` (de
  `@mui/material/styles`), nunca uma cor hex direta:
  ```tsx
  import { alpha } from '@mui/material/styles';
  // ...
  <TableRow
    sx={{
      transition: 'background-color 0.2s ease',
      '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
    }}
  >
  ```

## Integração com a página

A página (`page.tsx`) é quem busca os dados (via `useGetEntityList`, ver skill
`web-integracao-api`) e mantém o estado de filtros/paginação; ela passa `data`,
`isLoading` e os handlers para o componente `List`. O componente `List`/`ListItem`
nunca chama hooks de API diretamente — eles são puramente apresentacionais, recebendo
tudo via props.
