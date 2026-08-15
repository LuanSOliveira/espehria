# Task Web: Colunas adicionais nas listagens de Armas, Armaduras e Escudos

## Contexto
Não existe `spec.md` para esta demanda — o escopo foi definido diretamente pelo
usuário. A demanda consiste em adicionar colunas às tabelas de listagem de três
entidades já existentes na seção ITENS >>> EQUIPAMENTOS (`armas`, `armaduras`,
`escudos`), alterando apenas os componentes `*List` (cabeçalho + `colSpan` da linha
de estado vazio) e `*ListItem` (célula de cada linha) de cada feature, seguindo o
padrão descrito na skill `web-tabela-listagem` (referência: `UsersList` +
`UsersListItem`). Não há alteração de formulários, `*View`, `*FilterSection` nem de
`app-api` neste plano.

**Dependência de backend (Escudos):** a implementação das colunas de Escudos depende
da conclusão de `.claude/tasks/equipamentos-colunas-listagem/task-api.md`, que
adiciona `armorClassBonus`, `hardness`, `hitPoints` e `breakThreshold` ao
`ShieldListItemResponseDto` retornado por `GET /shields`. Hoje esse endpoint só
devolve `id`, `referenceImage`, `name`, `price`, `currency` e `tags` — sem a etapa de
backend concluída, os novos campos de Escudos chegarão `undefined` do serviço mesmo
com a interface e a coluna já implementadas no frontend. Armas e Armaduras não têm
essa dependência: `WeaponListItemResponseDto` e `ArmorListItemResponseDto` já
retornam todos os campos necessários hoje.

## Etapas

### 1. web-dev
**Status:** concluído

#### Funcionalidade

**Ajuste prévio nas interfaces (`app-web/src/shared/interfaces/Entities/`)**

Ampliar as três interfaces `*ListItem`, hoje mais enxutas que o payload real da API,
usando como referência de tipagem os campos já declarados nas interfaces completas
`IWeapon`, `IArmor` e `IShield` no mesmo arquivo:

- `Weapon/index.ts` → `IWeaponListItem` recebe:
  - `damageValue?: number | null;`
  - `damageDie?: WeaponDamageDie | null;`
  - `damageType?: IDamageType | null;`
- `Armor/index.ts` → `IArmorListItem` recebe:
  - `armorCategory?: IArmorCategory | null;`
  - `armorClassBonus?: number | null;`
  - `dexterityModifierLimit?: number | null;`
- `Shield/index.ts` → `IShieldListItem` recebe:
  - `armorClassBonus?: number | null;`
  - `hardness?: number | null;`
  - `hitPoints?: number | null;`
  - `breakThreshold?: number | null;`
  - Ponto de atenção: `.claude/tasks/equipamentos-colunas-listagem/task-api.md`
    define `breakThreshold` como **não nulo** no DTO da API (`number`, sempre
    presente — calculado como `floor(hitPoints / 2)` ou `0` quando `hitPoints` está
    vazio). A interface `IShield` completa já tipa esse campo como
    `breakThreshold?: number | null` mesmo assim (inconsistência preexistente, não
    introduzida por esta tarefa); manter `IShieldListItem.breakThreshold` com o mesmo
    tipo `number | null` por consistência com `IShield`, mas tratar a formatação de
    exibição sabendo que, na prática, a API sempre envia um número quando `hitPoints`
    existe.

Nenhuma outra interface (`IWeapon`, `IArmor`, `IShield`, filtros, formulários) é
alterada.

**Utilitários de formatação — decisão de não centralizar em `shared/util`**

Diferente de `formatPriceWithCurrency` (reutilizado por praticamente todas as
entidades de item com preço/moeda), a formatação da coluna "Dano" (Armas) e da
coluna "PV(LQ)" (Escudos) é uma regra de concatenação específica de uma única
entidade cada, sem reuso previsto em outras features. Não faz sentido centralizar em
`app-web/src/shared/util` (que hoje só reúne utilitários genéricos/cross-entity:
`FormatPriceWithCurrency`, `FormatTagLabel`, `ShowToast`, etc.). Implementar essas
duas funções como helpers locais, colocados junto ao respectivo `*ListItem`:

- `formatWeaponDamage` em
  `app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx` (função
  auxiliar no próprio arquivo, fora do componente, não exportada).
- `formatShieldHitPoints` (nome sugerido) em
  `app-web/src/app/(authorized)/escudos/components/ShieldsListItem/index.tsx`, nos
  mesmos moldes.

As demais colunas novas (valores simples, sem concatenação — `armorCategory.name`,
`armorClassBonus`, `dexterityModifierLimit`, `hardness`) não precisam de helper: usar
fallback inline `?? 'Não informado'` (para relação/objeto) ou `?? '—'` (para número
solto), mesmo padrão já usado em `EventsListItem`
(`event.era?.name ?? 'Não informado'` / `event.startYear ?? '—'`).

---

**1. Armas** (`app-web/src/app/(authorized)/armas/components/WeaponsList` e
`WeaponsListItem`)

- `WeaponsList/index.tsx`: adicionar `TableCell`/`Label` "Dano" no `TableHead`, entre
  "Tags" e "Preço"; atualizar `colSpan` da linha de estado vazio de `5` para `6`.
- `WeaponsListItem/index.tsx`: adicionar `TableCell` "Dano" na mesma posição,
  renderizando `formatWeaponDamage(weapon.damageValue, weapon.damageDie,
  weapon.damageType)`.
- Regra de `formatWeaponDamage(damageValue, damageDie, damageType)` — concatenação de
  `damageValue` + `damageDie` colados (sem espaço) e, se houver `damageType`, um
  espaço seguido de `damageType.name` (ex.: `1d4 Perfurante`):
  - `damageValue` e `damageDie` presentes, `damageType` presente →
    `${damageValue}${damageDie} ${damageType.name}` (ex.: `1d4 Perfurante`).
  - `damageValue` e `damageDie` presentes, sem `damageType` → `${damageValue}${damageDie}`
    (ex.: `1d4`).
  - Apenas `damageValue` presente (sem `damageDie`) → `${damageValue}`, seguido de
    ` ${damageType.name}` se houver `damageType`.
  - Apenas `damageDie` presente (sem `damageValue`) → `${damageDie}`, seguido de
    ` ${damageType.name}` se houver `damageType`.
  - Nenhum `damageValue`/`damageDie`, mas `damageType` presente → apenas
    `damageType.name`.
  - Nenhum dos três presente → `'Não informado'`.
- Integração com API: nenhuma nova chamada — `GET /weapons` (via `useGetEntityList`
  já usado em `armas/page.tsx`) já retorna `damageValue`, `damageDie` e `damageType`
  (`WeaponListItemResponseDto`), bastando expor os campos na interface.
- Acesso Google: sem alteração — comportamento padrão já implementado em
  `WeaponsListItem` (`useIsGoogleUser` oculta Editar/Excluir, mantém Visualizar);
  esta tarefa não mexe nas ações, só em colunas de exibição.

**2. Armaduras** (`app-web/src/app/(authorized)/armaduras/components/ArmorsList` e
`ArmorsListItem`)

- `ArmorsList/index.tsx`: adicionar três `TableCell`/`Label` no `TableHead` — "Categoria",
  "Bônus de CA", "Limite Des." — entre "Tags" e "Preço", nessa ordem; atualizar
  `colSpan` da linha de estado vazio de `5` para `8`.
- `ArmorsListItem/index.tsx`: adicionar três `TableCell` na mesma posição/ordem:
  - "Categoria": `armor.armorCategory?.name ?? 'Não informado'`.
  - "Bônus de CA": `armor.armorClassBonus ?? '—'`.
  - "Limite Des.": `armor.dexterityModifierLimit ?? '—'`.
- Integração com API: nenhuma nova chamada — `GET /armors` já retorna `armorCategory`,
  `armorClassBonus` e `dexterityModifierLimit` (`ArmorListItemResponseDto`), bastando
  expor os campos na interface.
- Acesso Google: sem alteração — comportamento padrão já implementado em
  `ArmorsListItem`.

**3. Escudos** (`app-web/src/app/(authorized)/escudos/components/ShieldsList` e
`ShieldsListItem`)

- `ShieldsList/index.tsx`: adicionar três `TableCell`/`Label` no `TableHead` — "Bônus
  de CA", "Dureza", "PV(LQ)" — entre "Tags" e "Preço", nessa ordem; atualizar
  `colSpan` da linha de estado vazio de `5` para `8`.
- `ShieldsListItem/index.tsx`: adicionar três `TableCell` na mesma posição/ordem:
  - "Bônus de CA": `shield.armorClassBonus ?? '—'`.
  - "Dureza": `shield.hardness ?? '—'`.
  - "PV(LQ)": `formatShieldHitPoints(shield.hitPoints, shield.breakThreshold)`.
- Regra de `formatShieldHitPoints(hitPoints, breakThreshold)` — formato
  `pontosDeVida(limiarDeQuebra)`, ex.: `6(3)`:
  - `hitPoints` ausente (`null`/`undefined`) → `'Não informado'`, independentemente
    do valor de `breakThreshold`. Justificativa: por regra da API, `breakThreshold`
    é derivado de `hitPoints` (`floor(hitPoints / 2)`, ou `0` quando `hitPoints` está
    vazio) — sem `hitPoints`, um `breakThreshold` isolado (tipicamente `0`) não é uma
    informação útil de ser exibida sozinha e induziria a leitura errada de "0 de
    limiar de quebra" como se fosse um valor real configurado.
  - `hitPoints` presente e `breakThreshold` presente → `${hitPoints}(${breakThreshold})`
    (ex.: `6(3)`).
  - `hitPoints` presente e `breakThreshold` ausente (caso apenas defensivo para
    segurança de tipos — na prática a API sempre envia `breakThreshold` quando
    `hitPoints` existe, conforme `task-api.md`) → exibir apenas `${hitPoints}`, sem
    parênteses.
- Integração com API: **depende da etapa de backend** (`task-api.md`) para os quatro
  campos novos serem retornados por `GET /shields`
  (`ShieldListItemResponseDto`); `price`/`currency`/`tags` já funcionam hoje e não
  são afetados.
- Acesso Google: sem alteração — comportamento padrão já implementado em
  `ShieldsListItem`.

Status: concluído
Componentes: `app-web/src/app/(authorized)/armas/components/WeaponsList/index.tsx`,
`app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx`,
`app-web/src/app/(authorized)/armaduras/components/ArmorsList/index.tsx`,
`app-web/src/app/(authorized)/armaduras/components/ArmorsListItem/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldsList/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldsListItem/index.tsx`
Arquivos: `app-web/src/shared/interfaces/Entities/Weapon/index.ts`,
`app-web/src/shared/interfaces/Entities/Armor/index.ts`,
`app-web/src/shared/interfaces/Entities/Shield/index.ts`

### 2. web-dev-codereviewer
**Status:** concluído

- Revisar tudo acima, com atenção especial a:
  - `colSpan` da linha de estado vazio atualizado corretamente em cada `*List`
    (Armas: `6`; Armaduras: `8`; Escudos: `8`), correspondendo ao número real de
    colunas do `TableHead`.
  - Ordem e nomes das colunas no `TableHead` de cada `*List` batendo exatamente com a
    ordem das `TableCell` no `*ListItem` correspondente.
  - `formatWeaponDamage` e `formatShieldHitPoints` cobrindo todos os casos parciais
    descritos acima (nenhum campo, todos os campos, e cada combinação intermediária),
    sem lançar erro para `null`/`undefined`.
  - Nenhuma alteração feita em `*View`, `*FilterSection`, formulários de
    criar/editar, `shared/formSchemas/`, ou em `app-api`.
  - Nenhuma regressão nas ações Visualizar/Editar/Excluir nem no comportamento
    `useIsGoogleUser` já existente em cada `*ListItem`.
  - Confirmar que a listagem de Escudos só é validada de ponta a ponta (dados reais
    nas colunas novas) após a etapa de backend (`task-api.md`) estar concluída —
    sinalizar caso a validação seja feita antes disso e os campos apareçam vazios.

## Revisão

Verificações realizadas: a etapa "1. web-dev" está marcada como "Status: concluído";
`.claude/tasks/equipamentos-colunas-listagem/task-api.md` também está com todas as
etapas (`1. api-dev`, `2. api-dev-doc`, `3. api-dev-codereviewer`) em
"Status: concluído" e aprovado sem ressalvas, portanto `GET /shields` já retorna
`armorClassBonus`, `hardness`, `hitPoints` e `breakThreshold` — a listagem de Escudos
pode ser validada de ponta a ponta com dados reais, sem bloqueio de dependência.

Arquivos lidos e conferidos linha a linha:
`app-web/src/shared/interfaces/Entities/Weapon/index.ts`,
`app-web/src/shared/interfaces/Entities/Armor/index.ts`,
`app-web/src/shared/interfaces/Entities/Shield/index.ts`,
`app-web/src/app/(authorized)/armas/components/WeaponsList/index.tsx`,
`app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx`,
`app-web/src/app/(authorized)/armaduras/components/ArmorsList/index.tsx`,
`app-web/src/app/(authorized)/armaduras/components/ArmorsListItem/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldsList/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldsListItem/index.tsx`.

**Consistência `TableHead` × `colSpan` × `*ListItem` (foco principal da revisão):**
- Armas: `TableHead` tem 6 colunas (Imagem, Nome, Tags, Dano, Preço, Ações);
  `colSpan={6}` na linha vazia; `WeaponsListItem` renderiza as `TableCell` na mesma
  ordem. Correto.
- Armaduras: `TableHead` tem 8 colunas (Imagem, Nome, Tags, Categoria, Bônus de CA,
  Limite Des., Preço, Ações); `colSpan={8}`; `ArmorsListItem` segue a mesma ordem.
  Correto.
- Escudos: `TableHead` tem 8 colunas (Imagem, Nome, Tags, Bônus de CA, Dureza,
  PV(LQ), Preço, Ações); `colSpan={8}`; `ShieldsListItem` segue a mesma ordem.
  Correto.

**Interfaces:** `IWeaponListItem`, `IArmorListItem` e `IShieldListItem` foram
ampliadas exatamente com os campos descritos na etapa 1, com os mesmos tipos
opcionais/nuláveis de `IWeapon`/`IArmor`/`IShield`; `IShieldListItem.breakThreshold`
mantido como `number | null` (consistente com `IShield`, ponto de atenção já
documentado). Nenhuma outra interface, `*View`, `*FilterSection`, formulário de
criar/editar, `shared/formSchemas/` ou arquivo de `app-api` foi tocado nesta etapa.

**`formatShieldHitPoints`:** cobre corretamente os três casos (sem `hitPoints` →
`'Não informado'`; `hitPoints` + `breakThreshold` → `${hitPoints}(${breakThreshold})`;
`hitPoints` sem `breakThreshold` → `${hitPoints}`), usando comparação explícita com
`null`/`undefined` (não `??`/truthiness), o que evita qualquer problema com o valor
`0` em `hitPoints` ou `breakThreshold`.

**Acesso Google e ações:** `useIsGoogleUser` permanece inalterado nos três
`*ListItem`, ocultando Editar/Excluir e mantendo Visualizar — sem regressão.
Ícones seguem `react-icons/fi` (`FiEdit2`, `FiEye`, `FiTrash2`), com `aria-label`
em pt-BR nos três `IconButton`.

**Achado (severidade baixa):**
- **`app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx:28`** —
  `formatWeaponDamage` usa `[damageValue, damageDie].filter(Boolean).join('')` para
  concatenar os dois campos. `Array.prototype.filter(Boolean)` descarta qualquer valor
  falsy do array, incluindo o número `0`. Se `damageValue` for `0` (ex.: uma arma sem
  dado de valor fixo cadastrado como `0`) e `damageDie` estiver presente, o `0` seria
  silenciosamente removido do resultado (ex.: exibiria `d4` em vez de `0d4`), sem
  lançar erro, mas produzindo uma exibição incorreta. Os casos descritos na task
  (apenas `null`/`undefined`) estão todos cobertos corretamente; este é um caso de
  borda não coberto explicitamente na especificação, mas que preexiste como risco de
  dado incorreto silencioso.
  - Trecho: `const dieValue = [damageValue, damageDie].filter(Boolean).join('');`
  - Sugestão: usar checagem explícita de `null`/`undefined` por campo (nos moldes do
    que já foi feito em `formatShieldHitPoints`), por exemplo construindo `dieValue`
    com `(damageValue !== null && damageValue !== undefined ? damageValue : '') +
    (damageDie ?? '')`, para não descartar `damageValue === 0`.

Fora esse ponto, nenhum outro problema foi encontrado: colunas, ordem, `colSpan`,
tipagem, formulários (inalterados), React Query (nenhuma chamada nova), ícones,
acessibilidade e reaproveitamento de componentes estão de acordo com o padrão do
projeto e com o que foi especificado na etapa "1. web-dev".

**Correção aplicada (achado de severidade baixa acima):**
- **`app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx`** —
  `formatWeaponDamage` foi corrigido para não usar mais
  `[damageValue, damageDie].filter(Boolean).join('')`. Agora `dieValue` é construído
  com checagem explícita de `null`/`undefined` por campo, nos mesmos moldes de
  `formatShieldHitPoints`:
  ```ts
  const hasDamageValue = damageValue !== null && damageValue !== undefined;
  const hasDamageDie = damageDie !== null && damageDie !== undefined;
  const dieValue = `${hasDamageValue ? damageValue : ''}${
    hasDamageDie ? damageDie : ''
  }`;
  ```
  Isso preserva `damageValue === 0` no resultado (ex.: `0d4` em vez de `d4`) e mantém
  todos os demais casos de borda já cobertos (valor sem tipo de dano, dado sem valor,
  ausência total de dano com fallback `'Não informado'`). Nenhum outro arquivo,
  coluna, componente ou comportamento foi alterado. Achado resolvido.
