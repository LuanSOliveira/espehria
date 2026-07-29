---
name: api-permissao-google-readonly
description: Use sempre que um controller novo (ou já existente) expuser um CRUD completo (criar, visualizar, editar, excluir) no app-api. Define como restringir usuários autenticados via Google (`provider: 'google'`) a acesso somente leitura — ou bloqueado, para recursos de gerenciamento — usando o guard `GoogleAccessGuard`, a menos que a demanda explicitamente peça outro comportamento.
---

# Restrição de acesso para usuários Google (app-api)

A aplicação tem dois tipos de usuário (`User.provider`: `local` | `google`). Por padrão
de produto, usuários `google` têm acesso **somente leitura** a qualquer entidade cujo
controller exponha CRUD completo (create/list/findOne/update/remove) — e podem ser
**totalmente bloqueados** de recursos de gerenciamento sensíveis (ex.: `users`). Essa
regra já está aplicada em todos os módulos de conteúdo (`creatures`, `divinities`,
`locations`, `races`, `characters`, `organizations`, `families`, `eras`, `events`,
`tags`) e no módulo `users` (bloqueado). Aplique o mesmo padrão em qualquer controller
CRUD novo, **a menos que a task peça explicitamente outro comportamento**.

## Peças do padrão (já existem — apenas reutilize)

- `app-api/src/modules/auth/decorators/google-access.decorator.ts` — decorator
  `@GoogleAccess(level)`, `level: 'read-only' | 'blocked'`.
- `app-api/src/modules/auth/guards/google-access.guard.ts` — `GoogleAccessGuard`, lê a
  metadata do decorator via `Reflector` e compara com `request.user.provider`.

Não recrie essas peças — apenas importe-as no controller novo.

## Como aplicar em um controller novo

```ts
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';

@ApiTags('nome-plural')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('nome-plural')
export class NomeController { ... }
```

- `GoogleAccessGuard` **sempre depois** de `JwtAuthGuard` na lista de `@UseGuards` — ele
  lê `request.user`, que só existe depois que `JwtAuthGuard` autentica a requisição.
- `@GoogleAccess('read-only')`: usuários `google` só conseguem `GET`; qualquer outro
  método (`POST`/`PUT`/`DELETE`) recebe `403 Forbidden`. Use este nível para qualquer
  entidade de conteúdo com CRUD completo (o caso comum de uma demanda nova).
- `@GoogleAccess('blocked')`: usuários `google` recebem `403 Forbidden` em **qualquer**
  método, incluindo `GET`. Use este nível apenas para recursos de gerenciamento restrito
  (ex.: administração de usuários) — não é o padrão para entidades de conteúdo.
- Usuários `provider: 'local'` nunca são afetados pelo guard.
- Se a task pedir explicitamente que usuários Google tenham outro nível de acesso (ex.:
  acesso total, ou uma entidade que Google não deve nem visualizar), siga o que foi
  pedido em vez deste padrão — ele é o comportamento **default**, não uma regra rígida.

## Contexto de implementação (não recrie isso)

- O JWT já carrega `provider` no payload (`JwtPayload.provider`, assinado em
  `AuthService.buildAuthResult`) — é isso que popula `request.user.provider` via
  `JwtStrategy`. Não é necessário nenhum ajuste adicional para o guard funcionar.
- Ver também a skill `web-permissao-google-readonly` — a mesma restrição precisa ser
  espelhada na UI (ocultar ações de criar/editar/excluir e itens de navegação), já que o
  guard de backend impede a ação mas não esconde os botões sozinho.
