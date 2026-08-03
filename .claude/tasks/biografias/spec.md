# Spec: Biografias

## Pedido original

Implementar funcionalidade completa (app-api + app-web) para a entidade "biografias"
(código: `Biography`).

Página (app-web):
- Nova página "Biografias", posicionada na seção "JOGO" do menu de navegação (Sidebar).
- Listagem de biografias com filtro por nome.
- Ações por item: visualizar, editar e deletar.

Entidade Biography:
- `imageReference` — referência de imagem (URL). Opcional.
- `name` — texto, obrigatório e único no banco.
- `description` — rich text (mesmo padrão de Treinamentos, HTML). Opcional.
- `tags` — input padrão de tags já existente. Opcional.
- `improvements` — seção "Melhorias".
- `additionalAbilities` — seção "Habilidades Adicionais".

Modal de visualização:
- Imagem em formato quadrado.
- Ao lado da imagem: nome; abaixo do nome, as tags; abaixo das tags, um quadro/bloco
  com a descrição.
- Abaixo dessa seção: seção "Melhorias".
- Abaixo de Melhorias: seção "Habilidades Adicionais".

Demais requisitos:
- CRUD completo em app-api (entidade, migration, DTOs, controller, service, Swagger)
  e app-web (listagem com filtro, modal criar/editar, modal de visualização, exclusão).
- Search global (`search.controller` no app-api) deve incluir Biography nos resultados;
  o consumo no app-web deve exibir corretamente esse novo tipo.
- Permissões: no app-api usar o `GoogleAccessGuard` conforme padrão das demais entidades
  com CRUD completo; no app-web ocultar criar/editar/excluir para usuários Google via
  `useIsGoogleUser`, deixando apenas visualizar.

## Perguntas e respostas

Todas as ambiguidades identificadas inicialmente foram esclarecidas e fechadas
diretamente pelo usuário, sem necessidade de nova rodada de perguntas. As decisões
recebidas estão registradas abaixo, literalmente como fornecidas:

- P: Biografia terá seção "Defeitos" além de "Melhorias"? → R: Não. Biografia terá
  APENAS a seção "Melhorias" (`improvements`), usando o mesmo padrão de Treinamentos
  (`ImprovementFlawItemInputDto` com value/type/property, entidade relacionada de
  improvement-flaws). Não haverá seção "Defeitos"/`flaws`. Consequentemente, a
  validação de exclusividade Melhorias×Defeitos existente em Treinamentos não se
  aplica; mantém-se apenas a validação de não repetir a mesma combinação de
  Tipo+Propriedade dentro da própria lista de Melhorias, além da validação de
  compatibilidade Tipo×Propriedade.

- P: Como funciona "Habilidades Adicionais" em Biografia? → R: Funciona exatamente
  como em Treinamentos — lista de referências a entidades já cadastradas
  (Treinamentos, Talentos, Características, Técnicas ou Magias), selecionadas via o
  buscador com abas (`EntityReferenceSelectionModal`), usando
  `EntityReferenceInputDto` / entity-links. Não é texto livre.

- P: Nome da propriedade é `additionalAbilities` ou `additionalSkills`? → R:
  `additionalAbilities`, idêntico a Treinamentos.

- P: Biografia terá `improvedFrom` e/ou `requirements` como em Treinamentos? → R:
  Não. Biografia não terá `improvedFrom` nem `requirements`. Apenas
  `additionalAbilities`. Não existe a regra de exclusividade entre três listas que há
  em Treinamentos; apenas a validação de não referenciar a si mesma e não conter
  duplicatas dentro da própria lista.

- P: Como validar/armazenar `imageReference`? → R: Validar como URL (`@IsUrl` na API
  e validação equivalente no zod do web), consistente com o padrão de Divindades
  (`referenceImage`) / Criaturas e Raças (`referenceImageUrl`). Armazenado como texto
  no banco, opcional.

- P: Colunas e filtro da listagem? → R: Deve ter coluna de miniatura da imagem como
  primeira coluna (padrão de Divindades), seguida de Nome, Tags e Ações. Filtro
  apenas por nome, ordenação padrão conforme o padrão do projeto.

## Escopo confirmado

### Contexto e objetivo

Adicionar ao domínio de jogo uma nova entidade de conteúdo, "Biografia", cobrindo
tanto o backend (app-api) quanto o frontend (app-web), com CRUD completo, listagem
filtrável, modal de visualização, inclusão no mecanismo de busca/menção global e
respeito às regras de permissão já aplicadas às demais entidades de conteúdo do jogo.

### Escopo

A demanda afeta os dois aplicativos do monorepo:
- `app-api`: nova entidade, migration, DTOs de criação/atualização/resposta/listagem,
  controller, service, documentação Swagger, extensão do módulo de busca
  (`search`) para incluir Biography nos resultados, e reuso dos mecanismos já
  existentes de referências entre entidades (para Habilidades Adicionais) e de
  melhorias/defeitos (para Melhorias), estendidos para reconhecer Biografia como
  proprietária desses vínculos.
- `app-web`: nova rota/página de listagem, componente de listagem com filtro por
  nome, modal de criação/edição, modal de visualização, exclusão com confirmação
  (padrão já usado nas demais entidades), entrada no menu lateral (Sidebar, seção
  "JOGO"), e ajustes nos pontos de consumo do resultado de busca global (rótulo,
  URL de detalhe e view de menção) para reconhecer o novo tipo "biography".

### Definição da entidade Biography

Campos:
- `name`: texto, obrigatório, único no banco (índice único), consistente com o
  padrão de unicidade de nome usado em Treinamentos e Divindades.
- `description`: rich text em formato HTML (mesmo padrão de campo de descrição de
  Treinamentos/Divindades), opcional, texto livre longo.
- `imageReference`: URL de imagem de referência, opcional, armazenada como texto.
  Validada como URL tanto na API (equivalente ao `@IsUrl` já usado para
  `referenceImage` de Divindades) quanto no formulário web (validação zod
  equivalente). Nome de propriedade fixado literalmente como `imageReference`
  (não `referenceImage` nem `referenceImageUrl`).
- `tags`: relação muitos-para-muitos com a entidade Tag já existente no projeto,
  opcional (lista pode ser vazia), seguindo o mesmo padrão de associação de tags
  usado em Treinamentos/Divindades (tabela de junção dedicada).
- `improvements`: lista de itens de "Melhoria", cada item com um valor numérico
  inteiro (mínimo 1), um Tipo e uma Propriedade (referenciando as entidades já
  existentes de tipos/propriedades de melhoria-defeito), reaproveitando
  integralmente o mecanismo já usado por Treinamentos para a lista `improvements`.
  Biografia não possui lista de Defeitos.
- `additionalAbilities`: lista de referências a entidades já cadastradas dos tipos
  Treinamento, Talento, Característica, Técnica ou Magia, reaproveitando
  integralmente o mecanismo já usado por Treinamentos para a lista
  `additionalAbilities` (seleção via buscador com abas). Biografia não possui as
  listas "Aprimorado de" nem "Requisitos".

Campos herdados da base padrão de entidades do projeto (id UUID, createdAt,
updatedAt) se aplicam normalmente.

### Regras de validação

API (class-validator, seguindo o padrão observado em Treinamentos/Divindades):
- `name`: obrigatório, string não vazia; unicidade validada no service (conflito
  retorna erro de conflito com mensagem em pt-BR), tanto na criação quanto na
  atualização (quando o nome é alterado).
- `description`: opcional, string (HTML).
- `imageReference`: opcional, deve ser uma URL válida quando informado.
- `tagIds`: opcional, array de UUIDs válidos; se algum id não corresponder a uma
  tag existente, retorna erro de "não encontrado".
- `improvements`: opcional, array de itens `{ value, type, property }`, onde
  `value` é inteiro ≥ 1 e `type`/`property` são UUIDs válidos referenciando
  entidades existentes de tipo/propriedade de melhoria. Tipo e Propriedade devem
  ser compatíveis entre si (mesma validação de compatibilidade já usada em
  Treinamentos). Não é permitido repetir a mesma combinação de Tipo+Propriedade
  dentro da lista de Melhorias da mesma biografia. Não se aplica qualquer
  validação de exclusividade com uma lista de Defeitos, pois essa lista não
  existe em Biografia.
- `additionalAbilities`: opcional, array de referências `{ entityType, id }`, cujo
  `entityType` deve ser um dos tipos referenciáveis já suportados (treinamento,
  talento, técnica, magia, característica) e `id` deve corresponder a uma entidade
  existente desse tipo. Não é permitido que a lista contenha a própria biografia
  sendo editada (autorreferência) nem duplicatas do mesmo item na lista.

Web (zod, seguindo o padrão de schemas em `shared/formSchemas`):
- Mesmas regras de obrigatoriedade/formato replicadas no schema do formulário:
  `name` obrigatório; `imageReference` opcional com validação de URL quando
  preenchido; `description` opcional; `tagIds` opcional; listas de melhorias e
  habilidades adicionais tratadas como estado local do formulário (fora do
  schema de campos simples), reaproveitando os componentes já existentes de
  edição dessas listas (mesmo padrão usado no formulário de Treinamentos).

### Comportamento da listagem

- Página dedicada de Biografias, com tabela paginada seguindo o padrão de
  paginação do projeto (page/perPage com metadados de total/totalPages).
- Colunas, nesta ordem: (1) miniatura da imagem — primeira coluna, mesmo
  componente de avatar/miniatura usado em Divindades, exibindo um placeholder de
  imagem quando `imageReference` não estiver preenchido; (2) Nome; (3) Tags; (4)
  Ações.
- Ações por linha: visualizar (sempre visível), editar e excluir (ambas ocultas
  para usuários autenticados via Google).
- Filtro disponível: apenas por nome (busca parcial, case-insensitive), sem
  outros filtros adicionais.
- Ordenação padrão: por nome, ascendente (mesmo padrão usado em Treinamentos e
  Divindades).

### Layout do modal de visualização

Estrutura solicitada, de cima para baixo:
1. Bloco superior com duas áreas lado a lado (empilhadas em telas estreitas):
   - Imagem em formato quadrado (proporção 1:1), com placeholder quando
     `imageReference` estiver ausente, e ampliação ao clicar (mesmo padrão de
     pré-visualização de imagem usado em Divindades/miniaturas).
   - Ao lado da imagem: nome da biografia; logo abaixo do nome, as tags
     associadas; logo abaixo das tags, um quadro/bloco de conteúdo exibindo a
     descrição (rich text renderizado), com mensagem/placeholder padrão quando
     não houver descrição preenchida.
2. Seção "Melhorias", abaixo do bloco acima, listando os itens de melhoria (ou
   indicação de lista vazia quando não houver itens).
3. Seção "Habilidades Adicionais", abaixo de Melhorias, listando as referências
   (ou indicação de lista vazia quando não houver itens).

### Layout do formulário de criação/edição

Seguindo a ordem e a organização observadas no formulário de Treinamentos, adaptada
aos campos de Biografia:
1. Linha com campo Nome e campo de seleção múltipla de Tags.
2. Campo de imagem de referência (`imageReference`), como campo de URL/texto.
3. Campo de descrição em rich text.
4. Seção "Melhorias" (lista editável de itens Tipo/Propriedade/Valor).
5. Seção "Habilidades Adicionais" (lista editável de referências a entidades via
   buscador com abas).

Não há campos ou seções de Defeitos, Aprimorado de ou Requisitos no formulário de
Biografia.

### Inclusão no search global (API e web)

Pontos de extensão identificados na investigação do código existente, onde a nova
entidade precisa ser reconhecida (sem prescrever a forma exata de implementação):

API:
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` — enum
  `LinkableEntityType` com um valor por tipo de entidade linkável (ex.:
  `TRAINING = 'training'`); precisa reconhecer o novo tipo de Biografia.
- `app-api/src/modules/search/search.service.ts` — registra, para cada tipo
  linkável, o repositório correspondente e inclui seus resultados na busca por
  nome (`ILIKE`); precisa registrar o repositório de Biography.
- `app-api/src/modules/search/search.controller.ts` — descrição do endpoint em
  Swagger enumera os tipos suportados em texto livre (pt-BR); deve mencionar
  Biografia.

Web:
- `app-web/src/shared/interfaces/Entities/SearchResult/index.ts` — interface
  `ISearchResult` já é genérica (`id`, `name`, `entityType: string`) e não requer
  alteração estrutural, mas o novo `entityType` precisa ser reconhecido nos pontos
  abaixo.
- `app-web/src/shared/constants/EntityMentions/index.ts` — três mapas indexados
  por tipo de entidade: `ENTITY_MENTION_TYPE_LABELS` (rótulo em pt-BR exibido no
  autocomplete de menção, ex. "biografia"), `ENTITY_MENTION_DETAIL_URL_BY_TYPE`
  (URL do endpoint de detalhe, ex. `/biographies/{id}`), e
  `ENTITY_MENTION_VIEWABLE_TYPES` (lista de tipos clicáveis no texto renderizado).
  Os três precisam incluir o tipo de Biografia.
- `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` — mapa
  `ENTITY_MENTION_VIEW_REGISTRY` que associa cada `entityType` a uma renderização
  do respectivo componente de visualização (ex.: `TrainingView` para
  `'training'`); precisa de uma entrada para `'biography'` apontando para o modal
  de visualização de Biografia.
- O consumo de `/search` para autocomplete de menção ocorre em
  `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`
  e não requer alteração própria, pois já é genérico — apenas depende dos mapas
  acima estarem corretos para exibir/rotear o novo tipo corretamente.

Nota: o "search global" do projeto, conforme identificado na investigação, é o
endpoint `/search`, consumido pelo autocomplete de menções (`@`) dentro dos campos
de texto rico e pela visualização de menções clicáveis — não existe uma barra de
busca global separada no cabeçalho (`Header`) da aplicação.

### Política de permissões Google

API — padrão exato encontrado em todas as entidades de conteúdo com CRUD completo
(ex.: `trainings.controller.ts`, `divinities.controller.ts`): o controller aplica
`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` e `@GoogleAccess('read-only')` a nível
de classe. O `GoogleAccessGuard` permite todas as requisições de usuários com
provider local; para usuários com provider Google, permite apenas métodos `GET`
quando o nível é `'read-only'` e bloqueia todos os métodos quando o nível é
`'blocked'`. Para Biografia, aplica-se o nível `'read-only'`, replicando
exatamente a configuração de Treinamentos/Divindades.

Web — padrão exato encontrado nas listagens existentes (ex.:
`DivinitiesListItem`): o hook `useIsGoogleUser()` (em `hooks/Auth`) é consultado no
componente de item de listagem (e no formulário/modal correspondente); quando
verdadeiro, os botões/ações de Editar e Excluir não são renderizados, permanecendo
apenas a ação de Visualizar. O mesmo padrão deve ser aplicado à listagem e às ações
de Biografia.

### Referências concretas de arquivos existentes (modelos)

Backend:
- `app-api/src/modules/trainings/entities/training.entity.ts` — modelo de entidade
  com name único, description, tags.
- `app-api/src/modules/trainings/dto/create-training.dto.ts` e
  `trainings.service.ts` — modelo de DTO/serviço para `improvements` (sem
  `flaws`, já que Biografia não terá Defeitos) e `additionalAbilities` (sem
  `improvedFrom`/`requirements`).
- `app-api/src/modules/trainings/trainings.controller.ts` — modelo de controller
  com `GoogleAccessGuard`/`GoogleAccess('read-only')` e documentação Swagger.
- `app-api/src/modules/entity-links/entity-links.service.ts` e
  `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts` —
  mecanismo genérico de referências entre entidades (usado por
  `additionalAbilities`), atualmente com tipos-alvo Training/Talent/Technique/
  Spell/Characteristic; a validação de listas (`validateLists`) hoje cobre três
  listas (Aprimorado de/Requisitos/Habilidades Adicionais) — para Biografia
  aplica-se apenas a parte equivalente a "não referenciar a si mesma" e "não
  duplicar itens na própria lista de Habilidades Adicionais".
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts` e
  `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`
  — mecanismo genérico de melhorias/defeitos (usado por `improvements`),
  atualmente com proprietários Talent/Training/Characteristic; a validação de
  listas (`validateLists`) hoje cobre exclusividade entre Melhorias e Defeitos —
  para Biografia aplica-se apenas a parte equivalente a "não duplicar a mesma
  combinação Tipo+Propriedade dentro da própria lista de Melhorias".
- `app-api/src/modules/divinities/entities/divinity.entity.ts` e
  `create-divinity.dto.ts` — modelo de campo de imagem de referência opcional
  validado como URL (`referenceImage` + `@IsUrl`).
- `app-api/src/modules/search/search.service.ts`,
  `linkable-entity-type.enum.ts` e `search.controller.ts` — mecanismo de busca
  global a ser estendido.
- `app-api/src/modules/auth/decorators/google-access.decorator.ts` e
  `app-api/src/modules/auth/guards/google-access.guard.ts` — mecanismo de
  permissão Google a reaplicar.

Frontend:
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
  — modelo de formulário de criação/edição com `ImprovementDefectListField`
  (para Melhorias) e `EntityReferenceListField` (para Habilidades Adicionais).
- `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx` —
  modelo de modal de visualização com seções de Melhorias/Habilidades Adicionais
  usando `ImprovementDefectCard` e `EntityReferenceCard`.
- `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx` —
  modelo de layout com imagem grande (quadrada, no caso de Biografia), botão de
  ampliação (`ImagePreviewDialog`), placeholder de imagem ausente, nome, tags e
  blocos de conteúdo (`APP_CONTAINER_STYLES.detailSectionBox`).
- `app-web/src/app/(authorized)/divindades/components/DivinitiesListItem/index.tsx`
  — modelo de linha de listagem com miniatura (`ImageAvatarPreview`, que já trata
  o caso de imagem ausente com um placeholder), nome, tags e ações condicionadas
  a `useIsGoogleUser()`.
- `app-web/src/shared/components/ImageAvatarPreview/index.tsx` — componente
  reutilizável de miniatura com placeholder e ampliação.
- `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` — arquivo de
  configuração da navegação (`NAV_SECTIONS`), contendo a seção `title: 'JOGO'`
  (atualmente com Regras, Perícias e Condições) onde a nova entrada de Biografias
  deve ser adicionada.
- `app-web/src/shared/routes.ts` — arquivo central de rotas (`APP_ROUTES`), onde
  as demais entidades já têm uma constante de caminho privado.
- `app-web/src/shared/constants/EntityMentions/index.ts` e
  `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` — pontos
  de extensão do consumo de busca global no frontend, descritos na seção
  anterior.

### Casos de borda

- Nome duplicado: ao criar ou renomear uma biografia para um nome já usado por
  outra biografia existente, a operação deve ser rejeitada com erro de conflito
  (mesmo comportamento e mensagem em pt-BR já usados em Treinamentos/Divindades
  para nome duplicado).
- Imagem ausente: quando `imageReference` não estiver preenchido, tanto a
  miniatura da listagem quanto a imagem quadrada do modal de visualização devem
  exibir um placeholder visual (ícone de imagem), sem erro, seguindo o
  comportamento já existente em `ImageAvatarPreview` (listagem) e no bloco de
  imagem de `DivinityView` (modal).
- Lista de Melhorias vazia: o formulário permite salvar uma biografia sem nenhum
  item de melhoria; o modal de visualização exibe uma indicação de lista vazia
  (mesmo texto/padrão usado em Treinamentos para listas sem itens).
- Lista de Habilidades Adicionais vazia: mesmo comportamento acima, aplicado à
  seção "Habilidades Adicionais".
- Biografia referenciando a si mesma: ao editar uma biografia, não é permitido
  incluir a própria biografia na lista de Habilidades Adicionais; a tentativa
  deve ser rejeitada com erro de conflito, mesmo comportamento já aplicado em
  Treinamentos para autorreferência nas listas de entity-links.
- Duplicata na mesma lista: não é permitido adicionar duas vezes o mesmo item
  (mesma entidade) na lista de Habilidades Adicionais, nem repetir a mesma
  combinação de Tipo+Propriedade na lista de Melhorias da mesma biografia; ambas
  as tentativas devem ser rejeitadas com erro de conflito, seguindo o mesmo
  comportamento já aplicado em Treinamentos.
- Tags, tipos/propriedades de melhoria ou entidades referenciadas em Habilidades
  Adicionais inexistentes: qualquer id informado que não corresponda a um
  registro existente deve ser rejeitado com erro de "não encontrado", seguindo o
  mesmo comportamento já aplicado em Treinamentos.
- Usuário autenticado via Google: pode visualizar biografias e realizar buscas,
  mas não pode criar, editar ou excluir — tentativas via API são bloqueadas pelo
  `GoogleAccessGuard` (nível `'read-only'`), e a interface web oculta as ações
  correspondentes para esse perfil de usuário.
