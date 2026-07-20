---
name: web-secao-filtros
description: Use sempre que uma página com listagem de itens (usuários, criaturas, etc.) precisar de campos de filtro/busca no app-web. Define o padrão já estabelecido de extrair os inputs de filtro para um componente `<Entidade>sFilterSection` específico da página, em vez de deixar o formulário de filtro inline em `page.tsx`.
---

# Padrão de seção de filtros de listagem (app-web)

Referência completa no código: `app-web/src/app/(authorized)/usuarios/components/UsersFilterSection/`
e `app-web/src/app/(authorized)/criaturas/components/CreaturesFilterSection/`, consumidos
por `usuarios/page.tsx` e `criaturas/page.tsx` respectivamente.

## Por que não é um componente genérico

Assim como a tabela de listagem (skill `web-tabela-listagem`), a seção de filtros conhece
os campos específicos da entidade filtrada (nome, e-mail, categoria, etc.) — por isso ela
nunca vai em `shared/components/`, mesmo repetindo a estrutura visual (form + inputs +
botão "Filtrar") entre features. Ela é sempre criada dentro de `components/` da página que
a usa.

## Estrutura

```
app/(authorized)/<pagina>/components/
  <Entidade>sFilterSection/
    index.tsx        # form com os inputs de filtro e o botão de submit
```

### `<Entidade>sFilterSection`

- É um componente puramente apresentacional: **não** possui estado próprio de input nem
  chama hooks de API. Todo valor de filtro e seus setters vêm via props do `page.tsx`,
  assim como o `List`/`ListItem` da skill `web-tabela-listagem` recebem tudo via props.
- Props seguem o padrão `<campo>Value` / `on<Campo>Change` para cada filtro, mais
  `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void` para o submit do form.
  Quando o filtro depende de dados carregados (ex.: opções de um `DefaultAutocompleteInput`),
  esses dados também entram como prop (ex.: `categories: ICreatureCategory[]`).
- Monta um `<form onSubmit={onSubmit}>` com os inputs de `shared/components/Inputs`
  (`DefaultTextInput`, `DefaultAutocompleteInput`, etc. — nunca inputs MUI nus) e um
  `PrimaryButton type="submit"` com o texto "Filtrar".
- Reaproveita exatamente as mesmas classes Tailwind de layout que a página já usava
  (`flex`, `items-end`, `gap-3`, `max-w-*`) — mover o form para o componente não deve
  alterar o visual.

## Integração com a página

A página (`page.tsx`) continua sendo dona do estado dos inputs de filtro (via `useState`,
um `useState` por campo) e do `filters` usado em `useGetEntityList` (ver skill
`web-integracao-api`), exatamente como antes. A função `handleSearch` que monta o objeto de
filtros a partir dos valores de input também permanece em `page.tsx`. A única mudança é que
o JSX do `<form>` deixa de estar inline em `page.tsx` e passa a ser renderizado pelo
componente `<Entidade>sFilterSection`, recebendo o estado e os handlers como props.

Isso mantém o mesmo modelo de separação já usado pela tabela de listagem: `page.tsx`
concentra estado e busca de dados; os componentes específicos de página
(`FilterSection`, `List`/`ListItem`) são apresentacionais.

## Quando aplicar

Sempre que uma página nova (ou existente) tiver uma listagem paginada com campos de busca/
filtro, extraia esses campos para um `<Entidade>sFilterSection` desde o início — não deixe
o formulário de filtro inline em `page.tsx`, mesmo que tenha um único campo.
