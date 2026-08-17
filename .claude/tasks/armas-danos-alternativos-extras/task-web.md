# Task Web: Danos alternativos e extras de Armas

## Contexto
Não existe `.claude/tasks/armas-danos-alternativos-extras/spec.md` para esta demanda.
O requisito completo está descrito no pedido original (ver histórico da conversa) e
resumido abaixo.

A demanda: no formulário de criação/edição de Armas (`WeaponCreateForm`) e no modal de
visualização (`WeaponView`), adicionar duas listas independentes e repetíveis de
sub-itens de dano — "Dano Alternativo" e "Dano Extra" — cada uma reaproveitando
exatamente os mesmos 7 campos hoje usados na seção "Dano" fixa da arma: Valor, Dado,
Tipo de Dano, Dano Mágico, Distância (Metros), Ações de Recarga e Usa Munição.

Contrato de API (planejado em paralelo em
`.claude/tasks/armas-danos-alternativos-extras/task-api.md` — consultar esse arquivo, e
os DTOs reais em `app-api/src/modules/weapons/dto/` quando existirem, antes de
implementar):
- Response (`GET /weapons/:id`): campos `alternativeDamages` e `extraDamages`, arrays
  de itens com `id`, `damageValue`, `damageDie`, `damageType` (objeto), `magicalDamage`,
  `distanceMeters`, `usesAmmunition`, `reloadActions`.
- Payload (`POST`/`PUT /weapons`): `alternativeDamages` e `extraDamages` como arrays de
  itens com `damageValue`, `damageDie`, `damageTypeId`, `magicalDamage`,
  `distanceMeters`, `usesAmmunition`, `reloadActions` (substituição integral da lista a
  cada update — sem `id` no payload de escrita, análogo a `traitIds`/`tagIds` em outras
  features de arma).

**Ponto a confirmar antes de codar (não decidido aqui):** o payload de escrita de cada
item da lista, conforme descrito na demanda, não inclui um `id` de item existente —
ou seja, cada update parece substituir a lista inteira sem preservar identidade de item
individual. Confirmar isso lendo `task-api.md` e os DTOs reais do backend antes de
implementar `buildPayload`, pois se a API mudar esse contrato (ex.: exigir `id` opcional
por item) o mapeamento do formulário precisa ser ajustado.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx (novo)
Arquivos: app-web/src/shared/formSchemas/WeaponFormSchema/index.ts (weaponDamageItemSchema, weaponDamageItemDefaultValues, campos alternativeDamages/extraDamages no weaponFormSchema e weaponFormDefaultValues), app-web/src/shared/interfaces/Entities/Weapon/index.ts (IWeaponDamage, campos alternativeDamages/extraDamages em IWeapon), app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx (renderiza as duas instâncias de WeaponDamagesField, reset e buildPayload mapeando os dois arrays, WeaponPayload/WeaponDamagePayload atualizados), app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx (duas novas caixas de seção "Dano Alternativo" e "Dano Extra" após a caixa "Dano")

#### Componentes (se necessário)
- Componente: `WeaponDamagesField`
  - Local sugerido: `app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx`
    (mesmo padrão de pasta de `WeaponTraitsField`, específico da feature de armas —
    não é um componente genérico de `shared/components/`, pois é acoplado ao
    `WeaponFormData` e às opções de dado/tipo de dano da arma).
  - Props:
    - `control: Control<WeaponFormData>`
    - `name: 'alternativeDamages' | 'extraDamages'` (nome do array no form, tipado
      conforme os dois campos que serão adicionados ao `weaponFormSchema`)
    - `title: string` (rótulo da seção, ex.: "Dano Alternativo" / "Dano Extra")
    - `addButtonLabel: string` (texto do botão, ex.: "Adicionar Dano Alternativo" /
      "Adicionar Dano Extra")
    - `damageTypeOptions: IDamageType[]` (repassado de `useDamageTypesQuery`, já
      carregado uma vez no `WeaponCreateForm` e passado para as duas instâncias do
      componente, evitando duplicar a query)
  - Comportamento esperado:
    - Usa `useFieldArray` do `react-hook-form` sobre `name`, seguindo exatamente o
      padrão de `LocationSectionsField` (`app-web/src/app/(authorized)/locais/components/LocationSectionsField/index.tsx`):
      `SecondaryButton type="button"` para adicionar um item novo ao final da lista, e
      um `IconButton` com ícone `FiTrash2` dentro de `Tooltip` ("Remover item") para
      remover cada item.
    - Cada item renderizado exibe, dentro de um grid (`grid grid-cols-1 sm:grid-cols-2
      lg:grid-cols-4`, igual ao grid da seção "Dano" atual), os campos: `FormTextInput`
      "Valor" (`damageValue`, number, `min:0 step:1 inputMode:numeric`),
      `FormAutocompleteInput` "Dado" (`damageDie`, opções `WEAPON_DAMAGE_DIE_OPTIONS`),
      `FormAutocompleteInput` "Tipo de dano" (`damageTypeId`, opções
      `damageTypeOptions`), `FormCheckboxInput` "Dano mágico" (`magicalDamage`) — e,
      abaixo (ou no mesmo grid, replicando o layout atual de "Dano" +
      distância/recarga/munição), `FormTextInput` "Distância (Metros)"
      (`distanceMeters`, number, `min:0 step:0.1 inputMode:decimal`), `FormTextInput`
      "Ações de Recarga" (`reloadActions`, number, `min:0 step:1 inputMode:numeric`) e
      `FormCheckboxInput` "Usa Munição?" (`usesAmmunition`).
    - Cada campo é registrado com `name={`${name}.${index}.<campo>`}` (padrão
      `react-hook-form` de array aninhado), usando `field.id` do `useFieldArray` como
      `key` do item, e ids de input únicos por índice/lista (ex.:
      `weapon-form-${name}-${index}-damage-value`) para evitar colisão entre as duas
      instâncias (Alternativo/Extra) e com a seção "Dano" fixa.
    - Botão de adicionar cria um item com os `defaultValues` do item novo (ver schema
      abaixo), sempre ao final da lista; se a lista estiver vazia, nenhum grid de item é
      renderizado (só o botão), seguindo o padrão de `LocationSectionsField`.
  - Este componente precisa existir antes de o `WeaponCreateForm` consumi-lo (duas
    instâncias, uma para `alternativeDamages` e outra para `extraDamages`).

- Extensão de `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`:
  - Adicionar um schema de item reutilizável (`weaponDamageItemSchema`) com os mesmos 7
    campos e as mesmas regras de validação hoje aplicadas aos campos de dano da arma
    (todos como `string`, com `refine` de inteiro para `damageValue`/`reloadActions`,
    `refine` de decimal com no máximo 1 casa para `distanceMeters`, `damageDie` e
    `damageTypeId` como `string` livre — sem `min(1)` obrigatório, mesma tolerância a
    vazio dos campos de "Dano" atuais — e `magicalDamage`/`usesAmmunition` como
    `boolean`).
  - Adicionar `alternativeDamages: z.array(weaponDamageItemSchema)` e
    `extraDamages: z.array(weaponDamageItemSchema)` ao `weaponFormSchema`.
  - Adicionar `alternativeDamages: []` e `extraDamages: []` ao
    `weaponFormDefaultValues`.
  - Definir (no próprio `WeaponDamagesField` ou exportado do schema) o objeto de
    valores default de um item novo (todos os 7 campos com string vazia / `false`) para
    uso no `append` do `useFieldArray`.

#### Funcionalidade
- Páginas/rotas: nenhuma rota nova. Alterações restritas a
  `app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx` e
  `app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx`, que já são
  usados nas telas existentes de listagem/criação/edição/visualização de Armas
  (nenhuma rota/página nova é necessária).
- Integrações com API:
  - `GET /weapons/:id` (via `useGetEntityById<IWeapon>`, já usado tanto no
    `WeaponCreateForm` em modo edição quanto no `WeaponView`) passa a retornar também
    `alternativeDamages` e `extraDamages` — os hooks de query já existentes não mudam,
    apenas o tipo `IWeapon` precisa refletir os novos campos.
  - `POST /weapons` e `PUT /weapons/:id` (via `usePostEntity`/`usePutEntity`, já usados
    no `WeaponCreateForm`) passam a enviar `alternativeDamages` e `extraDamages` no
    payload.
  - Confirmar nomes exatos de campos e formato de payload lendo
    `.claude/tasks/armas-danos-alternativos-extras/task-api.md` e, se já implementados,
    os DTOs reais em `app-api/src/modules/weapons/dto/` antes de codar `buildPayload` e
    o `reset(...)` de edição.
- Alterações de interface (`app-web/src/shared/interfaces/Entities/Weapon/index.ts`):
  - Criar `IWeaponDamage` (ou nome equivalente) com `id`, `damageValue?: number | null`,
    `damageDie?: WeaponDamageDie | null`, `damageType?: IDamageType | null`,
    `magicalDamage: boolean`, `distanceMeters?: number | null`,
    `usesAmmunition: boolean`, `reloadActions?: number | null` — espelhando os campos
    de dano já existentes em `IWeapon`, para reaproveitamento de tipo.
  - Adicionar `alternativeDamages: IWeaponDamage[]` e `extraDamages: IWeaponDamage[]` a
    `IWeapon`. (`IWeaponListItem`, usado na listagem, não precisa desses campos — a
    demanda cobre apenas formulário e view de detalhe.)
- Alterações em `WeaponCreateForm`:
  - Renderizar `<WeaponDamagesField name="alternativeDamages" title="Dano
    Alternativo" addButtonLabel="Adicionar Dano Alternativo" .../>` imediatamente após
    o bloco atual da seção "Dano" (linhas ~391-438) e antes do grid de
    distância/recarga/munição (linhas ~440-467) — ou seja, entre a seção "Dano" (valor,
    dado, tipo, dano mágico) e seus campos complementares atuais. **Ponto a
    confirmar:** a demanda diz "logo abaixo da seção Dano existente"; como a seção
    "Dano" hoje está fisicamente dividida em dois blocos JSX consecutivos (grid de
    valor/dado/tipo/mágico nas linhas ~391-438, e grid de
    distância/recarga/munição nas linhas ~440-467) que juntos compõem visualmente
    "Dano", a leitura mais fiel à demanda é posicionar "Dano Alternativo" após o
    segundo bloco (linha ~467) — cada seção nova já inclui os 7 campos completos
    (valor, dado, tipo, mágico, distância, recarga, munição) dentro de si. Seguir essa
    interpretação salvo indicação em contrário.
  - Renderizar `<WeaponDamagesField name="extraDamages" title="Dano Extra"
    addButtonLabel="Adicionar Dano Extra" .../>` logo abaixo do `WeaponDamagesField` de
    "Dano Alternativo".
  - No `reset(...)` do modo edição (dentro do `useEffect` que popula o formulário a
    partir de `weaponDetail`), mapear `weaponDetail.alternativeDamages` e
    `weaponDetail.extraDamages` para arrays de itens de formulário, convertendo cada
    número para `string` (ou `''` quando `null`/`undefined`) e `damageType.id` para
    `damageTypeId`, no mesmo padrão já usado para os campos de dano fixos
    (`damageValue`, `damageDie`, `damageTypeId`, `distanceMeters`, `reloadActions`).
  - No `buildPayload`, converter cada item de `alternativeDamages`/`extraDamages` de
    volta para o formato de payload (números via `Number(...)` ou `null`/`undefined`
    quando vazio, `damageTypeId` em vez de `damageType`), no mesmo padrão hoje aplicado
    aos campos de dano fixos da arma. Atualizar a interface `WeaponPayload` local para
    refletir os novos campos convertidos.
- Alterações em `WeaponView`:
  - Adicionar duas novas caixas de seção logo após a caixa "Dano" existente (linhas
    ~366-405), seguindo o mesmo visual (`APP_CONTAINER_STYLES.detailSectionBox` /
    `detailSectionBoxHeader`, ícone `FiZap`, `Label`/`DefaultText`, `NOT_INFORMED` para
    valores ausentes): uma para "Dano Alternativo" (`weapon.alternativeDamages`) e outra
    para "Dano Extra" (`weapon.extraDamages`).
  - Cada seção deve tratar lista vazia com o mesmo texto usado em "Traços"
    ("Nenhum item adicionado.") e, quando houver itens, renderizar cada um em um bloco
    com os 7 campos (Valor, Dado — resolvendo o label via `WEAPON_DAMAGE_DIE_OPTIONS`,
    Tipo de dano, Dano Mágico, Distância (Metros), Ações de Recarga, Usa Munição),
    reaproveitando o mesmo grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) usado na
    caixa "Dano" atual, um grid por item da lista.
- Formulário/validação: ver detalhamento de schema na subseção "Componentes" acima —
  os dois arrays reaproveitam integralmente as regras de validação já usadas nos campos
  de "Dano" fixos da arma (nenhuma regra nova é introduzida; não há mínimo de itens
  obrigatório em nenhuma das duas listas).
- Acesso Google: não aplicável diretamente — estas seções fazem parte do formulário de
  criação/edição e do modal de visualização de Armas, cujo controle de acesso
  (ocultar botões de criar/editar/excluir para `provider: 'google'`, conforme skill
  `web-permissao-google-readonly`) já é resolvido no nível da tela de listagem/ações de
  Armas (fora do escopo desta demanda) e no `WeaponView` (que já usa `useIsGoogleUser`
  para ocultar a seção "Informações Privadas", padrão que não muda aqui). Nenhum ajuste
  adicional de acesso Google é necessário além do que já existe.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Etapa "1. web-dev" está marcada como concluída; revisão realizada sobre os arquivos
listados no campo "Componentes"/"Arquivos" dessa etapa, comparando-os contra
`CLAUDE.md`, o padrão de referência `LocationSectionsField`
(`app-web/src/app/(authorized)/locais/components/LocationSectionsField/index.tsx`) e
os DTOs reais do backend em `app-api/src/modules/weapons/dto/`
(`create-weapon.dto.ts`, `update-weapon.dto.ts`, `weapon-damage-input.dto.ts`,
`weapon-damage-response.dto.ts`, `weapon-response.dto.ts`).

Pontos verificados e sem problemas:
- **Reuso de UI / padrão de lista repetível**: `WeaponDamagesField`
  (`app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx`) segue
  fielmente o padrão de `LocationSectionsField` — `useFieldArray`, `SecondaryButton
  type="button"` para adicionar, `IconButton`+`Tooltip`+`FiTrash2` (ícone de
  `react-icons`, não MUI) para remover, `field.id` como `key`, grid vazio quando não há
  itens. Reaproveita `FormTextInput`/`FormAutocompleteInput`/`FormCheckboxInput` de
  `shared/components/Inputs` em vez de recriar inputs.
- **Schema zod novo** (`weaponDamageItemSchema` em
  `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`): réplica exata das
  regras já usadas nos campos de dano fixos do `weaponFormSchema` (mesmos `refine` de
  inteiro para `damageValue`/`reloadActions`, mesmo `refine` de decimal com 1 casa para
  `distanceMeters`, `damageDie`/`damageTypeId` como `string` livre sem `min(1)`,
  `magicalDamage`/`usesAmmunition` como `boolean`). Nenhuma regra nova introduzida, sem
  mínimo de itens obrigatório — conforme especificado.
- **Mapeamento `reset(...)` (edição)** em `WeaponCreateForm/index.tsx`: converte
  corretamente `alternativeDamages`/`extraDamages` de `weaponDetail` (números/objeto
  `damageType`) para o formato de formulário (strings vazias em `null`/`undefined`,
  `damageType.id` → `damageTypeId`), no mesmo padrão dos campos de dano fixos.
- **Mapeamento `buildPayload`/`buildDamagePayload`**: converte strings de volta para
  `number`/`null`/`undefined` (`Number(...)` quando preenchido, `null` quando vazio
  para campos numéricos, `undefined` quando vazio para `damageDie`/`damageTypeId`).
  Nomes de campos (`damageValue`, `damageDie`, `damageTypeId`, `magicalDamage`,
  `distanceMeters`, `usesAmmunition`, `reloadActions`) e opcionalidade batem
  exatamente com `WeaponDamageInputDto` (`app-api/.../dto/weapon-damage-input.dto.ts`).
  Envio de `[]` quando a lista fica vazia é compatível com o comportamento do backend
  em `weapons.service.ts` (`dto.alternativeDamages !== undefined` → substitui a lista
  inteira), confirmando a decisão registrada na task de que o payload de escrita não
  precisa de `id` por item (substituição integral, análogo a `traitIds`/`tagIds`).
- **`IWeaponDamage`/`IWeapon`** (`app-web/src/shared/interfaces/Entities/Weapon/index.ts`):
  campos e tipos (`damageType` como objeto, `alternativeDamages`/`extraDamages` sempre
  arrays, nunca opcionais) batem com `WeaponDamageResponseDto`/`WeaponResponseDto`.
  `IWeaponListItem` corretamente não recebeu os novos campos, pois
  `weapon-list-item-response.dto.ts` também não os expõe.
- **`WeaponView`**: duas novas caixas de seção "Dano Alternativo"/"Dano Extra" seguem
  exatamente o visual de `detailSectionBox`/`detailSectionBoxHeader`, ícone `FiZap`
  (`react-icons`), texto "Nenhum item adicionado." para lista vazia (igual a
  "Traços"), resolução do label de `damageDie` via `WEAPON_DAMAGE_DIE_OPTIONS`, textos
  em pt-BR, `NOT_INFORMED` para valores ausentes.
- **IDs e `aria-label`s únicos**: os `id`s dos campos usam
  `weapon-form-${name}-${index}-<campo>` (`name` é `alternativeDamages`/`extraDamages`),
  não colidindo entre si nem com os `id`s fixos da seção "Dano" (`weapon-form-damage-*`).
  O `aria-label` do botão de remover (`Remover item ${index + 1} de ${title}`) também é
  único entre as duas listas, em pt-BR.
- **React Query**: `usePostEntity`/`usePutEntity` com `invalidateQueryKeys: [['/weapons']]`
  inalterados e corretos; nenhuma query/mutation bespoke introduzida para as novas
  listas (não há chamada de API própria em `WeaponDamagesField`, é puramente
  apresentacional sobre `control`).
- **Acesso Google**: nenhuma ação de criar/editar/excluir foi adicionada dentro das
  novas seções do `WeaponView` (apenas leitura), then o controle existente via
  `useIsGoogleUser` (usado só para "Informações Privadas") permanece correto, sem
  necessidade de ajuste, conforme já indicado na task.

Nenhum problema encontrado. Aprovado.

Arquivos revisados:
- `app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx`
- `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`
- `app-web/src/shared/interfaces/Entities/Weapon/index.ts`
- `app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx`
- `app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx`
