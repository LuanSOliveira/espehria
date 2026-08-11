# Spec: Ajustes na aba Habilidades da Ficha (regra de Raça para Talentos + filtro de requisitos no modal)

## Pedido original

Continuação direta da demanda `ficha-habilidades` (aba HABILIDADES da ficha, já implementada — ver
`.claude/tasks/ficha-habilidades/spec.md`). Desta lista de 4 itens, os itens 1 e 2 já foram
implementados (ver seção "Contexto" abaixo) e estão fora do escopo deste spec. Restam dois itens:

**Item 3 — Nova regra de requisito para Talentos com tag "Raça"**: se um Talento tiver uma tag cujo
nome seja "Raça", esse Talento só pode ser adicionado/considerado válido na ficha se estiver na
lista de talentos da Raça atualmente vinculada à ficha (`Race.talents`). Exemplo: a Raça "Anão" tem
o talento "A" e não tem o talento "B"; ambos têm a tag "Raça". Com "Anão" vinculada à ficha, "A"
fica disponível (se os demais requisitos também estiverem ok) e "B" não.

**Item 4 — Checkbox "somente habilidades que cumprem os requisitos" no modal de seleção**: adicionar
no `SheetAbilitySelectionModal` (reaproveitado pelas sub-abas Características, Treinamentos —
incluindo preenchimento de slot — e Talentos) um checkbox de filtro que, quando marcado, mostra
somente os itens que cumprem os requisitos.

Contexto: app-api (NestJS + TypeORM + PostgreSQL), app-web (Next.js + React + MUI).

## Contexto (itens já implementados, fora de escopo)

Os itens 1 e 2 da demanda original do usuário já foram implementados e não são replanejados nem
reimplementados por este spec:

1. Uniformização de altura dos cards por linha, via `h-full`/`flex-1`, em `SheetAbilityCard`,
   `SheetDashedFieldButton` e `SheetTrainingSlotCell`.
2. Ícone de alerta de requisitos agora vermelho, usando a cor `APP_COLORS.alertRed` (`#c62828`),
   já criada em `app-web/src/app/globals.css` e `app-web/src/shared/constants/Colors/index.ts`,
   aplicada em `SheetAbilityCard` e `SheetAbilitySelectionModal`. Qualquer necessidade de vermelho
   nesta demanda reaproveita `APP_COLORS.alertRed` — nenhuma cor nova é criada.

## Decisões tomadas por investigação

### 1. Ponto de entrada da nova regra no fluxo de requisitos

`evaluateAbilityRequirements` (`app-api/src/modules/sheets/sheets.service.ts:617`) já é o único
lugar que resolve `requirementsMet` (level + `requirements`, semântica E) e é chamado em 7 pontos:
dentro de `computeSheetAbilities` (`toCard`/`toExtraCard`, linhas ~971/990) e em cada uma das 5
operações de escrita que validam um item antes de vinculá-lo (`checkAbilityRequirements` ~1904,
`addCharacteristicExtra` ~1949, `addTrainingExtra` ~2037, `addTalentExtra` ~2122,
`fillTrainingSlot` ~2219).

Decisão: a nova regra é combinada por conjunção (E lógico) ao resultado já existente
(`levelMet && requirementsMet`) — passa a ser `levelMet && requirementsMet && raceTagRuleMet` —
dentro da mesma função, e não um mecanismo paralelo. Isso mantém um único ponto de verdade para
"a ficha atende aos requisitos deste item", que já é consumido de forma idêntica por todos os
cards e pelo modal de seleção (ver decisão nº 4). Para isso, a função precisa passar a receber,
além de `level`/`requirements`: o `entityType` do item (a regra só vale para Talento — decisão
nº 7), as tags do item (para verificar a tag "Raça" — decisão nº 5) e o conjunto de ids dos
talentos da Raça atualmente vinculada à ficha (`sheet.race?.talents`, já carregado em toda função
que possui `sheet` — nenhuma query nova é necessária para obter esse conjunto).

Todos os 7 pontos de chamada precisam repassar essas informações adicionais. Em 6 deles, o item
avaliado já é uma entidade (`Characteristic`/`Training`/`Talent`) ou um `RawEntry` que já carrega
`.tags` (ver decisão nº 5) — só é preciso passar esse valor adiante. O único ponto que hoje não
carrega tags do item avaliado é `checkAbilityRequirements` (ver decisão nº 5).

### 2. Ficha sem Raça vinculada (decisão do usuário, incorporada sem nova consulta)

Se a ficha não tem Raça vinculada, o conjunto de talentos de Raça é vazio; logo, todo Talento com
tag "Raça" fica automaticamente com requisito não atendido — não há lista de talentos de raça
para satisfazer. Decisão já definida pelo usuário no pedido original, aqui apenas documentada.

### 3. A regra se aplica também a Talentos herdados, não só aos extras

Um Talento com tag "Raça" chega à ficha por até três vias: (a) diretamente de `race.talents`, (b)
herdado de "Habilidades Adicionais" de Biografia/Talento/Treinamento/Característica já vinculados
à ficha, ou (c) adicionado manualmente como Talento Extra. A via (a) satisfaz a regra por
definição (o próprio item pertence à lista que a regra usa como critério — não há caso a tratar).
A via (c) é onde a regra bloqueia a adição (mesmo mecanismo hoje usado para level/`requirements`
nos modais — decisão nº 4). A pergunta em aberto era sobre a via (b): um Talento com tag "Raça"
herdado de `additionalAbilities` de outra entidade vinculada pode não pertencer à lista de
talentos da Raça atual.

Decisão: a regra se aplica também à via (b). Justificativa: o spec original já estabeleceu, para
level e `requirements`, que cards herdados exibem alerta quando a ficha não atende ao requisito do
item herdado (spec original, item 6 do "Escopo confirmado": *"Se a característica tiver requisito
de level (...) ou de outra entidade vinculada (`requirements`) não atendido, o card exibe um
alerta"*) — ou seja, já existe precedente direto e explícito de que itens herdados **podem** exibir
o alerta de requisito pendente mesmo sem poderem ser removidos pela UI (decisão de investigação nº
8 do spec original: sem botão de remover em herdados, remoção só via desvínculo da origem). Tratar
a regra de tag "Raça" como mais uma condição dentro do mesmo `evaluateAbilityRequirements` (decisão
nº 1) já produz esse comportamento automaticamente e por gratuidade — excluir a via (b) exigiria um
tratamento especial e inconsistente com o que já existe para as demais condições de requisito, sem
motivo de negócio para tal exceção. Alternativa descartada: aplicar a regra apenas a Talentos
adicionados como extra (ignorando herdados) — descartada por quebrar a uniformidade do mecanismo
único de requisitos já estabelecido e por não ter sido pedida explicitamente pelo usuário.

### 4. Reflexo no card e no modal de seleção

Como a regra é incorporada dentro do mesmo `requirementsMet` (decisão nº 1), nenhuma alteração é
necessária nos componentes de apresentação: `SheetAbilityCard`
(`app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilityCard/index.tsx`) já renderiza o
alerta "Requisitos pendentes" (ícone `FiAlertTriangle` em `APP_COLORS.alertRed`) a partir da prop
`requirementsMet`, de forma genérica, sem conhecer o motivo específico da não conformidade; o mesmo
vale para o botão desabilitado + alerta "Requisitos não atendidos" em `SheetAbilitySelectionModal`.
Achado relevante: o item 3 desta demanda é uma alteração **exclusivamente de backend** — o
app-web não precisa de nenhuma mudança para que a nova regra passe a refletir visualmente nos dois
lugares.

### 5. Disponibilidade das tags do Talento nos pontos de checagem

Investigação em `computeSheetAbilities`: os `RawEntry` usados para montar os cards herdados já
carregam `.tags` — vindo de `race.talents` (populado por `attachRaceOrderedTags`, que já usa
`loadOrderedTagsMap` sobre `talentTagsRepository`), ou de `ability.tags` dentro de
`EntityReferenceResponseDto` (que já inclui tags — `entity-reference-response.dto.ts:33/51`). Os
itens extras/slot também já carregam `.tags`, carregados em `loadExtrasWithTags`/
`loadSlotsWithTags` via `loadOrderedTagsMap`. Nas 4 operações de escrita que buscam a entidade
antes de vincular (`addCharacteristicExtra`, `addTrainingExtra`, `addTalentExtra`,
`fillTrainingSlot`), as tags também já vêm carregadas — `findCharacteristicWithTagsById`/
`findTrainingWithTagsById`/`findTalentWithTagsById` já chamam `loadOrderedTagsForOwner`.

O único ponto sem tags carregadas hoje é `checkAbilityRequirements`
(`sheets.service.ts:1770-1916`, endpoint `POST /sheets/:id/abilities/requirement-checks`): ele
carrega apenas o `level` de cada item avaliado (`talentsRepository.findBy`, sem tags). Decisão:
adicionar ali uma chamada em lote a `loadOrderedTagsMap` sobre `talentTagsRepository` para os
`talentIds` do batch (mesmo padrão já usado em todo o resto do arquivo — uma query batched, não
uma por item, preservando a convenção de evitar N+1 já em uso). Não é necessário fazer o mesmo
para `trainingIds`/`characteristicIds` neste endpoint, pois a regra não se aplica a esses tipos
(decisão nº 7) — evita carregar tags que não seriam usadas.

Resumo: nenhuma query nova é necessária em 6 dos 7 pontos de chamada; apenas 1 precisa de uma
query batched adicional.

### 6. "Raça" como constante nomeada, com normalização por trim + lowercase

O arquivo já tem precedente de nomes de domínio hardcoded como constantes de módulo:
`ATTRIBUTE_TYPE_NAME = 'Atributo'` e `DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME = 'Destreza'`
(`sheets.service.ts:76-78`). Decisão: seguir o mesmo padrão, com uma constante nomeada para o nome
da tag (ex.: no mesmo bloco das demais constantes do arquivo). A normalização usada para comparar o
nome da tag ao valor da constante segue exatamente o padrão já usado em `recomputeKnowledges` para
`normalizedTitle` (`item.title.trim().toLowerCase()`, `sheets.service.ts:484`) — `trim()` +
`toLowerCase()` em ambos os lados da comparação, sem qualquer normalização adicional de acentos
(consistente com o único precedente de normalização de texto já existente no arquivo).

### 7. A regra é específica de Talento — não se aplica a Característica/Treinamento

O pedido original nomeia a regra explicitamente como "Nova regra de requisito para Talentos com
tag Raça" — não há ambiguidade de escopo aqui: mesmo que uma Característica ou um Treinamento
viessem a ter uma tag chamada "Raça", a regra não os afeta. Decisão: a checagem, dentro de
`evaluateAbilityRequirements`, só é avaliada quando o item em questão é do tipo Talento
(`ReferenceableEntityType.TALENT`); para Característica/Treinamento a condição é sempre
considerada satisfeita (não interfere no resultado).

### 8. Semântica do checkbox "somente habilidades que cumprem os requisitos" (item 4, ponto de decisão 1)

`SheetAbilitySelectionModal` já distingue hoje dois motivos independentes para desabilitar o botão
de adicionar: `alreadyPresent` (item já vinculado à ficha, ícone de cadeado, tooltip "Já está na
ficha") e `!requirementsMet` (ícone de alerta, tooltip "Requisitos não atendidos") — ver
`index.tsx:216-223`. São conceitos distintos: um item já presente na ficha pode, inclusive,
atender perfeitamente aos requisitos (foi assim que ele conseguiu ser adicionado); e um item pode
não estar presente e mesmo assim não atender aos requisitos.

Decisão: o checkbox filtra exclusivamente por `requirementsMet === true`, sem considerar
`alreadyPresent`. Um item já presente na ficha continua aparecendo na listagem filtrada (com o
botão de adicionar desabilitado, como já ocorre hoje) desde que atenda aos requisitos.
Justificativa: o texto do próprio checkbox ("cumprem os requisitos") não menciona presença na
ficha — estender seu efeito para também esconder itens já vinculados mudaria seu significado
literal sem pedido explícito do usuário, e removeria da visão do usuário informação útil (o que já
está na ficha), que hoje é intencionalmente exibida ainda que desabilitada. Alternativa
descartada: fazer o checkbox esconder também os `alreadyPresent` — descartada por ampliar o escopo
do filtro além do que foi pedido e por conflitar com o comportamento já estabelecido de sempre
listar itens já presentes (apenas com ação bloqueada), sem precedente ou pedido para ocultá-los.

### 9. Arquitetura de paginação + elegibilidade (item 4, ponto de decisão 2 — decisão principal desta demanda)

Confirmado por leitura direta do código: `SheetAbilitySelectionModal` pagina hoje no backend via
`useGetEntityList` contra `/characteristics` | `/trainings` | `/talents` (`index.tsx:109-122`), e
`requirementsMet`/`alreadyPresent` são calculados **depois**, em lote, apenas para os ids da página
atual, via `POST /sheets/:id/abilities/requirement-checks`
(`useCheckSheetAbilityRequirementsQuery`, `index.tsx:127-137`); `TablePagination` usa
`count={data?.total ?? 0}` (`index.tsx:282`), vindo da listagem genérica, não filtrada por
elegibilidade.

Aplicar o novo checkbox filtrando no cliente, sobre os itens já paginados, quebra a consistência já
prevista no próprio pedido: o `count` do `TablePagination` continuaria representando o total não
filtrado, a página exibida teria menos itens que `perPage` sempre que houver itens não elegíveis
na página, e a navegação entre páginas poderia levar a páginas vazias (todos os itens da página N
podem falhar no filtro, sem the usuário saber que existem mais itens elegíveis nas páginas
seguintes). Este comportamento é inconsistente com a convenção do projeto (CLAUDE.md) de que
paginação é responsabilidade do backend, refletida em `{ data, total, page, perPage }`.

**Decisão**: mover a avaliação de elegibilidade (level + `requirements` + regra de tag "Raça",
via o mesmo `evaluateAbilityRequirements` generalizado — decisão nº 1) para o backend, aplicada
sobre o conjunto de candidatos já filtrado por nome/level/tags, **antes** da paginação. Isso requer
um novo ponto de leitura, escopado à ficha (não aos endpoints genéricos de catálogo), que:
- aceita os mesmos filtros hoje usados nas 3 listagens (`name`, `level`, `tagIds`), mais um novo
  parâmetro booleano equivalente ao estado do checkbox (somente itens com `requirementsMet` true);
- calcula `alreadyPresent`/`requirementsMet` (com a regra de Raça já incorporada) para cada
  candidato que passa nos filtros de nome/level/tags, usando as mesmas estruturas já existentes em
  `computeSheetAbilities` (`presentIdsByBucket`) e `evaluateAbilityRequirements`, com busca de
  `requirements` em lote (`loadLinksForOwnersBatched`, já usado dessa forma no arquivo — sem
  N+1 mesmo avaliando múltiplos candidatos de uma vez);
- aplica o filtro de elegibilidade (quando o parâmetro estiver ativo) **antes** de aplicar
  `skip`/`take`;
- retorna, em uma única resposta paginada, os itens da página já com `alreadyPresent`/
  `requirementsMet` embutidos — eliminando a necessidade de uma segunda chamada.

Este ponto de leitura fica sob o escopo da ficha (`SheetsService`/`SheetsController`), e não como
parâmetro adicional dos endpoints genéricos `/characteristics`, `/trainings`, `/talents`.
Justificativa da escolha de escopo: esses três endpoints são catálogos genéricos, reutilizados fora
do contexto de ficha (ex.: páginas de listagem própria de cada entidade, e o
`EntityReferenceSelectionModal` genérico usado por outras features, conforme decisão nº 9 do spec
original); acoplar a esses módulos o conceito de "elegibilidade para uma ficha específica"
(presença atual + regra de Raça) misturaria uma responsabilidade que hoje é só de `SheetsService`
(único lugar que já possui `computeSheetAbilities`/`evaluateAbilityRequirements` e as dependências
necessárias — os 3 repositórios de Característica/Treinamento/Talento já estão injetados nesse
mesmo service) com contratos de API que não têm relação com fichas. Já existe precedente direto
desse desenho: `POST /sheets/:id/abilities/requirement-checks` já é um endpoint escopado à ficha
que avalia itens de catálogo (Característica/Treinamento/Talento) contra o estado da ficha,
reaproveitando os mesmos 3 repositórios — o novo ponto de leitura é uma extensão natural desse
mesmo desenho, adicionando filtro (nome/level/tags) e paginação ao que hoje é feito só para uma
lista fechada de ids.

Quanto a expor isso como 3 endpoints paralelos (um por entidade, espelhando `/characteristics` |
`/trainings` | `/talents`) ou como um único endpoint parametrizado por `entityType`: recomenda-se
um único ponto de leitura parametrizado por `entityType` (restrito a
training/talent/characteristic, mesma validação já usada em `checkAbilityRequirements`), pelo
mesmo motivo que o próprio `SheetAbilitySelectionModal` já é um único componente genérico
reaproveitado pelas 3 sub-abas via prop `entityType`/`url` (`index.tsx:48-58`), e porque
`SheetsService` já resolve esse tipo de variação por dicionários indexados por tipo (
`OWNER_COLUMN_BY_SOURCE_TYPE`, `SNAPSHOT_KEY_BY_SOURCE_TYPE`, `BUCKET_OWNER_COLUMN`), em vez de 3
métodos quase idênticos — mesmo padrão já estabelecido nesse arquivo. A definição exata de rota,
DTO e nomes de classes fica a cargo do planejamento de backend.

Custo de avaliar requisitos de todos os candidatos filtrados (antes de paginar): aceitável dado o
domínio — Características/Treinamentos/Talentos são dados de referência de sistema de RPG de mesa
(catálogo tipicamente limitado, não dados em escala de usuário), e o custo por candidato já é
batched (uma consulta de `requirements` para todos os candidatos da página filtrada, não uma por
item), seguindo o mesmo padrão de lote já usado em todo o `computeSheetAbilities`. Ponto de atenção
registrado abaixo para o caso de esses catálogos crescerem muito no futuro.

Alternativas descartadas:
- **Filtrar no cliente após a paginação do backend** — descartada por quebrar a consistência de
  `TablePagination.count` e poder produzir páginas vazias, como descrito acima.
- **Aumentar `perPage` e filtrar no cliente de forma heurística** — descartada por não garantir
  corretude (não há tamanho de página que garanta itens suficientes) e por ainda exigir avaliar um
  lote maior via `requirement-checks`, sem resolver o problema de fundo do total incorreto.
- **Buscar todas as páginas/itens sem paginação e paginar no cliente** — descartada por contrariar
  a convenção do projeto de paginação no backend (CLAUDE.md) e não escalar para catálogos maiores.
- **Adicionar `sheetId`/flag de elegibilidade diretamente aos endpoints genéricos
  `/characteristics`, `/trainings`, `/talents`** — descartada pelos motivos de acoplamento de
  módulo já descritos acima.

### 10. Endpoint `POST /sheets/:id/abilities/requirement-checks` é substituído, não mantido em paralelo

Investigação confirmou que este endpoint (`sheets.controller.ts:392-420`) tem hoje um único
consumidor no frontend: `useCheckSheetAbilityRequirementsQuery`, usado exclusivamente dentro de
`SheetAbilitySelectionModal` (nenhum outro arquivo do app-web o referencia). Como o novo ponto de
leitura descrito na decisão nº 9 já embute `alreadyPresent`/`requirementsMet` por item paginado,
ele cobre integralmente o caso de uso que este endpoint atende hoje.

Decisão: `POST /sheets/:id/abilities/requirement-checks` é descontinuado (removido), e não mantido
como um mecanismo paralelo. Justificativa: manter os dois pontos de leitura ativos duplicaria a
lógica de avaliação de requisitos em dois lugares (`evaluateAbilityRequirements` já é reaproveitado
por ambos, mas a orquestração ao redor — busca de candidatos, montagem de `presentIdsByBucket` —
ficaria duplicada), criando risco real de os dois caminhos divergirem no futuro (ex.: uma nova
regra de requisito, como a de tag Raça desta própria demanda, ser aplicada em um caminho e
esquecida no outro) sem nenhum ganho, já que não há mais nenhum consumidor que precise do formato
antigo (avaliação em lote de uma lista fechada de ids, sem paginação/filtro).

## Escopo confirmado

### Regra de requisito de Talento com tag "Raça" (item 3)

1. Um Talento que possua uma tag cujo nome, normalizado (sem espaços nas extremidades, sem
   diferenciar maiúsculas de minúsculas), seja "Raça" só é considerado com requisitos atendidos na
   ficha se estiver entre os talentos associados à Raça atualmente vinculada à ficha.
2. Se a ficha não tiver Raça vinculada, todo Talento com tag "Raça" é considerado com requisito não
   atendido.
3. Esta regra é adicional e independente da validação de requisitos (`requirements`) e do requisito
   de level já existentes — as três condições precisam ser satisfeitas simultaneamente para que o
   item seja considerado com requisitos atendidos.
4. A regra se aplica a qualquer Talento com tag "Raça" presente na ficha, seja herdado diretamente
   da Raça vinculada (que por construção sempre satisfaz a regra), herdado de Habilidades
   Adicionais de Biografia/Talento/Treinamento/Característica já vinculados à ficha, ou adicionado
   como Talento Extra.
5. Quando não atendida, a regra produz o mesmo efeito já estabelecido para os demais requisitos:
   alerta visual no card (herdado ou extra) e bloqueio de adição com alerta no modal de seleção;
   um Talento já vinculado à ficha não é desvinculado automaticamente caso passe a não atender a
   regra (ex.: troca da Raça vinculada) — permanece na ficha, apenas exibindo o alerta.
6. A regra não se aplica a Características ou Treinamentos, mesmo que tenham uma tag "Raça".

### Filtro "somente habilidades que cumprem os requisitos" no modal de seleção (item 4)

7. O modal de seleção de habilidades, reaproveitado pelas sub-abas Características, Treinamentos
   (incluindo preenchimento de slot) e Talentos, ganha um filtro do tipo checkbox: quando marcado,
   exibe somente itens cujo status de requisitos atendidos (level + `requirements` + regra de tag
   "Raça" quando aplicável) seja positivo. Desmarcado por padrão (mesmo comportamento atual,
   listando todos os itens que atendem aos demais filtros).
8. Esse filtro não considera se o item já está presente na ficha: um item já vinculado à ficha
   continua aparecendo na listagem filtrada (com o botão de adicionar desabilitado, como já ocorre
   hoje) desde que atenda aos requisitos.
9. A paginação exibida no modal (contagem total, número de páginas, itens por página) reflete
   sempre e exclusivamente o conjunto de itens já filtrado por todos os filtros ativos, incluindo o
   filtro de requisitos — nunca um total desatualizado em relação ao que está sendo exibido.

## Comportamento no app-web

- Nenhuma alteração visual ou de código é necessária em `SheetAbilityCard` nem em qualquer lugar
  que já exibe alerta de requisitos pendentes a partir do campo `requirementsMet` das 3 sub-abas —
  a regra de tag "Raça" chega automaticamente por já ser backend-only (decisão nº 4).
- Novo checkbox "Somente habilidades que cumprem os requisitos" (rótulo exato a definir no
  planejamento de frontend) em `SheetAbilitySelectionModal`, próximo aos filtros de nome/level/tags
  já existentes, desmarcado por padrão.
- Ao alternar o checkbox, a paginação volta para a primeira página — mesmo padrão já usado hoje
  quando qualquer outro filtro do modal muda (`index.tsx:105-107`).
- A listagem do modal passa a vir de uma única chamada ao backend (novo ponto de leitura escopado à
  ficha, decisão nº 9), já trazendo `alreadyPresent`/`requirementsMet` por item — elimina a segunda
  chamada em lote hoje feita via `useCheckSheetAbilityRequirementsQuery`.
- `TablePagination` do modal passa a refletir o total retornado por essa nova chamada, já
  considerando os filtros de nome/level/tags e, quando ativo, o filtro de requisitos.
- Nenhuma cor nova é introduzida — qualquer indicação visual de "requisito não atendido" continua
  usando `APP_COLORS.alertRed`, já existente.

## Requisitos para o planejamento de backend

1. Generalizar `evaluateAbilityRequirements` (`sheets.service.ts:617`) para também considerar a
   regra de tag "Raça": incorporar ao item avaliado seu `entityType` e suas tags, e receber o
   conjunto de ids dos talentos da Raça vinculada à ficha (`sheet.race?.talents`, já carregado nas
   funções que hoje chamam esta função — nenhuma query nova para obter esse conjunto). A condição
   nova só é avaliada quando `entityType` é Talento.
2. Adicionar uma constante nomeada para o nome da tag "Raça" (mesmo padrão de `ATTRIBUTE_TYPE_NAME`/
   `DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME`), comparada ao nome da tag via `trim()` + `toLowerCase()`
   em ambos os lados (mesmo padrão de `normalizedTitle` em `recomputeKnowledges`).
3. Atualizar os 7 pontos de chamada de `evaluateAbilityRequirements` para repassar `entityType`,
   tags do item e o conjunto de talentos de Raça. Em `computeSheetAbilities` (`toCard`/
   `toExtraCard`), tags e `entityType` já estão disponíveis nas estruturas existentes. Nas 4
   operações de escrita (`addCharacteristicExtra`, `addTrainingExtra`, `addTalentExtra`,
   `fillTrainingSlot`), tags já vêm carregadas nas entidades buscadas antes da vinculação. No
   endpoint `checkAbilityRequirements`, adicionar uma busca em lote (`loadOrderedTagsMap` sobre
   `talentTagsRepository`) para os ids de Talento avaliados — único ponto que hoje não carrega tags
   dos itens avaliados.
4. Implementar um novo ponto de leitura, escopado à ficha (não como alteração dos endpoints
   genéricos `/characteristics`, `/trainings`, `/talents`), que retorna a listagem de candidatos
   (Característica, Treinamento ou Talento, conforme parâmetro) já paginada, aceitando os mesmos
   filtros de nome/level/tags hoje suportados pelas 3 listagens, mais um novo parâmetro de
   "somente elegíveis" — avaliando `alreadyPresent`/`requirementsMet` (já incluindo a regra de
   Raça) para o conjunto de candidatos filtrado por nome/level/tags **antes** de paginar, e
   retornando esses dois campos já embutidos em cada item da página. Recomendação (decisão nº 9):
   um único ponto de leitura parametrizado por `entityType` (restrito a
   training/talent/characteristic), reaproveitando os 3 repositórios já injetados em
   `SheetsService` e a mesma lógica de `computeSheetAbilities`/`evaluateAbilityRequirements` — nome
   exato de rota/DTO/classes fica a critério do planejamento de backend.
5. Descontinuar `POST /sheets/:id/abilities/requirement-checks` (controller, DTO de entrada,
   serviço e DTO de resposta associados), substituído integralmente pelo novo ponto de leitura do
   item 4 — sem consumidores remanescentes após a migração do frontend (decisão nº 10).
6. Nenhuma migration é necessária para nenhum dos dois itens: a regra de tag "Raça" é derivada em
   tempo de leitura a partir de dados já existentes (tags do Talento + `Race.talents`), e o novo
   filtro/paginação do modal não introduz nenhuma coluna ou tabela nova.
7. Nenhuma regra de permissão/visibilidade além do CRUD/propriedade de ficha já existente.

## Requisitos para o planejamento de frontend

1. Adicionar o checkbox de filtro "somente itens que cumprem os requisitos" em
   `SheetAbilitySelectionModal`, integrado ao mesmo grupo de filtros hoje existente (nome/level/
   tags), resetando a página para 1 ao ser alternado — mesmo padrão já usado para os demais
   filtros do modal.
2. Substituir a combinação atual `useGetEntityList` (contra `/characteristics` | `/trainings` |
   `/talents`) + `useCheckSheetAbilityRequirementsQuery` (contra
   `/sheets/:id/abilities/requirement-checks`) por uma única chamada ao novo ponto de leitura
   escopado à ficha (requisito de backend nº 4), passando `sheetId`, `entityType`, `name`, `level`,
   `tagIds`, o novo parâmetro de elegibilidade (ligado ao estado do checkbox) e `page`/`perPage`.
3. Ajustar `TablePagination` do modal para usar o `total` retornado por essa nova chamada.
4. Remover o hook `useCheckSheetAbilityRequirementsQuery` e a interface
   `ISheetAbilityRequirementCheck` (`shared/interfaces/Entities/Sheet/index.ts`) associados ao
   endpoint descontinuado (requisito de backend nº 5) — investigação confirmou que não têm outro
   consumidor no app-web além de `SheetAbilitySelectionModal`.
5. Ajustar a interface local hoje usada para os itens do modal (`SheetAbilityCandidate`) para já
   incluir `alreadyPresent`/`requirementsMet`, refletindo o novo formato de resposta único.
6. Nenhuma alteração é necessária em `SheetAbilityCard` nem em nenhum outro consumidor do campo
   `requirementsMet` já existente nas 3 sub-abas — a regra de tag "Raça" chega automaticamente
   (decisão nº 4).
7. Não há componente de checkbox reutilizável hoje para estado local simples (`useState`) neste
   padrão de filtros — existe apenas `FormCheckboxInput`, ligado a `react-hook-form`, o que não é o
   caso deste modal (filtros em `useState` simples). O planejamento de frontend decide entre criar
   um componente `Default*` equivalente (seguindo o padrão de `DefaultTextInput`/
   `DefaultMultiAutocompleteInput`) ou usar diretamente `Checkbox`/`FormControlLabel` do MUI neste
   ponto único.
8. Nenhuma cor nova — reaproveitar `APP_COLORS.alertRed` (já existente) onde for necessário indicar
   requisito não atendido.

## Pontos de atenção

- A regra de tag "Raça" depende do **nome** da tag, não de um identificador estável — mesma
  categoria de risco já aceita hoje para `ATTRIBUTE_TYPE_NAME`/
  `DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME`: se a tag "Raça" for renomeada ou removida na gestão de
  Tags, Talentos que a usavam deixam de estar sujeitos à regra silenciosamente. Não é uma regressão
  introduzida por esta demanda — apenas mais uma ocorrência de um padrão de risco já existente e
  aceito no código.
- Avaliar requisitos (incluindo a regra de Raça) para todo o conjunto de candidatos filtrado por
  nome/level/tags, antes de paginar, é mais custoso que o modelo atual (avaliação só da página
  atual). Aceitável hoje dado o tamanho tipicamente limitado dos catálogos de
  Característica/Treinamento/Talento (dados de referência de sistema de RPG de mesa); revisitar se
  esses catálogos crescerem substancialmente.
- Descontinuar `POST /sheets/:id/abilities/requirement-checks` exige remover, junto com o
  controller/serviço, o DTO de entrada, o DTO de resposta e o hook/interfaces correspondentes no
  app-web — checklist de remoção a ser seguido integralmente pelo planejamento, para não deixar
  código morto.
- A lógica de filtro por nome/level/tags (incluindo a junção com a tabela de tags e o tratamento de
  `groupBy`/`having` para contagem correta com filtro de tags, já presente de forma praticamente
  idêntica em `characteristics.service.ts`, `trainings.service.ts` e `talents.service.ts`) precisa
  ser reaproveitada ou generalizada para o novo ponto de leitura escopado à ficha — forma exata
  (compartilhar helper vs. duplicar, como já ocorre entre os 3 módulos hoje) fica a critério do
  planejamento de backend.

## Fora de escopo

- Qualquer alteração nos endpoints genéricos `/characteristics`, `/trainings`, `/talents` usados
  fora do contexto de ficha (páginas de catálogo próprias, `EntityReferenceSelectionModal` de
  outras features) — permanecem exatamente como estão.
- Qualquer nova regra de requisito além da tag "Raça" para Talentos (outras tags especiais, outras
  entidades, outros tipos de vínculo) — não solicitada, não implementada.
- Reestruturação de "Aprimorado de", herança transitiva de Habilidades Adicionais, suporte a
  Técnicas/Magias na ficha — seguem fora de escopo, herdado do spec original
  (`.claude/tasks/ficha-habilidades/spec.md`).
- Reimplementação ou replanejamento dos itens 1 e 2 da demanda original (uniformização de altura
  dos cards; ícone de alerta vermelho) — já implementados, listados apenas para rastreabilidade.
- Migrations — nenhuma é necessária para os dois itens desta demanda.