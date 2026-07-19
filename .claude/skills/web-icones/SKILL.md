---
name: web-icones
description: Use sempre que for necessário usar um ícone em qualquer componente ou página do app-web. Garante que todo ícone venha da biblioteca react-icons (subconjunto Feather, react-icons/fi, já padronizado no projeto) — nunca outra lib de ícones, SVG customizado ou emoji como ícone funcional.
---

# Padrão de ícones (app-web)

Referência no código: `react-icons/fi` usado em `Sidebar`, `usuarios/page.tsx`,
`UsersListItem`, `UserCreateForm`, `FormModal` (`FiHome`, `FiUsers`, `FiEdit2`,
`FiTrash2`, `FiSearch`, `FiUser`, `FiMail`, `FiLock`, `FiX`).

## Regra única: todo ícone vem de `react-icons`

Nunca introduza outra biblioteca de ícones (`@mui/icons-material`, `lucide-react`,
`heroicons`, etc.), SVG inline customizado, ou emoji usado como ícone funcional
(botão, indicador de ação, item de navegação). `react-icons` já é dependência do
projeto e é a única fonte de ícones.

## Use o subconjunto Feather (`react-icons/fi`) por padrão

Todo ícone hoje na aplicação vem de `react-icons/fi`. Ao precisar de um ícone novo:
1. Procure primeiro em `react-icons/fi` (ícones prefixados `Fi`) — mantenha a
   consistência visual do set já em uso.
2. Só recorra a outro subconjunto de `react-icons` (ex.: `react-icons/md`,
   `react-icons/hi2`) se o ícone necessário genuinamente não existir em Feather — isso
   deve ser exceção, não regra, e ainda assim precisa ser `react-icons`.

```tsx
import { FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
```

## Tipagem quando o ícone é dinâmico/recebido via prop

Quando um componente aceita "qual ícone renderizar" como prop (ex.: item de menu,
input com ícone opcional), tipe como `IconType` de `'react-icons'`:

```ts
import { IconType } from 'react-icons';

interface NavItem {
  icon: IconType;
}
```

## Tamanho e cor: sempre via CSS/props, nunca editando o ícone

Ícones do `react-icons` são componentes SVG que herdam `color` e `font-size` do
contexto — nunca hardcode tamanho/cor dentro do próprio ícone:
- Cor: `className`/Tailwind (`className="text-gold-soft"`) ou `sx={{ color:
  APP_COLORS.textBrownDark }}` quando dentro de um componente MUI (`IconButton`, etc.)
  — seguindo a skill `web-cores` para de onde a cor deve vir.
- Tamanho: `style={{ fontSize: ... }}` ou `sx={{ fontSize: ... }}`. Quando o ícone
  está dentro de um elemento interativo cujo tamanho de fonte já é acessível (botão,
  input), reaproveite `useAccessibleFontSize` com a constante `.icon` do arquivo de
  estilos correspondente (`APP_BUTTON_BASE_FONT_SIZE.icon`, `APP_INPUT_BASE_FONT_SIZE.icon`)
  em vez de um valor fixo solto.

## Acessibilidade

Ícone sozinho dentro de um elemento clicável (`IconButton` sem texto visível ao lado)
sempre precisa de `aria-label` em pt-BR descrevendo a ação, e — seguindo o padrão já
usado em tabelas (`UsersListItem`) — de um `Tooltip` da MUI com o mesmo texto, para que
a ação fique clara tanto para leitor de tela quanto visualmente ao passar o mouse.
