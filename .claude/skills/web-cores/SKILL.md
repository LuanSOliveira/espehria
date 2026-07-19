---
name: web-cores
description: Use sempre que for necessário adicionar uma nova cor ao design system do app-web. Define os dois lugares que precisam ser atualizados juntos — globals.css (variável CSS + registro no Tailwind) e shared/constants/Colors (APP_COLORS) — para que a cor fique disponível tanto em classes Tailwind quanto em sx/MUI.
---

# Padrão de adição de cor (app-web)

Referência completa no código: `app-web/src/app/globals.css` e
`app-web/src/shared/constants/Colors/index.ts`.

## Por que dois lugares

O projeto usa cor em dois mecanismos diferentes que não compartilham fonte
automaticamente:
1. **Tailwind** (classes utilitárias como `border-gold`, `text-gold-dark`) — vem de
   variáveis CSS registradas em `globals.css`.
2. **MUI / `sx`** (estilos de componente, `APP_BUTTON_STYLES`, etc.) — vem do objeto
   `APP_COLORS` em TypeScript.

Uma cor nova só está "completa" quando existe nos dois lugares com o mesmo valor.
Nunca adicione só em um dos dois.

## 1. `app/globals.css`

Adicione a variável em `:root` (nome em kebab-case) **e** registre-a no bloco
`@theme inline` para virar utilitário Tailwind:

```css
:root {
  /* ... */
  --minha-cor: #123456;
}

@theme inline {
  /* ... */
  --color-minha-cor: var(--minha-cor);
}
```

Isso disponibiliza `bg-minha-cor`, `text-minha-cor`, `border-minha-cor`, etc. Se a cor
precisar de um valor diferente no dark mode, adicione também dentro do bloco
`@media (prefers-color-scheme: dark) { :root { ... } }`.

## 2. `shared/constants/Colors/index.ts`

Adicione a mesma cor, mesmo valor hexadecimal, como uma chave nova em `APP_COLORS`
(camelCase):

```ts
export const APP_COLORS = {
  // ...
  minhaCor: '#123456',
} as const;
```

## Nomenclatura consistente entre os dois

`--minha-cor` (CSS/Tailwind) ↔ `minhaCor` (APP_COLORS) — sempre o mesmo nome, só a
convenção de case muda entre os dois arquivos (kebab-case no CSS, camelCase no
TypeScript). Isso evita que alguém precise adivinhar o nome equivalente do outro lado.

## Onde usar cada um

- Dentro de JSX com `className` (Tailwind): use a variante Tailwind
  (`className="border-gold"`).
- Dentro de `sx` de componente MUI, ou em arquivos de `constants/Styles/*`: use
  `APP_COLORS.<nome>` — nunca um hex literal solto no meio do componente ou do arquivo
  de estilo.
