# Spec: Ficha — Level, Raça (nova dinâmica), Biografia, Estatísticas/Melhorias/Defeitos, Raça com melhorias/defeitos próprios

## Pedido original

Evoluir a página de detalhe da ficha (`app-web/src/app/(authorized)/fichas/[id]/page.tsx`) e o backend
relacionado (sheets, improvement-flaws, races), conforme os wireframes `app-web/public/template-melhorias.png`
e `app-web/public/template-estatisticas.png`, contemplando:

1. Renomear o label do campo de nível do cabeçalho da ficha de "Nível" para "Level", estilizado como
   card conforme o template.
2. Nova dinâmica de edição/remoção para o campo "Raça" da ficha (hoje só permite trocar via autocomplete,
   sem cancelar nem remover).
3. Nova propriedade "Biografia" na ficha, com fluxo próprio via modal: seleção da biografia, escolha
   obrigatória de uma melhoria de atributo da biografia (via checkbox de seleção única) e criação de uma
   melhoria de atributo livre (formulário inline com tipo/valor travados).
4. Novas propriedades `melhorias` e `defeitos` na entidade Ficha (app-api), estruturadas por categoria
   de origem (`race`, `biography`, `trainings`, `talents`, `characteristics`), preenchidas/atualizadas
   automaticamente ao vincular/desvincular Raça e Biografia.
5. Nova seção de abas na ficha: "Estatísticas" (atributos calculados a partir das melhorias/defeitos),
   "Melhorias" e "Defeitos" (accordions por categoria de origem).
6. Raça passa a ter melhorias e defeitos próprios, cadastráveis (não derivados de characteristics/talents),
   exigindo alteração de schema em `improvement_flaws` (novo owner) e nova seção de cadastro na página de Raça.

## Perguntas e respostas

- P: A Raça deve ter melhorias/defeitos próprios cadastráveis, ou eles continuam sendo derivados das
  characteristics/talents vinculados à raça? → R: Raça tem melhorias e defeitos PRÓPRIOS, cadastráveis
  diretamente na Raça — não derivados de characteristics/talents.
- P: Como persistir `melhorias`/`defeitos` na Ficha — por referência aos registros reais de
  `improvement_flaws` ou como snapshot? → R: Snapshot em coluna `jsonb`, congelando os dados da
  melhoria/defeito no momento do vínculo. Deve acomodar tanto registros reais (Raça, melhoria selecionada
  da Biografia) quanto a melhoria livre criada ad-hoc no modal de Biografia.
- P: A melhoria de atributo "livre" criada no modal de Biografia cria um registro real/global em
  `improvement_flaws`? → R: Não. Existe apenas dentro do snapshot da ficha, em `melhorias.biography`.
- P: As chaves do JSON de `melhorias`/`defeitos` devem ser em português ou inglês? → R: Em INGLÊS
  (`race`, `biography`, `trainings`, `talents`, `characteristics`). A tradução para pt-BR (Raça,
  Biografia, Treinamentos, Talentos, Características) fica restrita aos labels do frontend.
- P: O vínculo/desvínculo de Raça e Biografia deve usar o autosave genérico de campo simples
  (`PUT /sheets/:id`) ou endpoints dedicados? → R: Endpoints DEDICADOS e atômicos, separados do autosave
  de campo simples: `PUT/DELETE /sheets/:id/biography` e, por consistência, `PUT/DELETE /sheets/:id/race`.
  Ambos sincronizam `melhorias`/`defeitos` da ficha ao vincular/desvincular.
- P: O fluxo de "editar" Raça/Biografia deve permitir cancelar sem alterar, e deve existir ação de
  remover? → R: Sim para ambos. "Editar" abre autocomplete/modal PRÉ-PREENCHIDO com a seleção atual e
  com opção de CANCELAR (reverte sem alterar). Existe também ação de REMOVER, que desvincula e limpa as
  melhorias/defeitos correspondentes.
- P: O valor base dos atributos (10) é editável pelo usuário ou fixo pelo sistema? → R: Fixo em 10 pelo
  sistema, não editável, não persistido na ficha. Só varia pela soma de melhorias / subtração de defeitos.
- P: Como o valor final de cada atributo é calculado a partir das melhorias/defeitos? → R: Soma as
  melhorias de tipo "Atributo" cuja Propriedade corresponde ao atributo, e SUBTRAI os defeitos de tipo
  "Atributo" com a mesma correspondência, de QUALQUER categoria (`race`, `biography`, `trainings`,
  `talents`, `characteristics`) do snapshot da ficha.
- P: No modal de Biografia, a lista de melhorias exibidas para seleção deve incluir todos os tipos ou
  somente "Atributo"? → R: Somente as melhorias de tipo "Atributo" da biografia selecionada.
- P: A aba selecionada (Estatísticas/Melhorias/Defeitos) deve persistir em query param/URL? → R: Não.
  É estado local do componente, sem persistência em URL.
- P: Ao trocar a raça vinculada por outra, `melhorias.race`/`defeitos.race` acumulam ou substituem os
  anteriores? → R: Substituem totalmente (não acumula).
- P: O modal aberto pelo botão de "Atributos" (no quadro de Estatísticas) permite remover
  melhorias/defeitos, ou é somente leitura? → R: Somente leitura, sem ações de remoção; apenas lista
  consolidada agrupada por categoria de origem.

## Escopo confirmado

### Layout de referência (wireframes já validados)

Cabeçalho da ficha: botão "Voltar" no topo; avatar à esquerda; nome do personagem e "Campanha / NOME DA
CAMPANHA" ao centro; card com borda no canto superior direito com label "Level" (faixa de fundo cinza) e
valor abaixo. Logo abaixo, dois campos lado a lado, "Raça" e "Biografia", cada um como retângulo de borda
tracejada com "+" centralizado quando vazio. Abaixo, um controle de abas.

- Aba "Estatísticas": quadro com header "ATRIBUTOS" e um botão circular no canto superior direito, na
  mesma linha do título. Dentro, grid de 2 colunas com 6 cards (Força, Destreza, Constituição,
  Inteligência, Sabedoria, Carisma); cada card tem título em faixa cinza, valor abaixo, e um círculo
  sobreposto à direita exibindo o modificador.
- Aba "Melhorias" (e, igualmente, "Defeitos"): 5 accordions full-width empilhados, com os títulos RAÇA,
  BIOGRAFIA, TREINAMENTOS, TALENTOS, CARACTERÍSTICAS, cada um com seta indicando expansão/retração.

### Escopo app-web

1. **Campo "Level" no cabeçalho**: renomear label de "Nível" para "Level"; estilizar como card/quadro
   conforme wireframe (faixa de título em cinza + valor abaixo), reaproveitando o design system existente
   (skill `web-cores` e constantes de estilo já usadas na página).

2. **Campo "Raça" — nova dinâmica de edição/remoção**:
   - Vazio: botão de borda tracejada com "+" centralizado; ao clicar, abre o autocomplete (comportamento
     atual mantido).
   - Preenchido: exibe o card de raça selecionada (como hoje), com ações "visualizar" (mantida) e
     "editar".
   - "Editar" transforma o card em autocomplete PRÉ-PREENCHIDO com a raça atualmente vinculada, e deve
     existir uma ação de CANCELAR que reverte para o card, sem alterar a raça vinculada (funcionalidade
     hoje inexistente).
   - Deve existir ação de REMOVER que desvincula a raça da ficha e limpa `melhorias.race` e
     `defeitos.race` da ficha.

3. **Nova propriedade "Biografia" no frontend da ficha**: campo ao lado de "Raça", mesmo layout dashed+
   quando vazio. Diferente de Raça, ao clicar NÃO abre autocomplete inline — abre um MODAL contendo:
   - Autocomplete para selecionar a Biografia; ao selecionar, vira card com informações da biografia
     (com ações "visualizar" e "editar", mesmo padrão do card de Raça).
   - Texto "Escolha uma das melhorias de atributos da biografia" seguido das melhorias da biografia
     selecionada, filtradas SOMENTE pelo tipo "Atributo", cada uma em card com opção de "visualizar" e um
     checkbox ao lado. A seleção é ÚNICA (apenas uma melhoria pode estar marcada) e é obrigatório marcar
     ao menos uma para permitir o submit do modal.
   - Texto "Escolha uma melhoria de atributo livre" seguido de um formulário com os mesmos campos do
     modal "Adicionar Melhorias" já existente (`app-web/src/shared/components/ImprovementDefectAddModal/index.tsx`),
     porém dispostos lado a lado (inline) em vez de empilhados. O campo "Tipo" fica fixo/travado em
     "Atributo" (não editável); o campo "Valor" fica fixo/travado em "2" (não editável); apenas o campo
     "Propriedade" é editável pelo usuário.
   - Botão "Adicionar Biografia": habilitado somente quando há biografia selecionada + uma melhoria de
     atributo marcada + formulário de melhoria livre preenchido (propriedade escolhida). Ao confirmar,
     atribui a biografia à ficha e fecha o modal, passando a exibir o card de Biografia ao lado do card de
     Raça (com ações visualizar/editar/remover, no mesmo padrão do card de Raça).
   - "Editar" no card de Biografia reabre o MESMO modal completo, PRÉ-PREENCHIDO com a biografia atual, a
     melhoria de atributo previamente selecionada e os dados da melhoria livre previamente criada.
   - Deve existir ação de REMOVER no card de Biografia que desvincula a biografia da ficha e limpa
     `melhorias.biography` e `defeitos.biography`.
   - IMPORTANTE: todos os inputs deste modal seguem o padrão visual GERAL do sistema (design system
     padrão de formulários), e NÃO o estilo específico já usado nos campos de Raça/Biografia na página de
     ficha (Autocomplete `variant="standard"` com cores gold/brown custom).

4. **Nova seção de abas na página de ficha, abaixo dos campos Raça/Biografia**: "Estatísticas",
   "Melhorias" e "Defeitos", nessa ordem. A aba selecionada é estado local do componente da página, sem
   persistência em query param/URL.
   - **Aba Estatísticas**: quadro "ATRIBUTOS" com 6 cards (Força, Destreza, Constituição, Inteligência,
     Sabedoria, Carisma). Cada card exibe o valor final do atributo (calculado conforme regra de negócio
     descrita no escopo app-api abaixo) e, em círculo sobreposto, o modificador correspondente. Um botão
     no canto superior direito do quadro, na mesma linha do título "ATRIBUTOS", abre um modal SOMENTE
     LEITURA (sem nenhuma ação de remoção) listando as melhorias e defeitos de tipo "Atributo" da ficha,
     separados/agrupados por categoria de origem (Raça, Biografia, Treinamentos, Talentos,
     Características).
   - **Aba Melhorias**: um accordion por categoria de `melhorias` da ficha, com labels em pt-BR (Raça,
     Biografia, Treinamentos, Talentos, Características). Ao expandir, mostra um card por melhoria
     daquela categoria, indicando qual entidade concedeu aquela melhoria (por exemplo: "Concedida por:
     <nome da raça ou biografia vinculada>").
   - **Aba Defeitos**: comportamento EXATAMENTE análogo ao da aba Melhorias (mesma estrutura de
     accordions por categoria e mesmo padrão de card indicando a origem), porém exibindo os `defeitos` da
     ficha.

5. **Raça — cadastro de melhorias e defeitos próprios (frontend)**: nova seção/tela de cadastro de
   melhorias e defeitos na página de Raça, seguindo o mesmo padrão do modal "Adicionar Melhorias" já
   usado em Biografia/Treinamento/Talento/Característica, contemplando tanto `category = improvement`
   quanto `category = flaw`.

### Escopo app-api

1. **Entidade Sheet (`app-api/src/modules/sheets/entities/sheet.entity.ts`)**: adicionar propriedade de
   Biografia vinculada à ficha (relação nullable, análoga à relação atual com Raça) e duas colunas
   `jsonb` irmãs — `melhorias` e `defeitos` — cada uma com a MESMA estrutura de listas nas chaves
   `race`, `biography`, `trainings`, `talents`, `characteristics` (chaves em inglês). Por ora, apenas
   `race` e `biography` são efetivamente preenchidas; `trainings`, `talents` e `characteristics`
   permanecem como estrutura vazia, pronta para uso futuro.
   - Cada entrada armazenada em `melhorias`/`defeitos` é um SNAPSHOT (congelamento dos dados da
     melhoria/defeito no momento do vínculo) — não uma referência viva ao registro de `improvement_flaws`.
     A estrutura do snapshot deve acomodar tanto melhorias/defeitos vindos de um registro real (ex.: os da
     Raça vinculada, ou a melhoria selecionada da Biografia) quanto a melhoria de atributo "livre" criada
     ad-hoc no modal de Biografia (que não corresponde a nenhum registro real em `improvement_flaws`).

2. **Regras de sincronização de `melhorias`/`defeitos` da ficha**:
   - Ao vincular uma Raça à ficha: preencher `melhorias.race` com o snapshot das melhorias PRÓPRIAS
     daquela raça, e `defeitos.race` com o snapshot dos defeitos PRÓPRIOS daquela raça.
   - Ao trocar a raça vinculada por outra: `melhorias.race` e `defeitos.race` são TOTALMENTE
     SUBSTITUÍDOS pelos snapshots da nova raça (não acumula com os anteriores).
   - Ao desvincular/remover a Raça da ficha: remover as entradas correspondentes de `melhorias.race` e
     `defeitos.race` (esvaziar essas chaves).
   - Ao vincular uma Biografia à ficha: preencher `melhorias.biography` APENAS com o snapshot da melhoria
     de atributo selecionada no checkbox do modal MAIS o snapshot da melhoria livre criada no formulário
     inline do mesmo modal — diferente da Raça, não é preenchido com todas as melhorias da biografia.
     `defeitos.biography` não é alimentado por este fluxo (o modal de Biografia não coleta defeitos).
   - Ao desvincular/remover a Biografia da ficha: remover as entradas correspondentes de
     `melhorias.biography` (e `defeitos.biography`, se existente).

3. **Endpoints dedicados para os vínculos** (separados do autosave de campo simples via
   `PUT /sheets/:id`, que continua tratando os demais campos como hoje):
   - `PUT /sheets/:id/race` e `DELETE /sheets/:id/race` — vincula/desvincula a Raça da ficha, aplicando as
     regras de sincronização de `melhorias.race`/`defeitos.race` descritas acima.
   - `PUT /sheets/:id/biography` e `DELETE /sheets/:id/biography` — vincula/desvincula a Biografia da
     ficha, recebendo também a melhoria de atributo selecionada (referência a um `improvement_flaw` real
     da biografia) e os dados da melhoria de atributo livre (propriedade escolhida; tipo e valor fixos em
     "Atributo" e "2" respectivamente), aplicando as regras de sincronização de
     `melhorias.biography`/`defeitos.biography` descritas acima.
   - Ambos os endpoints devem preservar a restrição de acesso já existente em `SheetsService`
     (`isRestrictedToOwnSheets` — usuários com `provider === AuthProvider.GOOGLE` só acessam as próprias
     fichas).

4. **Cálculo dos atributos (consumido pela aba Estatísticas do frontend)**: valor base de cada atributo é
   fixo em 10, definido pelo sistema, não editável pelo usuário e não persistido na ficha. O valor final
   de cada atributo é obtido somando as melhorias de tipo "Atributo" e subtraindo os defeitos de tipo
   "Atributo" presentes em QUALQUER categoria de `melhorias`/`defeitos` da ficha (`race`, `biography`,
   `trainings`, `talents`, `characteristics`) cuja "Propriedade" corresponda ao atributo em questão. O
   modificador exibido em cada card é `floor((valor_do_atributo - 10) / 2)`.

5. **Entidade ImprovementFlaw (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`)**:
   - Adicionar novo owner `owner_race_id` (FK nullable para `Race`, mesmo padrão de `onDelete: 'CASCADE'`
     usado pelos demais owners), e o novo valor correspondente no enum `ImprovementFlawOwnerType`
     (atualmente `talent | training | characteristic | biography`; passa a incluir `race`).
   - Atualizar o CHECK constraint `CK_improvement_flaws_owner_exclusive`
     (`num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id) = 1`)
     para incluir `owner_race_id` na contagem de mutuamente exclusivos.
   - Atualizar o índice `@Unique(['category','ownerTalent','ownerTraining','ownerCharacteristic','ownerBiography','type','property'])`
     para contemplar o novo owner `ownerRace`.
   - Deve ser feito via migration própria (não `synchronize`).

6. **Entidade Race (`app-api/src/modules/races/entities/race.entity.ts`)** e módulo de races: passam a
   suportar cadastro de melhorias e defeitos próprios (registros reais em `improvement_flaws` com
   `owner_race_id` preenchido), contemplando tanto `category = improvement` quanto `category = flaw`,
   seguindo o mesmo padrão já usado para Talento, Treinamento, Característica e Biografia.

### Contexto técnico relevante (não normativo, apenas referência para as próximas etapas)

- `app-api/src/modules/sheets/sheets.service.ts`: hoje `update()` trata `raceId` via `findRaceById`
  (carrega relations `category`, `tags`, `characteristics: { tags }`, `talents: { tags }`);
  `findAccessibleById` carrega as mesmas relations. Restrição de acesso via `isRestrictedToOwnSheets`.
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx`: página client-side; hidrata estado local do sheet;
  usa `useFieldAutosave` (debounce) + `usePutEntity` separado por campo (`name`, `level`, `campaignId`,
  `raceId`, `referenceImage`). Componentes em `[id]/components/`: SheetPortraitImage,
  SheetImageEditModal, SheetNameField, SheetLevelField, SheetCampaignField, SheetRaceField,
  SheetRaceCard. Hook em `[id]/hooks/useFieldAutosave`.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`: estado `isEditing`;
  `showAutocomplete = value === null || isEditing`; Autocomplete MUI `variant="standard"` com estilos
  custom (goldDark/gold/textBrownDark); quando não editando renderiza `SheetRaceCard` com `onView`
  (ViewModal + `RaceView`) e `onEdit`. Hoje não há cancelamento nem remoção.
- Componentes de melhoria reutilizáveis existentes: `app-web/src/shared/components/ImprovementDefectAddModal/`,
  `ImprovementDefectCard/`, `ImprovementDefectListField/`; schema
  `app-web/src/shared/formSchemas/ImprovementDefectFormSchema/`; hooks
  `useImprovementDefectTypesQuery`, `useImprovementDefectPropertiesQuery`; interfaces
  `ImprovementDefectItem`, `ImprovementDefectType`, `ImprovementDefectProperty`. Consumidos por
  BiographyCreateForm, CharacteristicCreateForm, TrainingCreateForm, TalentCreateForm.
- Tasks anteriores úteis para contexto: `.claude/tasks/fichas/`, `.claude/tasks/biografias/`,
  `.claude/tasks/melhorias-defeitos/`, `.claude/tasks/melhorias-tipo-atributo/`,
  `.claude/tasks/racas-caracteristicas-talentos/`, `.claude/tasks/ficha-raca-card-abrir-ficha/`.
- Skills relevantes para o frontend: `web-componentes`, `web-form-cadastro`, `web-form-schema`,
  `web-integracao-api`, `web-cores`, `web-icones`. Para o backend: `api-modulo-crud`, `api-migration`.
