---
name: web-listagem-dados-estaticos
description: Use sempre que um componente ou página do app-web precisar de uma variável de listagem estática (ex. NAV_SECTIONS, opções de select, itens de menu). Define onde essa variável deve ser declarada em função do seu escopo de reuso — dentro do próprio componente, na página, ou em shared/constants/PageData — em vez de deixá-la inline no arquivo do componente.
---

# Local de variáveis de listagem estática (app-web)

Sempre que um componente precisar de uma variável que seja uma **listagem estática**
(um array/objeto de opções, itens de menu, seções de navegação, etc. — não dados vindos
de API), essa variável **nunca** deve ser declarada dentro do `index.tsx` do componente
que a consome. O escopo de reuso da variável decide onde ela mora.

## 1. Usada por um único componente

Crie um diretório `data/` dentro do próprio diretório do componente, exportando a
variável (e os tipos que a acompanham) por um `index.ts`:

```
Sidebar/
  index.tsx
  data/
    index.ts   -> export const NAV_SECTIONS = [...]; export interface NavItem {...}
```

No `index.tsx`, importe com caminho relativo: `import { NAV_SECTIONS } from './data';`.

Referência real no código: `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`.

## 2. Usada por mais de um componente da mesma página

Se a mesma variável passa a ser consumida por mais de um componente dentro da mesma
página (ex. um componente de filtro e uma tabela da mesma feature), suba a variável um
nível: crie/reaproveite um diretório `data/` no diretório da própria página, não no de
um componente específico:

```
app/(authorized)/<pagina>/
  page.tsx
  components/
    <ComponenteA>/
    <ComponenteB>/
  data/
    index.ts   -> variável compartilhada pelos componentes da página
```

Componentes da página importam via caminho relativo (`../../data` ou equivalente,
seguindo a mesma convenção de import relativo já usada para `components/` dentro da
página).

## 3. Usada por mais de uma página do projeto

Se a variável passa a ser necessária em mais de uma página (não apenas mais de um
componente de uma mesma página), ela deixa de ser local e vai para
`app-web/src/shared/constants/PageData/`, seguindo a mesma convenção de barrel das
outras pastas de `shared/constants/` (`Colors`, `Styles`, `Variables`):

```
shared/constants/PageData/
  index.ts        -> barrel: export * from './<NomeDaVariavel>';
  <NomeDaVariavel>/
    index.ts       -> export const <VARIAVEL> = [...];
```

Consumo sempre via alias: `import { <VARIAVEL> } from '@/shared/constants';` (depois de
reexportado pelo barrel raiz `shared/constants/index.ts`, no mesmo padrão dos demais
módulos de `constants`).

## Regra de decisão rápida

- 1 componente consome → `data/` dentro do componente.
- >1 componente, mesma página → `data/` dentro da página.
- >1 página → `shared/constants/PageData/`.

Não generalize preventivamente: comece sempre no escopo mais restrito (`data/` do
componente) e só suba de nível quando um segundo consumidor real aparecer — não porque
"pode ser reaproveitado no futuro".
