---
name: web-utilitarios
description: Use sempre que for necessário criar uma função utilitária reaproveitável em várias partes do app-web (formatação, helpers puros, etc.). Define o padrão de local (shared/util) e estrutura — uma pasta por função, reexportada pelo barrel.
---

# Padrão de função utilitária (app-web)

Referência completa no código: `app-web/src/shared/util/` (`ShowToast`,
`CreateSearchParams`, `ShowUnicToast`, `GetAccessibleFontSize`).

> O caminho real no projeto é `shared/util` (dentro de `src/`), não um diretório
> `util` na raiz de `src/` — sempre use `app-web/src/shared/util/`.

## Quando criar um utilitário

Só crie uma função aqui quando ela for genuinamente reaproveitável em mais de um lugar
da aplicação e não depender de contexto de uma página/feature específica (sem importar
tipos de `shared/interfaces/Entities`, sem hooks de React). Se a lógica só é usada em
um único componente, mantenha-a local a esse componente — não crie um utilitário
prematuramente.

## Estrutura

Uma pasta por função, nomeada em PascalCase, dentro de `shared/util/`:

```
shared/util/
  ShowToast/
    index.ts
  CreateSearchParams/
    index.ts
```

- `index.ts` exporta a função com um nome descritivo em camelCase (`showToast`,
  `createSearchParams`), com tipos de parâmetro explícitos (uma `type`/`interface` para
  o parâmetro quando ele tiver mais de um campo, seguindo o padrão de `ShowToast`).
- Sempre reexporte a partir do barrel `shared/util/index.ts`:
  ```ts
  export * from './NomeDaFuncao';
  ```
- Funções aqui devem ser previsíveis e sem efeito colateral escondido — se a função
  precisar de configuração (ex.: opções de toast), receba isso via parâmetro, não via
  variável de módulo mutável.
- Consumo em outros arquivos sempre via alias: `import { showToast } from
  '@/shared/util';`.
