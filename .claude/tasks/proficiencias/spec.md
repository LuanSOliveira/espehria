# Spec: Refatoração de "Proficiência" para feature própria

## Pedido original

Reverter a abordagem anterior (demanda `melhorias-proficiencia`) que tratava Proficiência como
mais um "tipo" de Melhoria/Defeito, e criar Proficiência como uma feature independente:

- Desfazer, via nova migration, a seed que criou o tipo "Proficiência" e suas 20 propriedades
  dentro das tabelas de Melhoria/Defeito (mantendo intocada a migration original, já aplicada
  em ambiente).
- Criar uma nova propriedade "Proficiências" nas mesmas 5 entidades que hoje têm Melhorias/
  Defeitos (Talento, Treinamento, Característica, Biografia e Raça), usando tabelas e modelo de
  dados próprios (não reaproveitando as tabelas de tipo/propriedade de Melhoria/Defeito).
- Adicionar à ficha uma nova aba "Proficiências", somente leitura/automática, sincronizada com
  as entidades vinculadas à ficha, com uma regra de conflito e resolução para propriedades
  duplicadas entre entidades.

## Perguntas e respostas

Esta demanda foi esclarecida em duas rodadas de perguntas e respostas com o usuário. As decisões
consolidadas resultantes de todas as rodadas estão registradas abaixo, organizadas por tema.

### Reversão da abordagem anterior

- P: A migration `1784306290000-SeedImprovementFlawProficiencyType.ts` já foi aplicada em algum
  ambiente? → R: Sim, já foi aplicada em ambiente. Deve ser mantida intocada; a reversão deve ser
  feita por uma nova migration que remova os dados inseridos (não editar/apagar a migration
  original).
- P: A ordem de remoção dos dados na migration de reversão precisa respeitar dependências entre
  tabelas? → R: Sim — remover primeiro as associações no join table
  `improvement_flaw_property_types`, depois as 20 propriedades em
  `improvement_flaw_properties`, e por último o tipo "Proficiência" em
  `improvement_flaw_types`.
- P: Após a reversão, é necessário algum ajuste de frontend para que o tipo "Proficiência" e suas
  propriedades deixem de aparecer no modal de adicionar Melhorias/Defeitos? → R: Não. O modal
  consome as tabelas de tipo/propriedade dinamicamente; a simples remoção dos dados no backend já
  é suficiente para que deixem de aparecer. Nenhuma alteração de frontend é necessária para este
  ponto específico.
- P: O comportamento de `SheetsService.linkBiography`, que hoje aplica automaticamente na ficha as
  melhorias não-Atributo da biografia (tipos "Ataque"/"Teste de Resistência"), deve ser alterado
  em função da remoção do tipo "Proficiência"? → R: Não. Esse método não deve ser alterado; o
  comportamento atual é mantido, assim como a seção "Demais melhorias da biografia" no modal de
  vínculo, que permanece como está.

### Nova feature "Proficiências" nas entidades

- P: Proficiência deve reaproveitar as tabelas de tipo/propriedade de Melhoria/Defeito? → R: Não.
  Proficiência é um conceito independente, com suas próprias tabelas auxiliares.
- P: Quais são as opções de propriedade de proficiência? → R: 20 opções fixas: Acrobatismo,
  Arcanismo, Atletismo, Diplomacia, Dissimulação, Furtividade, Intimidação, Ladroagem,
  Manufatura, Medicina, Natureza, Ocultismo, Performance, Percepção, Religião, Sobrevivência,
  Sociedade, Fortitude, Reflexo, Vontade.
- P: Quais são os níveis de graduação e como comparar magnitude entre eles? → R: 5 graduações,
  em ordem crescente: Destreinado (menor) < Básico < Avançado < Especialista < Lendário (maior).
  É necessário um campo de ordem/nível associado a cada graduação para permitir comparação de
  magnitude, usado na regra de conflito da ficha.
- P: Como a associação entre uma entidade dona e uma proficiência deve ser modelada? → R: Seguindo
  o mesmo padrão polimórfico já usado pela associação de Melhoria/Defeito: colunas de dono
  mutuamente exclusivas (uma por entidade dona possível), com verificação de que exatamente uma
  delas está preenchida.
- P: Pode uma mesma entidade ter mais de uma graduação para a mesma propriedade de proficiência?
  → R: Não. Propriedade é única por entidade — cada entidade só pode ter uma graduação por
  propriedade de proficiência.
- P: Como deve ser a interação de UI para adicionar proficiências às 5 entidades? → R: Um botão
  "Adicionar Proficiências" abre um modal com dois campos de autocomplete: "Propriedade" e
  "Graduação". Cada proficiência adicionada é exibida como um card, seguindo o mesmo padrão
  visual/estrutural dos cards de Melhoria/Defeito, tanto nos formulários de criação/edição quanto
  nas views das 5 entidades. Fora do contexto da ficha, o card mostra apenas propriedade e
  graduação.

### Nova aba "Proficiências" na ficha

- P: Onde a aba deve ficar posicionada e como as proficiências devem ser exibidas? → R: A aba fica
  posicionada imediatamente após a aba "Defeitos". As proficiências vinculadas à ficha são
  exibidas em um grid responsivo de até 3 colunas.
- P: A aba permite adicionar/remover proficiências manualmente? → R: Não. A aba é somente
  leitura/automática, refletindo o que vem das entidades vinculadas à ficha. A única interação
  manual permitida é a resolução de conflito (escolha de propriedade substituta), descrita
  adiante.
- P: Como funciona a sincronização entre entidades vinculadas e a aba de proficiências da ficha?
  → R: Ao vincular uma entidade que possua Proficiências, elas entram na ficha; ao desvincular, as
  proficiências trazidas por ela saem. Atualmente a ficha só permite vincular Raça e Biografia (as
  demais das 5 entidades ainda não são vinculáveis à ficha).
- P: O card de proficiência na ficha precisa indicar de onde ela veio? → R: Sim, o card exibe a
  origem (nome da entidade que trouxe a proficiência), no mesmo espírito do campo de nome de
  origem já usado nos cards de melhoria/defeito da ficha.

### Regra de conflito entre proficiências na ficha e seção "Proficiências Ajustadas"

- P: O que acontece quando duas entidades vinculadas trazem a mesma propriedade de proficiência?
  → R: Prevalece a maior graduação. Cada propriedade tem no máximo uma entrada efetiva na ficha.
- P: O que acontece com a proficiência que chega com graduação menor ou igual à já existente para
  a mesma propriedade? → R: Ela é considerada inválida e vai para uma seção separada chamada
  "Proficiências Ajustadas", em vez de ser aplicada diretamente na aba principal.
- P: O que o usuário pode fazer com um item na seção "Proficiências Ajustadas"? → R: Escolher uma
  nova propriedade como substituta para aquele item. A graduação desse item fica fixa no valor da
  graduação da proficiência inválida original — não é editável pelo usuário.
- P: Ao escolher a propriedade substituta, quais propriedades devem aparecer como opção no
  seletor? → R: Devem ser escondidas as propriedades já aplicadas na ficha em qualquer graduação
  — ou seja, cada propriedade permanece única na ficha como um todo. Se a ficha já tem, por
  exemplo, Furtividade em qualquer graduação, Furtividade não aparece como opção de substituta.
- P: O que o card de "Proficiência Ajustada" deve exibir? → R: O valor real original (propriedade
  e graduação vindos da entidade de origem), a entidade que o forneceu, e o valor ajustado
  escolhido pelo usuário para evitar o conflito.
- P: Um ajuste ainda não resolvido (sem substituta escolhida) já conta como ocupando espaço na
  ficha para fins de novos conflitos? → R: Sim. Mesmo antes de o usuário escolher a propriedade
  substituta, o ajuste pendente já ocupa a propriedade/graduação original para efeito de novos
  conflitos e para o filtro de opções do seletor, podendo inclusive gerar novos ajustes ao
  vincular outras entidades posteriormente.
- P: O que acontece quando a proficiência que chega tem graduação maior do que a já existente para
  a mesma propriedade? → R: Ela vence e passa a ser a entrada válida. A entrada anterior, de
  graduação menor, é simplesmente descartada, sem qualquer compensação — não vira uma
  "Proficiência Ajustada". O usuário está ciente e aceita que o resultado final da ficha pode
  variar conforme a ordem em que as entidades são vinculadas; não deve ser implementada nenhuma
  compensação ou normalização de ordem para este caso.
- P: O que acontece com as proficiências e ajustes de uma entidade quando ela é desvinculada da
  ficha? → R: Tanto a proficiência original quanto qualquer ajuste feito por causa dela somem da
  ficha.
- P: O que acontece com os conflitos e ajustes já resolvidos quando uma entidade vinculada é
  trocada por outra (ex.: trocar a Biografia vinculada)? → R: Toda troca de entidade recalcula
  conflitos e ajustes integralmente, do zero. Nenhuma escolha de substituta feita anteriormente é
  preservada automaticamente; se houver conflito após a troca, o usuário precisa resolvê-lo
  novamente.

## Escopo confirmado

**Parte A — Reversão da abordagem anterior.** É necessária uma nova migration (mantendo a
original intocada) que remova, na ordem correta — associações do join table de propriedade/tipo,
depois as 20 propriedades, depois o tipo "Proficiência" — os dados de seed relativos ao tipo
"Proficiência" dentro das tabelas de Melhoria/Defeito. Não é necessária nenhuma alteração de
frontend para que esses dados deixem de aparecer no modal de adicionar Melhorias/Defeitos, pois o
modal já consome essas tabelas dinamicamente. O comportamento de aplicação automática de melhorias
não-Atributo da biografia à ficha (tipos "Ataque"/"Teste de Resistência") permanece inalterado, e a
seção "Demais melhorias da biografia" no modal de vínculo de biografia à ficha permanece como está.

**Parte B — Nova feature "Proficiências".** Proficiência passa a ser um conceito de dados
totalmente independente das tabelas de tipo/propriedade de Melhoria/Defeito, com suas próprias
tabelas auxiliares: uma para as 20 propriedades fixas de proficiência (Acrobatismo, Arcanismo,
Atletismo, Diplomacia, Dissimulação, Furtividade, Intimidação, Ladroagem, Manufatura, Medicina,
Natureza, Ocultismo, Performance, Percepção, Religião, Sobrevivência, Sociedade, Fortitude,
Reflexo, Vontade) e outra para as 5 graduações fixas (Destreinado < Básico < Avançado <
Especialista < Lendário), cada graduação com um valor de ordem/nível que permite comparar
magnitude entre elas. A associação entre uma entidade dona e um par propriedade+graduação segue o
mesmo padrão polimórfico já usado pela associação de Melhoria/Defeito, com colunas de dono
mutuamente exclusivas (exatamente uma preenchida) cobrindo as 5 entidades: Talento, Treinamento,
Característica, Biografia e Raça. Cada entidade só pode ter uma graduação por propriedade de
proficiência (propriedade única por entidade). Na UI, um botão "Adicionar Proficiências" abre um
modal com dois autocompletes ("Propriedade" e "Graduação"); cada proficiência adicionada aparece
como um card no mesmo padrão visual/estrutural dos cards de Melhoria/Defeito, nos formulários de
criação/edição e nas views das 5 entidades, exibindo apenas propriedade e graduação fora do
contexto da ficha.

**Parte C — Aba "Proficiências" na ficha.** Uma nova aba, posicionada imediatamente após a aba
"Defeitos", exibe em um grid responsivo de até 3 colunas as proficiências vinculadas à ficha. A
aba é somente leitura/automática: as proficiências entram e saem da ficha conforme entidades são
vinculadas/desvinculadas (hoje isso só ocorre via Raça e Biografia, únicas entidades vinculáveis à
ficha entre as 5). Cada card de proficiência na ficha exibe também a origem (nome da entidade que
a trouxe). A única interação manual permitida nesta aba é a resolução de conflitos, descrita a
seguir.

Regra de conflito: quando entidades vinculadas trazem a mesma propriedade de proficiência,
prevalece sempre a maior graduação, com no máximo uma entrada efetiva por propriedade na aba
principal. Uma proficiência recebida com graduação menor ou igual à já existente para a mesma
propriedade é considerada inválida e vai para uma seção separada, "Proficiências Ajustadas", em
vez de ocupar a aba principal. Nessa seção, o usuário pode escolher uma propriedade substituta
para o item; a graduação do item permanece fixa no valor original da proficiência inválida e não é
editável. O seletor de propriedade substituta esconde qualquer propriedade já aplicada na ficha em
qualquer graduação (unicidade de propriedade vale para a ficha como um todo). O card de
"Proficiência Ajustada" exibe: a propriedade e graduação originais vindas da entidade, a entidade
de origem, e o valor ajustado (propriedade substituta) escolhido para evitar o conflito. Um ajuste
ainda pendente (sem substituta escolhida) já ocupa a propriedade/graduação original para fins de
novos conflitos e do filtro de opções do seletor, podendo gerar novos ajustes com entidades
vinculadas posteriormente. Quando a proficiência recebida tem graduação maior do que a já
existente para a mesma propriedade, ela vence e a entrada anterior de graduação menor é descartada
sem nenhuma compensação e sem virar "Proficiência Ajustada" — é aceito que o resultado final possa
variar conforme a ordem de vínculo das entidades, e nenhuma compensação ou normalização de ordem
deve ser implementada para esse caso. Ao desvincular a entidade de origem, tanto a proficiência
original quanto qualquer ajuste dela decorrente somem da ficha. Ao trocar uma entidade vinculada
por outra, os conflitos e ajustes são recalculados integralmente do zero, sem preservar escolhas
de substituta feitas anteriormente.

### Referências de código levantadas (para os agentes de planejamento)

Backend:
- `ImprovementFlaw` (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`,
  tabela `improvement_flaws`) é o padrão polimórfico de referência: colunas de dono mutuamente
  exclusivas `owner_talent_id`, `owner_training_id`, `owner_characteristic_id`,
  `owner_biography_id`, `owner_race_id`, com `@Check('CK_improvement_flaws_owner_exclusive',
  'num_nonnulls(...) = 1')` e `@Unique` sobre categoria + donos + tipo + propriedade.
- Enum `ImprovementFlawOwnerType` em
  `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`.
- `ImprovementFlawsService`
  (`app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`) centraliza
  `ownerColumnFor()`, `validateAndResolveItems()`, `validateLists()`, `replaceItems()` e
  `loadItemsFor()`.
- Módulos auxiliares somente-leitura de referência:
  `app-api/src/modules/improvement-flaw-types/` e
  `app-api/src/modules/improvement-flaw-properties/`.
- `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`) vincula hoje apenas `race_id` e
  `biography_id`, com snapshots jsonb `melhorias` e `defeitos` do tipo
  `SheetImprovementFlawSnapshot`
  (`app-api/src/modules/sheets/interfaces/sheet-improvement-flaw-snapshot.interface.ts`), chaves
  `race`, `biography`, `trainings`, `talents`, `characteristics`, cada uma array de `{ id, value,
  type: {id,name}, property: {id,name}, sourceName }`.
- `SheetsService.linkRace`/`unlinkRace` e `linkBiography`/`unlinkBiography`
  (`app-api/src/modules/sheets/sheets.service.ts`) implementam o padrão de sincronização por
  snapshot.
- Migration a reverter (mantida intocada):
  `app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts`.

Frontend:
- Componentes compartilhados de Melhoria/Defeito, a espelhar visualmente:
  `app-web/src/shared/components/ImprovementDefectAddModal/`,
  `ImprovementDefectListField/`, `ImprovementDefectCard/`.
- Formulários que consomem hoje Melhoria/Defeito: `racas/components/RaceCreateForm`,
  `talentos/components/TalentCreateForm`, `treinamentos/components/TrainingCreateForm`,
  `caracteristicas/components/CharacteristicCreateForm`,
  `biografias/components/BiographyCreateForm`. Views: `RaceView`, `TalentView`, `TrainingView`,
  `CharacteristicView`, `BiographyView`.
- Ficha: `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — `type SheetDetailTab =
  'estatisticas' | 'melhorias' | 'defeitos'` (linha 55) e abas MUI nas linhas ~510-540;
  `SheetImprovementDefectCategoryAccordions` renderiza melhorias/defeitos.
- Hooks de tabela auxiliar somente-leitura, a espelhar:
  `app-web/src/hooks/Queries/EntityQueries/useImprovementDefectTypesQuery/` e
  `useImprovementDefectPropertiesQuery/`.

Esta demanda substitui parcialmente a demanda anterior registrada em
`.claude/tasks/melhorias-proficiencia/`.