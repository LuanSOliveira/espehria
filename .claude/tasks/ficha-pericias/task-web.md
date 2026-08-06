# Task Web: Perícias na ficha + reorganização de abas

## Contexto
Não existe `spec.md` para esta demanda — as regras foram fechadas diretamente com o
usuário (ver mensagem de planejamento) e são normativas. O contrato de dados usado
abaixo vem de `.claude/tasks/ficha-pericias/task-api.md`, seção "Contrato de API
(fonte de verdade para o planejamento web)":

- `GET /proficiency-gradations`: array de `{ id, name, level, bonus }` (campo `bonus`
  é novo). `level` é só magnitude de comparação; `bonus` é o valor a somar no cálculo
  de perícia.
- Todas as perícias: `GET /skills?page=1&perPage=100`, resposta paginada padrão
  (`PaginatedSkillsResponseDto`), `data: SkillListItemResponseDto[]` com
  `{ id, name, keyAttribute: { id, name }, tags }`.
- Nenhum outro endpoint muda. O cálculo do modificador de perícia é 100% client-side.

Investigação de código já feita (não reabrir):
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — página principal da ficha,
  hospeda as abas, os estados hidratados do snapshot (`melhorias`, `defeitos`,
  `proficiencias`, `proficienciasAjustadas`, `saberes`) e o array `attributes`
  (`{ id, label, value, modifier }`, calculado por volta da linha 206).
- `.../fichas/[id]/components/SheetAttributesPanel` e `SheetAttributeCard` —
  padrão visual de quadro com header (`APP_CONTAINER_STYLES.detailSectionBox` /
  `detailSectionBoxHeader`) e do círculo de modificador com sinal (`+2`/`-1`),
  posicionado em `absolute right/bottom` sobre fundo `APP_COLORS.wood` com borda
  `APP_COLORS.gold` e texto `APP_COLORS.goldSoft`.
- `.../fichas/[id]/components/SheetKnowledgesPanel` — quadro simples com grid de 3
  colunas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), já posicionado logo abaixo de
  `SheetAttributesPanel` na aba Estatísticas (demanda anterior).
- `.../fichas/[id]/components/SheetProficienciesGrid` e
  `SheetAdjustedProficienciesSection` — conteúdo atual da aba Proficiências (grid 3
  colunas de `ProficiencyCard` + seção de ajustes pendentes), não muda de conteúdo,
  só de aba/navegação.
- `.../fichas/[id]/components/SheetAttributesDetailModal` — padrão do projeto para
  "botão que abre modal de detalhamento" (`ViewModal` + estado boolean/`selected*` no
  componente pai), usado aqui como referência para o botão "verificar bônus".
- `.../fichas/[id]/hooks/useFieldAutosave` — mostra que a página já tem uma pasta
  `hooks/` própria para lógica não visual; a lógica de cálculo de perícia deve seguir
  o mesmo padrão (hook dedicado, não inline gigante em `page.tsx`).
- `shared/interfaces/Entities/ProficiencyGradation/index.ts` — `IProficiencyGradation`
  hoje só tem `{ id, name, level }`, **falta o campo `bonus`** (precisa ser adicionado).
- `hooks/Queries/EntityQueries/useProficiencyGradationsQuery` — já existe, busca e
  ordena por `level` ASC; não precisa de nenhuma mudança de lógica, só passa a expor
  `bonus` assim que a interface for atualizada.
- `shared/interfaces/Entities/Skill/index.ts` — `ISkillListItem` já é exatamente
  `{ id, name, keyAttribute }`, compatível com o contrato; **não precisa mudar**.
- `app/(authorized)/pericias/page.tsx` — já usa
  `useGetEntityList<ISkillListItem, ISkillListFilters>({ url: '/skills', filters })`;
  reaproveitar o mesmo hook genérico, só trocando os filtros para
  `{ page: 1, perPage: 100 }`.
- `shared/interfaces/Entities/Sheet/index.ts` — confirma os formatos usados no
  cálculo: `ISheetProficiencySnapshotEntry { id, property, gradation, sourceName }` e
  `ISheetProficiencyAdjustmentEntry { id, sourceType, sourceName, originalProperty,
  originalGradation, adjustedProperty }`. **Não existe campo `adjustedGradation`** —
  a entrada ajustada só troca a propriedade beneficiada, a graduação continua sendo
  `originalGradation`.
- Não existe nenhum uso de `Popover` do MUI no projeto hoje; o padrão consolidado para
  "ver detalhamento" é modal (`ViewModal`) controlado por estado no componente pai —
  por consistência, o "popover/modal" do botão "verificar bônus" será implementado
  como modal (`ViewModal`), não como `Popover` novo.
- Não há campo de filtro/busca pedido para este quadro (lista todas as perícias sem
  paginação nem busca) — portanto **não** é necessária uma `*FilterSection` aqui.

## Etapas

### 1. web-dev

#### Componentes

- Componente: `SheetSkillCard`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx`)
  - Props: `{ name: string; keyAttributeName: string; gradationName: string; total: number; breakdown: { label: string; value: number }[] }` mais `onOpenDetail: () => void`.
  - Comportamento esperado: card usando o mesmo estilo de quadro (`APP_CONTAINER_STYLES.detailSectionBox`/borda `APP_COLORS.gold`), com:
    - Lado esquerdo: nome da perícia (`DefaultText`/`Label`, destaque) e, logo abaixo, o nome do atributo-chave (texto secundário, ex.: itálico como já é feito em "Concedida por: ..."), e a graduação encontrada (ou "Destreinado") em outra linha.
    - Lado direito: um `IconButton` circular com `Tooltip` "Ver detalhamento do bônus" (ícone `react-icons/fi`, ex. `FiHelpCircle`, mesmo padrão de borda/cor do botão de detalhes em `SheetAttributesPanel`) que dispara `onOpenDetail`; ao lado dele, um círculo (mesmo visual do badge de modificador do `SheetAttributeCard`: fundo `APP_COLORS.wood`, borda `APP_COLORS.gold`, texto `APP_COLORS.goldSoft` em negrito) exibindo `total` já formatado com sinal (`+2`/`-1`/`0` sem sinal negativo duplicado).
  - Não faz nenhuma chamada de API nem cálculo — é puramente apresentacional, recebe tudo pronto via props.

- Componente: `SheetSkillsPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillsPanel/index.tsx`)
  - Props: `{ items: SheetSkillModifierResult[]; onOpenDetail: (skillId: string) => void }` (tipo `SheetSkillModifierResult` vem do hook de cálculo, ver Funcionalidade).
  - Comportamento esperado: mesmo padrão de quadro que `SheetKnowledgesPanel`/`SheetAttributesPanel` (header com `APP_CONTAINER_STYLES.detailSectionBoxHeader`, título "Perícias", ícone `react-icons/fi` condizente, ex. `FiTarget`/`FiZap`), corpo com grid de **4 colunas** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, diferente do grid de 3 colunas usado em Proficiências/Saberes) renderizando um `SheetSkillCard` por item, chamando `onOpenDetail(item.id)` no clique do botão de cada card. Exibir mensagem "Nenhuma perícia cadastrada." quando `items` estiver vazio (mesmo padrão textual das outras seções vazias).

- Componente: `SheetSkillBonusDetailModal`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/index.tsx`)
  - Props: `{ open: boolean; onClose: () => void; skill: SheetSkillModifierResult | null }`.
  - Comportamento esperado: usa `ViewModal` (`shared/components/Modals`), título com o nome da perícia (ex. `Bônus de ${skill?.name ?? ''}`), corpo listando cada entrada de `skill.breakdown` (ex.: "+2 Destreza", "+3 Proficiência Básico em Religião", "+0 Destreinado" quando não houver proficiência aplicável) e uma linha de total em destaque ao final (`Total: +N`). Segue o mesmo padrão visual das outras seções de detalhamento (`Label`/`DefaultText`, `APP_CONTAINER_STYLES.detailSectionBox` para agrupar as linhas, se aplicável).

Estes três componentes precisam existir antes de a funcionalidade abaixo os consumir
na aba Estatísticas — são implementados pelo mesmo agente (`web-dev`) na mesma etapa.

#### Funcionalidade

**Parte A — Reorganização das abas em "Bônus" (`app-web/src/app/(authorized)/fichas/[id]/page.tsx`)**

- Alterar o union type `SheetDetailTab` (linha ~66) de
  `'estatisticas' | 'melhorias' | 'defeitos' | 'proficiencias'` para
  `'estatisticas' | 'bonus'`.
- Adicionar novo estado local `activeBonusSubTab` com tipo
  `'melhorias' | 'defeitos' | 'proficiencias'`, valor inicial `'melhorias'`.
- No `<Tabs>` principal (linhas ~601-618), reduzir para duas abas: `Tab value="estatisticas" label="Estatísticas"` e `Tab value="bonus" label="Bônus"`, mantendo exatamente o mesmo `sx` (bordas/cores `APP_COLORS.gold`/`goldDark`/`textBrownDark`) já usado hoje.
- Quando `activeTab === 'bonus'`, renderizar um segundo `<Tabs>` (sub-abas), reaproveitando o mesmo objeto de estilo `sx` do `Tabs` principal (extrair para uma constante local se ficar duplicado), com `value={activeBonusSubTab}` e três `Tab`s: "Melhorias" (`melhorias`), "Defeitos" (`defeitos`), "Proficiências" (`proficiencias`). Logo abaixo dessas sub-abas, renderizar condicionalmente o conteúdo já existente hoje para cada uma (sem nenhuma alteração de conteúdo):
  - `activeBonusSubTab === 'melhorias'` → `<SheetImprovementDefectCategoryAccordions items={melhorias} />` (conteúdo idêntico ao bloco `activeTab === 'melhorias'` de hoje).
  - `activeBonusSubTab === 'defeitos'` → `<SheetImprovementDefectCategoryAccordions items={defeitos} />` (idêntico ao bloco `activeTab === 'defeitos'` de hoje).
  - `activeBonusSubTab === 'proficiencias'` → o mesmo bloco de hoje com `SheetProficienciesGrid` + `SheetAdjustedProficienciesSection` (idêntico ao bloco `activeTab === 'proficiencias'` de hoje, incluindo `handleSelectProficiencySubstitute`/`resolveProficiencyAdjustmentMutation`).
- A aba "Estatísticas" continua como primeira aba, comportamento e conteúdo hidratado (`hasHydrated`, autosave, etc.) inalterados — só a navegação de Melhorias/Defeitos/Proficiências muda de abas irmãs para sub-abas dentro de "Bônus".
- Nenhuma mudança de integração com API nesta parte — puramente navegação/estado local.

**Parte B — Quadro "Perícias" na aba Estatísticas**

- Atualizar `shared/interfaces/Entities/ProficiencyGradation/index.ts`:
  adicionar `bonus: number` em `IProficiencyGradation`. Isso é suficiente para que
  `useProficiencyGradationsQuery` (que já retorna `IProficiencyGradation[]`) passe a
  expor `bonus` sem nenhuma outra mudança nesse hook.
- Em `data/index.ts` (mesma pasta da página), exportar a função `flattenProficiencySnapshot` (hoje definida localmente e não exportada em `page.tsx`, linha ~80) para que o novo hook de cálculo (abaixo) possa reaproveitá-la sem duplicar lógica. Atualizar `page.tsx` para importar essa função de `data/index.ts` em vez de declará-la localmente — comportamento idêntico, só realocação.
- Em `page.tsx`, buscar as perícias com o hook genérico já usado no restante do projeto:
  `useGetEntityList<ISkillListItem, ISkillListFilters>({ url: '/skills', filters: { page: 1, perPage: 100 } })`. Não implementar paginação incremental nem filtro — a lista completa vem de uma vez, conforme contrato de API.
- Buscar as graduações com o hook já existente `useProficiencyGradationsQuery()` (agora tipado com `bonus`).
- Criar hook novo `useSheetSkillModifiers`
  (`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSkillModifiers/index.ts`)
  que recebe `{ skills: ISkillListItem[]; attributes: { label: string; value: number; modifier: number }[]; proficiencias: ISheetProficiencySnapshot; proficienciasAjustadas: ISheetProficiencyAdjustmentEntry[]; gradations: IProficiencyGradation[] }` e retorna `SheetSkillModifierResult[]`, com:
  ```ts
  interface SheetSkillModifierBreakdownEntry { label: string; value: number }
  interface SheetSkillModifierResult {
    id: string;
    name: string;
    keyAttributeName: string;
    gradationName: string;
    total: number;
    breakdown: SheetSkillModifierBreakdownEntry[];
  }
  ```
  Regra de cálculo (implementar exatamente assim, é fechada):
  1. Para cada `skill` em `skills`: localizar em `attributes` o item cujo `label` bata com `skill.keyAttribute.name` (case-insensitive + trim). Se não houver correspondência, tratar o modificador de atributo como `0` e sinalizar visualmente com o próprio nome do atributo mesmo assim (não deveria ocorrer em uso normal, já que atributos e `keyAttribute` compartilham o mesmo cadastro — não travar a tela por isso).
  2. Reunir todas as entradas de `proficiencias` (via `flattenProficiencySnapshot`) cujo `entry.property.name` (case-insensitive + trim) bata com `skill.name`, **mais** todas as entradas de `proficienciasAjustadas` cujo `entry.adjustedProperty` não seja `null` e cujo `entry.adjustedProperty.name` (case-insensitive + trim) bata com `skill.name` — usando `entry.originalGradation` como a graduação dessa entrada (não existe `adjustedGradation` na API; a graduação não muda no ajuste, só a propriedade beneficiada).
  3. Se houver mais de uma entrada correspondente, escolher a de maior `gradation.level` (ou `originalGradation.level`, conforme a origem).
  4. Se não houver nenhuma correspondência, usar a graduação cujo `name` (case-insensitive + trim) seja `"Destreinado"` dentro de `gradations` (lista de `useProficiencyGradationsQuery`) como fallback.
  5. Resolver o `bonus` da graduação vencedora (seja de uma entrada real, seja o fallback "Destreinado") buscando em `gradations` o item com o mesmo `id` e lendo `.bonus` — nunca hardcodar valores numéricos de graduação no frontend.
  6. `total = modificador do atributo + bonus da graduação`.
  7. Montar `breakdown` com duas entradas: `{ label: keyAttributeLabel, value: modificadorDoAtributo }` e `{ label: matchFound ? \`Proficiência ${gradationName} em ${skill.name}\` : gradationName, value: bonusDaGraduacao }` (formato ilustrado pelo usuário: "+2 Destreza", "+3 Proficiência Básico em Religião"; a formatação do sinal `+`/`-` é responsabilidade do componente de apresentação, não do hook).
- Em `page.tsx`, dentro do bloco `activeTab === 'estatisticas'`, adicionar estado local `skillPendingBonusDetail: SheetSkillModifierResult | null` (inicial `null`) e renderizar, **entre** `SheetAttributesPanel` e `SheetKnowledgesPanel`:
  ```
  <SheetAttributesPanel ... />
  <SheetSkillsPanel
    items={skillModifiers}
    onOpenDetail={(skillId) => setSkillPendingBonusDetail(skillModifiers.find(s => s.id === skillId) ?? null)}
  />
  <SheetKnowledgesPanel items={flattenKnowledgeSnapshot(saberes)} />
  ```
  Decisão explícita de ordem (não havia definição prévia entre Perícias e Saberes,
  apenas a exigência de ficar abaixo de Atributos): **Perícias fica imediatamente
  abaixo de Atributos, e Saberes continua logo abaixo de Perícias** — ou seja, a
  ordem final na aba Estatísticas passa a ser Atributos → Perícias → Saberes.
- Renderizar `<SheetSkillBonusDetailModal open={!!skillPendingBonusDetail} onClose={() => setSkillPendingBonusDetail(null)} skill={skillPendingBonusDetail} />` junto aos demais modais no final do JSX da página (ao lado de `SheetAttributesDetailModal`/`SheetImageEditModal`).
- Integrações com API: `GET /sheets/:id` (já existente, sem mudança), `GET /skills?page=1&perPage=100` (novo uso, hook genérico `useGetEntityList`), `GET /proficiency-gradations` (hook já existente `useProficiencyGradationsQuery`, agora tipado com `bonus`). Nenhum `POST`/`PUT`/`DELETE` novo — quadro 100% somente leitura.
- Formulário/validação: não há formulário nesta demanda — o quadro de Perícias é somente leitura/apresentacional (nenhum campo é editado, nenhuma perícia é criada/editada/excluída a partir da ficha; a manutenção do cadastro de perícias continua exclusivamente em `/pericias`).
- Acesso Google: **não aplicável** — o novo quadro não tem nenhuma ação de criar, editar ou excluir (é somente visualização computada a partir de dados já carregados), então não há distinção de comportamento para `provider: 'google'`; todos os usuários veem o mesmo conteúdo.

Status: concluído
Componentes: app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx (novo), app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillsPanel/index.tsx (novo), app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/index.tsx (novo)
Arquivos: app-web/src/app/(authorized)/fichas/[id]/page.tsx (reorganização de abas em Bônus/sub-abas, quadro Perícias entre Atributos e Saberes, novos estados `activeBonusSubTab`/`skillPendingBonusDetail`, busca de `/skills` e `useProficiencyGradationsQuery`, import de `flattenProficiencySnapshot` de `data/index.ts`); app-web/src/app/(authorized)/fichas/[id]/data/index.ts (export de `flattenProficiencySnapshot`); app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSkillModifiers/index.ts (novo, cálculo de modificador de perícia); app-web/src/shared/interfaces/Entities/ProficiencyGradation/index.ts (campo `bonus: number` adicionado)

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Regra de cálculo em `useSheetSkillModifiers` (prioridade 1) — validada linha a linha
contra a especificação e **aprovada sem ressalvas**:
- Modificador do atributo-chave é casado por `label`/`skill.keyAttribute.name`
  (case-insensitive + trim) e reaproveita `attribute.modifier` já computado em
  `page.tsx`, sem recálculo.
- `proficiencias` usa `entry.property.name`; `proficienciasAjustadas` usa
  `entry.adjustedProperty.name` (nunca `originalProperty`), com guarda explícita
  `entry.adjustedProperty &&` antes de comparar — entradas com `adjustedProperty
  === null` corretamente não entram nos candidatos.
- Empate de correspondências resolvido por maior `level` (`candidates.reduce`).
- Fallback "Destreinado" buscado em `gradations` por nome (case-insensitive + trim)
  quando não há candidato.
- `bonus` é sempre lido de `gradations.find(...).bonus` (nunca hardcoded); `level` só
  é usado para comparação de precedência, nunca somado ao total. Nenhuma troca entre
  os dois campos foi encontrada.

Parte A (abas) — aprovada: `SheetDetailTab` reduzido a
`'estatisticas' | 'bonus'`, `activeBonusSubTab` com valor inicial `'melhorias'`,
sub-abas Melhorias/Defeitos/Proficiências reaproveitando a mesma constante
`SHEET_TABS_SX` (evitando duplicação, conforme pedido), conteúdo de cada sub-aba
idêntico ao anterior — inclusive `SheetProficienciesGrid` +
`SheetAdjustedProficienciesSection` com `handleSelectProficiencySubstitute` /
`resolveProficiencyAdjustmentMutation` preservados. Estatísticas continua como
primeira aba com hidratação/autosave intactos.

Parte B (layout) — aprovada: grid de `SheetSkillsPanel` usa
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (4 colunas, distinto das 3 de
Proficiências/Saberes); ordem final na aba Estatísticas é Atributos → Perícias →
Saberes, exatamente como especificado; card com nome + atributo-chave + graduação à
esquerda e botão de detalhe + círculo do modificador à direita.

Busca de dados — aprovada: `GET /skills` via `useGetEntityList<ISkillListItem,
ISkillListFilters>({ url: '/skills', filters: { page: 1, perPage: 100 } })`,
graduações via `useProficiencyGradationsQuery()` já existente (nenhum hook novo
duplicado), `bonus` adicionado em `IProficiencyGradation` sem quebrar nenhum
consumidor (`ProficiencyAddModal`/`KnowledgeAddModal` apenas leem o tipo, não
constroem literais que precisariam do novo campo). `flattenProficiencySnapshot`
extraído para `data/index.ts` e reaproveitado tanto por `page.tsx`
(`SheetProficienciesGrid`, `adjustedProficienciesPropertyOptions`) quanto pelo novo
hook, sem nenhum consumidor quebrado.

Padrões gerais do CLAUDE.md — aprovados: ícones exclusivamente de `react-icons/fi`
(`FiHelpCircle`, `FiTarget`), `IconButton` de ícone sem texto visível com
`aria-label` em pt-BR (`"Ver detalhamento do bônus"`), nenhum `any` introduzido,
alias `@/*` usado nos imports novos, textos em pt-BR, reuso de `ViewModal`,
`APP_CONTAINER_STYLES`, `Label`/`DefaultText` em vez de UI inline nova. Não há
mutations novas (quadro somente leitura) e, corretamente, nenhuma regra de
ocultação para `provider: 'google'` foi aplicada, já que não há ações de
criar/editar/excluir neste quadro.

Achados menores (não bloqueantes):

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx:39`**
  — o layout do lado direito do card empilha o `IconButton` de detalhe e o círculo do
  modificador verticalmente (`flex flex-col items-center gap-2`), enquanto a task
  descreve os dois elementos lado a lado ("ao lado dele, um círculo..."). Não é um
  bug funcional, mas é uma pequena divergência do texto da especificação de layout.
  - Trecho: `<div className="flex flex-col items-center gap-2">`
  - Sugestão: trocar para `flex-row items-center gap-2` (ou `flex-col-reverse`
    trocado por `flex-row`) para posicionar o botão e o círculo lado a lado, como
    descrito na task.

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx:17-23`**
  — a prop `breakdown` é declarada em `SheetSkillCardProps` (conforme contrato da
  task) mas nunca é desestruturada/usada dentro do componente, que é puramente
  apresentacional e não renderiza o detalhamento (ele fica no
  `SheetSkillBonusDetailModal`). Não é um erro de compilação nem de tipagem, apenas
  uma prop "morta" do ponto de vista de uso interno do componente.
  - Trecho: `export const SheetSkillCard = ({ name, keyAttributeName, gradationName, total, onOpenDetail }: SheetSkillCardProps) => {`
  - Sugestão: nenhuma ação obrigatória — se quiser eliminar o ruído, pode-se
    documentar no comentário do componente que `breakdown` é recebido apenas para
    manter a tipagem alinhada ao resultado do hook, mesmo sem uso direto na
    renderização do card.

**Correção (web-dev, pós-revisão):** os dois achados acima foram resolvidos em
`SheetSkillCard/index.tsx`. (1) O container do botão de detalhe + círculo do
modificador passou de `flex flex-col items-center gap-2` para
`flex flex-row items-center gap-2`, ficando lado a lado e alinhado à direita do
card (mantido `justify-between` no container pai), conforme especificação
original. (2) A prop `breakdown` foi removida de `SheetSkillCardProps` (e do
respectivo repasse em `SheetSkillsPanel/index.tsx`) após confirmar que
`SheetSkillBonusDetailModal` recebe o `skill` completo
(`SheetSkillModifierResult`, incluindo `breakdown`) diretamente do estado
`skillPendingBonusDetail` em `page.tsx` — o card nunca precisou repassar esse
dado, então o detalhamento do bônus continua funcionando sem alteração no
fluxo do modal.

Nenhum achado bloqueante. Aprovado com ressalvas menores (apenas de polimento
visual/documentação, sem impacto funcional) nos seguintes arquivos revisados:
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/data/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSkillModifiers/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillsPanel/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/index.tsx`,
`app-web/src/shared/interfaces/Entities/ProficiencyGradation/index.ts`.