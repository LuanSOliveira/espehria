---
name: web-nova-pagina
description: Use sempre que for necessário criar uma página nova no app-web. Define o padrão de local do arquivo de rota (App Router), a obrigatoriedade de registrar o caminho em shared/routes.ts, e quando adicionar um item de navegação na Sidebar.
---

# Padrão de criação de página nova (app-web)

## 1. Onde criar o arquivo de rota

App Router com dois grupos de rota em `app-web/src/app/`:
- `(public)/` — páginas sem autenticação (ex.: login).
- `(authorized)/` — páginas atrás de login, renderizadas dentro do `AuthorizedShell`
  (`Sidebar` + `Header`).

Crie `app/(<grupo>)/<slug-da-pagina>/page.tsx`. Componentes específicos dessa página
vão em `app/(<grupo>)/<slug-da-pagina>/components/` (ver skill `web-componentes`).

## 2. Sempre registrar a rota em `shared/routes.ts` — nunca hardcode o caminho

`shared/routes.ts` centraliza todos os caminhos da aplicação:

```ts
const MENU_ROUTES = {
  login: '/',
  home: '/home',
  users: '/usuarios',
  // adicione a nova rota aqui
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
    users: MENU_ROUTES.users,
    // e aqui, em private ou public conforme o grupo
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
```

- Adicione a chave em `MENU_ROUTES` com o path literal, e replique em
  `APP_ROUTES.private` ou `APP_ROUTES.public` conforme o grupo de rota escolhido no
  passo 1.
- Em todo o resto do código (links, redirects, `useRouter().push`, itens de menu),
  sempre importe e use `APP_ROUTES.private.<nome>`/`APP_ROUTES.public.<nome>` — nunca
  escreva a string do caminho diretamente. Isso também é o que o middleware
  (`src/proxy.ts`) usa para decidir quais rotas exigem token válido.

## 3. Adicionar à navegação (Sidebar), quando a página for acessível pelo menu

Se a página nova deve aparecer no menu lateral, edite `NAV_SECTIONS` em
`app/(authorized)/components/Sidebar/index.tsx`:

```ts
const NAV_SECTIONS: NavSection[] = [
  { items: [{ label: 'Home', href: APP_ROUTES.private.home, icon: FiHome }] },
  {
    title: 'Gerenciamento',
    items: [
      { label: 'Usuários', href: APP_ROUTES.private.users, icon: FiUsers },
      // adicione o novo item aqui, ou crie uma nova seção com `title`
    ],
  },
];
```

- `href` sempre a partir de `APP_ROUTES`, nunca string literal.
- `icon` de `react-icons/fi` (mesma biblioteca dos ícones já usados).
- Use uma seção existente se a página pertencer ao mesmo agrupamento temático, ou crie
  uma nova seção (`{ title: '...', items: [...] }`) caso contrário.
- Páginas que não devem aparecer no menu (ex.: uma subpágina de detalhe) não precisam
  de entrada na Sidebar — apenas o registro em `routes.ts` do passo 2 é obrigatório.
