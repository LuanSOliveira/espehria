# Spec: Aba Habilidades da Ficha (Características, Treinamentos, Talentos)

## Pedido original

Adicionar uma nova aba HABILIDADES na página de visualização da ficha
(`app-web/src/app/(authorized)/fichas/[id]/page.tsx`), que hoje tem apenas as abas ESTATÍSTICAS e
BÔNUS.

Ao selecionar HABILIDADES, existem sub-abas: CARACTERÍSTICAS, TREINAMENTOS e TALENTOS (mesmo
padrão de sub-abas já usado em BÔNUS).

**Sub-aba CARACTERÍSTICAS**: listagem das características atribuídas à ficha, cards em linhas de
até 4 itens, cada card mostrando nome, level, tags, indicativo de origem ("via Raça X") e ações de
visualizar/remover. As características desta listagem principal vêm de "Habilidades Adicionais" de
outras entidades vinculadas à ficha (Raça, Biografia, Talento, Treinamento ou Característica já
vinculados). Se a característica tiver requisitos não atendidos pela ficha (level mínimo ou
requisito de outra entidade), exibir alerta no card. Abaixo da listagem, seção "Características
Extras" com botão dashed "Adicionar características extras" (mesmo padrão visual de
`SheetDashedFieldButton`) que abre modal de seleção com filtros, listando todas as características
do sistema; itens já na ficha ficam com o botão de adicionar desabilitado; itens sem requisitos
atendidos exibem alerta e também ficam com o botão desabilitado. Itens adicionados via essa via
aparecem na seção "Características Extras" como cards, sem indicativo de origem. O botão dashed
sempre ocupa o "próximo slot" logo após o último item.

**Sub-aba TREINAMENTOS**: mesmo formato de cards em linhas de 4, com três seções: "Treinamentos"
(slots — quantidade depende do level da ficha: level 1 = 3 slots, cada level subsequente adiciona
+1 slot; cada slot vazio é um botão dashed que abre o mesmo tipo de modal de seleção; ao preencher,
o botão dá lugar ao card; abaixo de cada slot há indicativo de em qual level ele foi liberado; ao
reduzir o level da ficha, slots que dependiam do(s) level(s) removido(s) desaparecem e o
treinamento vinculado naquele slot é desvinculado), "Treinamentos Herdados" (mesmo conceito da
listagem principal de Características, com indicativo de origem) e "Treinamentos Extras" (mesma
dinâmica de "Características Extras", sem limite).

**Sub-aba TALENTOS**: mesmo comportamento de CARACTERÍSTICAS (listagem principal herdada + seção
"Talentos Extras" com modal), trocando a entidade para Talento.

**Regra transversal**: ao vincular Característica, Treinamento ou Talento à ficha (herança,
slot ou extra), as propriedades "melhorias", "proficiências" e "saber" dessas entidades devem ser
aplicadas à ficha seguindo exatamente as mesmas regras já usadas hoje quando Raça ou Biografia são
vinculadas.

Contexto: app-api (NestJS + TypeORM + PostgreSQL), app-web (Next.js + React + MUI).

## Decisões do usuário

Estas decisões foram tomadas previamente pelo usuário e são incorporadas sem nova consulta:

1. **"Aprimorado de" está fora de escopo.** A propriedade `improvedFrom`/`EntityLinkType.IMPROVED_FROM`
   existe hoje nas 5 entidades "Habilidades" (Treinamentos, Talentos, Características, Técnicas,
   Magias). O usuário decidiu removê-la, mas em uma tarefa separada e posterior. Nesta demanda:
   nada relacionado a `improvedFrom` é alterado, e nenhuma validação de requisitos em cascata via
   "Aprimorado de" é implementada (explicitamente descartada).
2. **Herança de Habilidades Adicionais é de um nível apenas** (sem cadeia transitiva). Apenas
   entidades diretamente vinculadas à ficha (Raça, Biografia, e Talentos/Treinamentos/Características
   já vinculados à ficha) contribuem suas Habilidades Adicionais para a listagem. Não há recursão a
   partir das habilidades herdadas.
3. **Treinamento herdado via Habilidade Adicional** aparece na seção própria "Treinamentos
   Herdados", separada de "Treinamentos" (slots) e "Treinamentos Extras".
4. **Remoção de item herdado é temporária/não persistente**, pois o item herdado é estado derivado
   do vínculo atual com a origem (se a origem for desvinculada e revinculada, ou o cálculo for
   refeito, o item volta a aparecer); não existe registro persistente de "exclusão" de item herdado
   na ficha. Ver decisão de investigação nº 8 para o tratamento adotado.

## Decisões tomadas por investigação

Conforme instrução recebida, os pontos ainda em aberto foram investigados no código real e
decididos aqui, sem nova rodada de perguntas ao usuário.

### 1. Duas origens distintas de herança (Raça é um caso especial)

`Race` (`app-api/src/modules/races/entities/race.entity.ts`) **não** usa `entity_links` — ela
vincula Característica e Talento por `ManyToMany` direto (`race_characteristics` / `race_talents`).
A tabela `entity_links` (`app-api/src/modules/entity-links/entities/entity-link.entity.ts`) não
possui coluna `owner_race_id`: Raça não é (e não passa a ser) dona de `additionalAbilities`.

Decisão: a herança de Características/Talentos/Treinamentos para a ficha tem duas fontes distintas
e não equivalentes:
- **Raça**: contribui Características e Talentos via suas listas diretas `race.characteristics` /
  `race.talents` (nunca Treinamentos, pois Raça não tem esse relacionamento nem `additionalAbilities`).
- **Biografia, Característica, Treinamento e Talento já vinculados à ficha**: contribuem via suas
  listas `additionalAbilities` (`EntityLinkType.ADDITIONAL_ABILITY`), podendo referenciar Característica,
  Treinamento ou Talento (Técnica/Magia também podem tecnicamente estar nessa lista hoje, mas não
  têm onde "aparecer" na ficha — ver seção "Fora de escopo").

Achado relevante para o planejamento de backend: `sheet.race` é hoje serializado em
`SheetResponseDto.fromEntity` via `RaceResponseDto.fromEntity(sheet.race)` **sem** o parâmetro
`references` (melhorias/proficiências/saberes próprias da raça vêm vazios nesse contexto), mas
`characteristics`/`talents` da raça são preenchidos diretamente a partir da relação (não dependem
do parâmetro `references`) — ou seja, o payload de `sheet.race.characteristics`/`sheet.race.talents`
**já vem populado hoje**, apesar de o tipo frontend `ISheetRace`
(`app-web/src/shared/interfaces/Entities/Sheet/index.ts`, que estende `IRaceListItem`) não declarar
esses campos. Já `sheet.biography` é serializado via `BiographyOptionResponseDto`
(`app-api/src/modules/biographies/dto/biography-option-response.dto.ts`), que **não** inclui
`additionalAbilities` — gap real a ser resolvido pelo planejamento de backend.

### 2. Buckets dos snapshots já preparados, mas com ordem diferente da sugerida

`Sheet.melhorias`/`defeitos`/`proficiencias`/`saberes` já têm as chaves `race | biography |
trainings | talents | characteristics` (as três últimas "sempre vazias hoje", conforme contexto
fornecido), confirmadas de forma idêntica nos três arquivos de interface (
`sheet-improvement-flaw-snapshot.interface.ts`, `sheet-proficiency-snapshot.interface.ts`,
`sheet-knowledge-snapshot.interface.ts`).

Divergência registrada: o texto de defaults sugeridos propôs a ordem de precedência
"characteristics → trainings → talents", mas a convenção já existente e consistente no código
(ordem das chaves, replicada identicamente nas 3 interfaces) é **`trainings → talents →
characteristics`**. Decisão: seguir a ordem já existente no código, por ser convenção estabelecida
de forma consistente em múltiplos arquivos, e não a ordem sugerida no texto de apoio.

Cada entrada de `melhorias`/`defeitos`/`proficiencias`/`saberes` é atribuída ao bucket
correspondente ao **tipo da entidade que originou aquele item** (Característica → bucket
`characteristics`; Treinamento → bucket `trainings`; Talento → bucket `talents`), **independente de
como essa entidade chegou à ficha** (herdada, slot ou extra) — mesma lógica hoje aplicada a
`race`/`biography` (o bucket identifica o tipo de entidade dona da melhoria, não o motivo do
vínculo). O campo `sourceName` de cada entrada é o nome da própria entidade dona (Característica/
Treinamento/Talento), pelo mesmo padrão hoje usado em `linkRace`/`linkBiography`
(`sourceName: race.name` / `sourceName: biography.name`).

### 3. Ordem de precedência dentro de cada bucket (trainings/talents/characteristics)

Não há precedente direto no código para conflitos entre múltiplas entidades do mesmo tipo dentro do
mesmo bucket (hoje só existem `race`/`biography`, que são vínculos únicos). Decisão (default
proposto para confirmação do planejamento de backend): dentro de cada bucket, a ordem de mesclagem
é **herdados (na ordem de vínculo de suas origens) → itens de slot em ordem de slot (somente
`trainings`) → itens extras na ordem em que foram adicionados**. Justificativa: mantém o espírito já
documentado no código-fonte de `recomputeProficiencies` ("a origem que acabou de ser (re)vinculada
deve vir por último, mesclando seus itens sobre o estado já construído") — herança é o estado "de
fundo" da ficha, enquanto ações diretas do usuário (slot, extra) são mais recentes/intencionais e
devem prevalecer em caso de empate de graduação.

A ordem de exibição dos cards herdados (não a de precedência de conflito) segue a mesma ordenação
alfabética por nome já usada hoje para `additionalAbilities` em
`EntityLinksService.loadReferencesFor` (`sortByName`).

### 4. Regra de nível (level) como requisito

Confirmado: `Characteristic.level`, `Training.level` e `Talent.level` são colunas `int`
obrigatórias (`app-api/src/modules/{characteristics,trainings,talents}/entities/*.entity.ts`).
Decisão: requisito de level é `ficha.level >= entidade.level`, sem alterações ao default sugerido.

Este requisito de level é **conceitualmente distinto** do "level em que um slot de Treinamento foi
liberado" (metadado puramente informativo do slot, não uma validação) — os dois se aplicam
simultaneamente e de forma independente a um Treinamento colocado em um slot.

### 5. Semântica de `requirements` (primeira vez que é validado no sistema)

Não existe hoje, em nenhum lugar do código (backend ou frontend), qualquer validação de
"requisitos atendidos" — `requirements` é hoje apenas uma lista de referência exibida, sem
verificação de cumprimento. Esta demanda é a primeira a introduzir essa validação. Decisão (por
ausência de convenção contrária): semântica **E** — todos os itens de `requirements` precisam estar
vinculados/presentes na ficha.
- Item de `requirements` do tipo Característica/Treinamento/Talento: considerado atendido se esse
  item estiver **atualmente presente na ficha**, herdado ou explícito (ver decisão nº 7 — o que
  importa é a presença, não a origem).
- Item de `requirements` do tipo Biografia: considerado atendido se `sheet.biography?.id` for igual
  ao id do item.
- Item de `requirements` do tipo Técnica ou Magia: a ficha não possui hoje nenhum mecanismo para
  "ter" uma Técnica ou Magia (não existe aba Técnicas/Magias na ficha — fora de escopo). Decisão:
  tratar esses itens como **sempre não atendidos** (o card correspondente sempre exibirá o alerta de
  requisito pendente e, no modal de seleção, o botão de adicionar permanece desabilitado). Ponto de
  atenção registrado para quando a ficha ganhar suporte a Técnicas/Magias no futuro.
- Raça nunca pode ser item de `requirements` (não é um `ReferenceableEntityType`), não precisa de
  tratamento especial.

### 6. Formula de slots de Treinamento

Confirmada sem contradição no código (`Sheet.level` é `int`, mínimo 1, default 1): `3 + (level -
1)` slots. Os 3 primeiros slots são liberados no level 1 (não há "level 0"); cada slot subsequente é
liberado 1 a 1 a partir do level 2 (4º slot → level 2, 5º slot → level 3, etc.). Ao reduzir o level
da ficha, remove-se o(s) slot(s) de maior "level de liberação" que excedam a nova contagem; se o
slot removido estiver preenchido, o Treinamento vinculado é desvinculado (com recálculo de
melhorias/defeitos/proficiências/saberes).

### 7. Item já presente na ficha não pode ser adicionado de novo (herdado bloqueia extra)

O próprio pedido original já resolve este ponto explicitamente para "Características Extras": *"Se
a característica já estiver na ficha, o botão de adicionar fica desabilitado"* — sem qualificar "só
se for extra". Decisão: generalizar essa regra para Treinamentos e Talentos Extras e para os slots
de Treinamento — **qualquer presença atual na ficha (herdada, em slot ou extra) bloqueia nova
adição do mesmo item**, em qualquer modal de seleção (slot ou extras). Alternativa considerada e
descartada: permitir adicionar como extra mesmo já herdado, exibindo dois cards (mesmo padrão de
"duas origens diferentes" definido pelo usuário para itens vindos de origens *diferentes*) — foi
descartada porque duplicaria a aplicação de melhorias/proficiências/saberes da mesma entidade
(double counting), o que não é a intenção, e porque o texto do pedido original já resolve isso ao
não qualificar a condição de bloqueio.

### 8. Botão "remover" em cards herdados

Seguindo a recomendação do próprio usuário (decisão nº 4 de "Decisões do usuário"), decide-se
**não exibir** o botão de remover em cards herdados (Características/Treinamentos/Talentos
herdados via Habilidades Adicionais de outra entidade vinculada, ou via `race.characteristics`/
`race.talents`). Para "remover" um item herdado, o usuário desvincula a origem (Raça, Biografia, ou
a Característica/Treinamento/Talento que o traz). Alternativa registrada, não adotada: exibir o
botão com efeito efêmero (a remoção duraria até o próximo recálculo, reaparecendo assim que a
origem fosse revinculada ou o cálculo refeito) — descartada por ser potencialmente confusa para o
usuário, que entenderia como remoção permanente sem que seja.

### 9. Filtros do(s) modal(is) de seleção

Confirmados idênticos nos 3 DTOs de listagem (`FindCharacteristicsQueryDto`,
`FindTrainingsQueryDto`, `FindTalentsQueryDto`): `name` (busca parcial), `level` (valor exato) e
`tagIds` (array, AND). Decisão: os modais de seleção desta demanda (extras e slots) devem
reaproveitar esses mesmos três filtros. Ponto de atenção: o componente hoje reaproveitável para esse
tipo de modal, `EntityReferenceSelectionModal`
(`app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`), usado na feature
"Habilidades Adicionais", suporta hoje **apenas** filtro por `name`. Para atender ao requisito aqui
(mesmos filtros das páginas de listagem), o planejamento de frontend precisará estendê-lo (ou criar
um modal dedicado) para suportar também `level` e `tagIds` — divergência explícita do comportamento
atual desse componente.

### 10. Padrão visual de "cards em linhas de até 4"

Já existe um padrão idêntico em uso dentro da própria página de ficha, em `SheetSkillsPanel`
(`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillsPanel/index.tsx`), com grid
responsivo `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Decisão: usar esse mesmo padrão de grid
como referência para todas as listagens de cards desta demanda.

### 11. Botão dashed como "próximo slot" dentro do grid

`SheetDashedFieldButton` (`app-web/src/app/(authorized)/fichas/[id]/components/SheetDashedFieldButton/index.tsx`)
já existe e é usado hoje como campo único de largura total (não dentro de um grid de cards). Ao ser
posicionado dentro de uma célula do grid de cards (mesma largura de um card, ver decisão nº 10), ele
atende ao requisito "tamanho de um card" sem necessidade aparente de um componente novo — ponto de
atenção registrado para o planejamento de frontend confirmar se o componente atual atende
visualmente sem ajuste ou se precisa de uma variante para essa disposição em grid.

### 12. Ação "visualizar" reaproveitando o dispatcher existente

Já existe um dispatcher reaproveitável (`useEntityMentionViewStore` / `openEntityView(entityType,
id)`, usado em `EntityReferenceSelectionModal`) que abre a view de detalhe correta a partir do
`entityType`. Decisão: reaproveitar esse mesmo dispatcher para a ação "visualizar" em todos os
cards desta demanda (herdados, extras e slots), consistente com o padrão já usado em "Aprimorado
de"/"Requisitos"/"Habilidades Adicionais".

### 13. Modelagem de persistência dos vínculos ficha↔habilidade

Fica **em aberto, deliberadamente**, como decisão de arquitetura a cargo do planejamento de
backend (não é papel deste spec decidir modelo de dados). Este spec apenas relaciona, na seção
"Requisitos para o planejamento de backend", os requisitos funcionais que essa modelagem precisa
satisfazer.

## Escopo confirmado

### Escopo geral

A página de visualização de ficha (`app-web/src/app/(authorized)/fichas/[id]/page.tsx`) ganha uma
nova aba de primeiro nível, HABILIDADES, ao lado de ESTATÍSTICAS e BÔNUS, com três sub-abas de
segundo nível: CARACTERÍSTICAS, TREINAMENTOS e TALENTOS (mesmo padrão de `Tabs`/`Tab` de dois
níveis já usado para BÔNUS/MELHORIAS-DEFEITOS-PROFICIÊNCIAS).

### Origens de habilidades vinculadas à ficha

1. Raça vinculada à ficha contribui suas Características e Talentos diretamente associados
   (`race.characteristics` / `race.talents`) como itens herdados.
2. Biografia vinculada à ficha contribui os itens de sua lista `additionalAbilities` (do tipo
   Característica, Treinamento ou Talento) como itens herdados.
3. Cada Característica, Treinamento ou Talento atualmente vinculado à ficha (herdado, em slot ou
   extra) contribui os itens de sua própria lista `additionalAbilities` (do tipo Característica,
   Treinamento ou Talento) como itens herdados — herança de um nível apenas, sem recursão a partir
   de itens já herdados.
4. Não há herança de Treinamentos a partir de Raça (Raça não tem Treinamentos nem
   `additionalAbilities`).

### Sub-aba Características

5. Listagem principal "Características": um card por item herdado (origem #1, #2 ou #3 acima),
   exibindo nome, level, tags e indicativo textual da entidade de origem (ex.: "via Raça X"), com
   ações de visualizar (abre a view de detalhe da característica) — sem ação de remover (decisão de
   investigação nº 8).
6. Se a característica tiver requisito de level (`ficha.level >= característica.level`) ou de outra
   entidade vinculada (`requirements`, semântica E) não atendido, o card exibe um alerta indicando
   requisitos pendentes.
7. Quando a mesma característica é herdada de duas origens diferentes vinculadas à ficha, um card é
   exibido por origem (não agrupado).
8. Abaixo da última linha da listagem principal, seção "Características Extras": botão dashed
   "Adicionar características extras" no formato "próximo slot" do grid, que abre um modal de
   seleção com os mesmos filtros de nome/level/tags das páginas de listagem de Características.
9. No modal: cada item exibe informações básicas, ação de visualizar e ação de adicionar; o botão
   de adicionar fica desabilitado se o item já estiver presente na ficha (herdado, extra ou, no
   caso de Treinamentos, em slot) ou se a ficha não atender aos requisitos do item (exibindo alerta
   no card do modal também nesse segundo caso).
10. Itens adicionados via "Características Extras" aparecem como cards na própria seção, no mesmo
    formato dos cards herdados, porém **sem** indicativo de entidade de origem, e **com** ação de
    remover (remoção explícita permitida, diferente de itens herdados).

### Sub-aba Treinamentos

11. Três seções, cada uma em grid de até 4 cards por linha: "Treinamentos" (slots), "Treinamentos
    Herdados" e "Treinamentos Extras".
12. Seção "Treinamentos": quantidade de slots = `3 + (level da ficha - 1)`. Slot vazio é um botão
    dashed que abre o modal de seleção de Treinamentos (mesmos filtros e mesmas regras de bloqueio
    de item já presente/requisitos não atendidos da seção anterior); ao adicionar, o botão dashed é
    substituído pelo card do treinamento. Cada slot (vazio ou preenchido) exibe abaixo de si um
    indicativo do level da ficha em que aquele slot foi liberado.
13. Ao reduzir o level da ficha, os slots cujo level de liberação excede a nova contagem de slots
    desaparecem; se estavam preenchidos, o Treinamento correspondente é desvinculado da ficha, com
    recálculo de melhorias/defeitos/proficiências/saberes.
14. Seção "Treinamentos Herdados": mesmo comportamento da listagem principal de Características
    (indicativo de origem, alerta de requisitos pendentes, sem ação de remover), aplicado a
    Treinamentos.
15. Seção "Treinamentos Extras": mesma dinâmica de "Características Extras" (botão dashed "Adicionar
    treinamentos extras", sem limite, cards com ação de remover, sem indicativo de origem).
16. Um mesmo Treinamento não pode ocupar mais de um slot, nem estar simultaneamente em slot e em
    extras, nem duplicado em extras (ver decisão de investigação nº 7 — presença em qualquer uma
    das formas bloqueia nova adição em qualquer outra).

### Sub-aba Talentos

17. Mesmo comportamento da sub-aba Características (listagem principal herdada com indicativo de
    origem e alerta de requisitos, sem remoção; seção "Talentos Extras" com modal de seleção, sem
    limite, cards com ação de remover, sem indicativo de origem), substituindo a entidade por
    Talento.

### Requisitos

18. Requisito de level: `ficha.level >= entidade.level`.
19. Requisito de outra entidade vinculada (`requirements`): semântica E — todos os itens precisam
    estar presentes na ficha (Característica/Treinamento/Talento: presente na ficha por qualquer
    via; Biografia: `sheet.biography` igual ao item; Técnica/Magia: sempre considerado não atendido,
    pois a ficha não tem como possuí-las nesta demanda).
20. Se a ficha perder um requisito depois de a habilidade já ter sido adicionada via extras ou slot,
    o item permanece vinculado, apenas exibindo o alerta de requisito pendente — não é desvinculado
    automaticamente. Exceção: a regra de remoção de slot de Treinamento por redução de level (item
    13), que desvincula o Treinamento independentemente de requisitos.
21. "Aprimorado de" não participa de nenhuma validação de requisito nesta demanda (fora de escopo).

### Aplicação de melhorias, defeitos, proficiências e saberes

22. Ao vincular (herança, slot ou extra) uma Característica, Treinamento ou Talento à ficha, suas
    melhorias, defeitos, proficiências e saberes próprios são aplicados à ficha seguindo exatamente
    a mesma pipeline hoje usada para Raça/Biografia (recálculo integral via a mesma lógica de
    `recomputeProficiencies`/`recomputeKnowledges`, e composição direta — sem seleção condicional —
    para melhorias/defeitos, como já ocorre para Raça; as regras especiais da Biografia — melhoria
    escolhida + melhoria livre — **não** se aplicam a Característica/Treinamento/Talento).
23. Cada item vinculado contribui suas melhorias/defeitos/proficiências/saberes no bucket
    correspondente ao seu próprio tipo (`characteristics`/`trainings`/`talents`), independentemente
    de ter chegado à ficha por herança, slot ou extra (decisão de investigação nº 2).
24. Ao desvincular (remover extra, remover do slot, ou remover a origem de um item herdado) uma
    Característica, Treinamento ou Talento da ficha, melhorias, defeitos, proficiências e saberes
    são recalculados do zero, com o mesmo comportamento hoje usado para Raça/Biografia.
25. A ordem de precedência entre origens para resolução de conflitos de proficiência/saber é:
    Raça → Biografia → (dentro de cada bucket trainings/talents/characteristics: herdados → slot →
    extras, ver decisão de investigação nº 3).

## Comportamento no app-web

- Nova aba de primeiro nível "Habilidades" na página de detalhe da ficha, entre "Estatísticas" e
  "Bônus" (ou após "Bônus" — ordem exata delegada ao planejamento de frontend), usando o mesmo
  padrão de `Tabs`/`SHEET_TABS_SX` já usado hoje.
- Sub-abas "Características", "Treinamentos" e "Talentos" dentro de "Habilidades", replicando o
  padrão de sub-abas de "Bônus" (`activeBonusSubTab`).
- Listagens em grid responsivo de até 4 colunas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, mesmo
  padrão de `SheetSkillsPanel`).
- Botão dashed "próximo slot" seguindo o padrão visual de `SheetDashedFieldButton`, posicionado
  dentro do grid, com o tamanho de uma célula/card.
- Modal(is) de seleção com abas por tipo de entidade quando aplicável, filtros de nome/level/tags
  (mesmos filtros das páginas de listagem de cada entidade), listagem paginada, ação de visualizar
  (reaproveitando o dispatcher `openEntityView`/`useEntityMentionViewStore`) e ação de adicionar
  (desabilitada quando o item já está presente na ficha ou quando a ficha não atende aos requisitos
  do item, exibindo alerta nesse segundo caso).
- Cards herdados: nome, level, tags, indicativo de origem, alerta de requisitos pendentes quando
  aplicável, ação de visualizar — sem ação de remover.
- Cards extras/slot: nome, level, tags, alerta de requisitos pendentes quando aplicável, ação de
  visualizar e ação de remover — sem indicativo de origem.
- Indicativo do level de liberação abaixo de cada slot de Treinamento (vazio ou preenchido).

## Requisitos para o planejamento de backend

1. Suportar a leitura, para uma ficha, das habilidades herdadas de um nível (Raça.characteristics/
   talents; Biografia.additionalAbilities; additionalAbilities de cada Característica/Treinamento/
   Talento atualmente vinculado à ficha), computando essa listagem em tempo de leitura (dado que é
   estado derivado, não persistido — decisão do usuário nº 4).
2. Definir a modelagem de dados para persistir os vínculos explícitos ficha↔Característica/
   Treinamento/Talento (slot de Treinamento com metadado do level de liberação, e extras), sabendo
   que:
   - Um mesmo item não pode ocupar mais de um vínculo explícito nem coexistir com uma presença
     herdada (regra de bloqueio única de presença, item 16/decisão nº 7).
   - Slots de Treinamento precisam manter a associação com "qual level da ficha os liberou" mesmo
     quando vazios (para exibir o indicativo de liberação e para a regra de remoção por redução de
     level).
   - A redução do level da ficha precisa disparar remoção de slots/desvínculo de Treinamentos de
     forma consistente (item 13).
3. Generalizar `recomputeProficiencies`/`recomputeKnowledges`
   (`app-api/src/modules/sheets/sheets.service.ts`) — hoje tipadas para `'race' | 'biography'` — para
   aceitar também `'training' | 'talent' | 'characteristic'` como `ProficiencySource['type']`, e
   estender a montagem de `orderedSources` para incluir, na ordem definida (decisão de investigação
   nº 2/nº 3): Raça, Biografia, e então cada Característica/Treinamento/Talento vinculado (herdado,
   slot ou extra), na ordem herdados → slot → extras dentro de cada bucket.
4. Generalizar a aplicação direta de melhorias/defeitos (hoje feita ad-hoc em `linkRace`) para
   Característica/Treinamento/Talento, sem as regras especiais de Biografia (melhoria escolhida +
   melhoria livre não se aplicam).
5. Implementar a validação de requisitos (`requirements`, level) para uso em dois contextos: (a)
   sinalizar no card se a ficha atende aos requisitos de um item já presente (herdado, slot ou
   extra); (b) desabilitar a adição de um item nos modais de seleção quando a ficha não atende aos
   requisitos — seguindo a semântica definida na decisão de investigação nº 5.
6. Expor `additionalAbilities` no payload de `sheet.biography` (hoje ausente em
   `BiographyOptionResponseDto`) para viabilizar o cálculo de herança a partir da Biografia.
   Confirmar que `sheet.race.characteristics`/`sheet.race.talents` (já presentes hoje no payload,
   ver decisão de investigação nº 1) continuam expostos após qualquer alteração no DTO de resposta
   da ficha.
7. Endpoints necessários para: adicionar/remover item extra (Característica/Treinamento/Talento) na
   ficha; preencher/esvaziar um slot de Treinamento; consultar/computar a listagem consolidada de
   habilidades (herdadas + explícitas) por sub-aba, incluindo o status de atendimento de requisitos
   de cada item.
8. Reaproveitar os endpoints de listagem paginada com filtro por `name`/`level`/`tagIds` já
   existentes para Características, Treinamentos e Talentos para alimentar os modais de seleção —
   não é esperado endpoint de busca dedicado novo além do necessário para a listagem consolidada da
   própria ficha (item 7).
9. Nenhuma regra de permissão/visibilidade além do CRUD/propriedade de ficha já existente (fichas já
   restritas ao usuário dono, com exceção de leitura por usuários não-Google, seguindo o padrão
   atual de `findAccessibleById`/`isRestrictedToOwnSheets`).

## Requisitos para o planejamento de frontend

1. Adicionar a aba "Habilidades" e as três sub-abas na página de detalhe da ficha, seguindo o
   padrão de `Tabs` de dois níveis já usado para "Bônus" (`SHEET_TABS_SX`).
2. Implementar os grids de cards em até 4 colunas (padrão de `SheetSkillsPanel`) para as seis
   listagens (Características herdadas + extras, Treinamentos slots + herdados + extras, Talentos
   herdados + extras).
3. Reaproveitar `SheetDashedFieldButton` (ou uma variante, a confirmar — ver decisão de investigação
   nº 11) posicionado como célula do grid para representar slots vazios e o botão "adicionar extras".
4. Estender o modal de seleção reaproveitável (`EntityReferenceSelectionModal` ou equivalente) para
   suportar filtros de `level` e `tagIds`, além do `name` já suportado, e para permitir sinalizar
   itens com botão de adicionar desabilitado por dois motivos distintos (já presente na ficha /
   requisitos não atendidos), com feedback visual diferenciando os dois casos.
5. Corrigir/estender o tipo `ISheetRace` (`app-web/src/shared/interfaces/Entities/Sheet/index.ts`)
   para declarar `characteristics`/`talents`, hoje ausentes apesar de já virem populados no payload
   (decisão de investigação nº 1), e adicionar os tipos necessários para as novas listagens
   (herança, slots com level de liberação, extras) por sub-aba.
6. Reaproveitar `useEntityMentionViewStore`/`openEntityView` para a ação de visualizar em todos os
   cards novos.
7. Implementar o indicativo textual de origem ("via Raça X") nos cards herdados, e o indicativo do
   level de liberação abaixo de cada slot de Treinamento.
8. Implementar o alerta visual de "requisitos pendentes" nos cards (herdados, slot preenchido ou
   extra) e nos itens do modal de seleção, consumindo o status de atendimento de requisitos exposto
   pelo backend (requisito de backend nº 5).
9. Ao mudar o level da ficha, refletir a atualização de quantidade de slots de Treinamento e o
   eventual desvínculo de Treinamentos removidos (consumindo o resultado já recalculado retornado
   pela API ao salvar o novo level).

## Pontos de atenção

- Itens de `requirements` do tipo Técnica ou Magia são hoje impossíveis de satisfazer (a ficha não
  possui aba/mecanismo de Técnicas/Magias). A decisão adotada (sempre não atendido) deve ser
  revisitada quando essa lacuna for endereçada em demanda futura.
- A ordem de precedência dentro de cada bucket (herdados → slot → extras, decisão de investigação nº
  3) é um default proposto sem precedente direto no código — o planejamento de backend deve validar
  se esse comportamento é o esperado antes de implementar, especialmente para o caso raro de
  conflito de proficiência/saber entre dois itens do mesmo bucket.
- O botão de remover não aparece em cards herdados (decisão de investigação nº 8); caso o produto
  decida futuramente por um comportamento efêmero de remoção, isso deve ser tratado como nova
  demanda, não uma correção desta.
- `EntityReferenceSelectionModal` precisa ser estendido para suportar filtros adicionais
  (`level`, `tagIds`) — ponto de atenção já sinalizado para o planejamento de frontend decidir a
  forma concreta (estender o componente existente vs. criar um modal dedicado).
- A modelagem de persistência dos vínculos explícitos (slots com metadado de level de liberação,
  extras) é uma decisão de arquitetura em aberto, deliberadamente não fechada por este spec —
  cabe ao planejamento de backend.
- Redução de level da ficha e remoção de slots de Treinamento têm efeito colateral de desvincular
  Treinamentos e recalcular melhorias/proficiências/saberes — testar cuidadosamente o caminho de
  redução repetida (ex.: reduzir múltiplos levels de uma vez) durante o planejamento/implementação.

## Fora de escopo

- Qualquer alteração relacionada a "Aprimorado de" (`improvedFrom`/`EntityLinkType.IMPROVED_FROM`),
  incluindo sua eventual remoção futura e qualquer validação de requisitos em cascata via essa
  propriedade — tarefa separada e posterior, por decisão explícita do usuário.
- Suporte a Técnicas e Magias na ficha (aba, herança, slots ou extras) — a ficha não ganha, nesta
  demanda, nenhum mecanismo para "possuir" Técnicas ou Magias; itens de `requirements` desse tipo
  são sempre tratados como não atendidos.
- Herança transitiva (mais de um nível) de Habilidades Adicionais — decisão do usuário nº 2.
- Persistência de exclusão de itens herdados — decisão do usuário nº 4; a remoção de origem
  (desvincular Raça/Biografia/Característica/Treinamento/Talento) é o único mecanismo para um item
  herdado deixar de aparecer.
- Alterações no endpoint global `/search`.
- Qualquer regra de permissão/visibilidade além do já existente para fichas e para o CRUD das
  entidades Característica/Treinamento/Talento/Raça/Biografia.
- Botão de remover em cards herdados (decisão de investigação nº 8 — comportamento efêmero
  alternativo não adotado).