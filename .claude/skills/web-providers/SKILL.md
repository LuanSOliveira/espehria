---
name: web-providers
description: Use sempre que for necessário adicionar um provider de uma biblioteca nova (contexto React, ex. um SDK, tema, cliente de dados) no app-web. Define o padrão de criar o provider em src/providers e integrá-lo ao componente Providers central.
---

# Padrão de providers (app-web)

Referência completa no código: `app-web/src/providers/` (`react-query-provider.tsx`,
`mui-theme-provider.tsx`, `google-oauth-provider.tsx`, compostos em `providers/index.tsx`).

## 1. Um arquivo por provider

Cada biblioteca que precisa de um contexto React tem seu próprio arquivo em
`app-web/src/providers/<nome-da-lib>-provider.tsx` (kebab-case, sufixo `-provider`),
exportando um componente nomeado (`export const XxxProvider = ({ children }: ...) =>
...`) que:
- Tem `'use client'` no topo (providers com estado/contexto são sempre client
  components).
- Recebe `children: React.ReactNode` e envolve com o provider da biblioteca,
  configurando aqui qualquer opção/instância necessária (ex.: `QueryClient` do React
  Query, tema da MUI, client id do Google OAuth a partir de
  `shared/constants/EnvironmentVariables`).
- Não deve conter lógica de negócio da aplicação — apenas a configuração do provider
  em si.

## 2. Integrar ao `Providers` central

Todo provider novo precisa ser adicionado à composição em
`app-web/src/providers/index.tsx`:

```tsx
export const Providers = ({ children }: ProvidersProps) => {
  return (
    <MuiThemeProvider>
      <AppGoogleOAuthProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </AppGoogleOAuthProvider>
    </MuiThemeProvider>
  );
};
```

- Adicione o novo provider aninhado nessa árvore, na posição que fizer sentido
  dependencia-wise (ex.: se o novo provider depende de tema, ele fica dentro de
  `MuiThemeProvider`; se algo depende dele, ele fica mais externo que esse algo).
- Nunca use o provider novo diretamente no `layout.tsx` ou em uma página — sempre via
  `Providers`, que é o único ponto de composição de contexto da aplicação.
