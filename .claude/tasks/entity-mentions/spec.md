# Spec: Menção a entidades (@mention) em campos de texto rico

## Pedido original
Adicionar funcionalidade de "menção a entidades" (@mention) no componente
`FormRichTextInput`.

Ao digitar "@" seguido de caracteres em qualquer campo `FormRichTextInput`, deve
abrir um menu de sugestão (estilo autocomplete) buscando entidades da aplicação
cujo campo `name` contenha o texto digitado (ex: "@Joa" sugere "Joao (criatura)",
"Joao (usuário)" etc), buscando em todas as entidades que têm `name`, começando
por User e Creature. Ao selecionar uma opção, o texto vira uma "tag" inline
vinculada ao id + tipo da entidade selecionada. Ao visualizar esse texto depois
(ex: no `CreatureView` dentro do `ViewModal`), a tag aparece destacada e clicável;
ao clicar, abre um modal de visualização (`ViewModal`) com o componente de view
apropriado para aquele tipo de entidade (ex: `CreatureView` se for uma criatura).

### Investigação prévia (contexto de partida)
- `FormRichTextInput`
  (`app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`)
  usa TipTap (`@tiptap/react` + `@tiptap/starter-kit`). Não há
  `@tiptap/extension-mention` nem `@tiptap/suggestion` instalados ainda.
- Visualização hoje (`CreatureView`,
  `app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`)
  apenas joga o HTML salvo em `dangerouslySetInnerHTML` — não há suporte a
  clique em conteúdo de rich text hoje.
- `ViewModal` (`app-web/src/shared/components/Modals/ViewModal/index.tsx`) hoje
  é aberto via estado local de cada página (ex: `creaturePendingView` em
  `app-web/src/app/(authorized)/criaturas/page.tsx`), não por store global — não
  existe mecanismo para abrir a view de uma entidade "de qualquer lugar" por
  entityType + id.
- Backend: entidades atuais são `User`
  (`app-api/src/modules/users/entities/user.entity.ts`), `Creature` e
  `CreatureCategory` (`app-api/src/modules/creatures/entities/*.entity.ts`),
  todas estendendo `BaseEntity` (uuid id, createdAt, updatedAt) e todas com
  coluna `name` única. Não existe endpoint de busca global nem coluna/padrão de
  `entityType` no banco.
- Convenções do repo relevantes: todos os controllers já usam `JwtAuthGuard`;
  não há soft-delete (`BaseEntity` não tem `deletedAt`); não existe componente
  de view para `User`; não há convenção prévia de debounce/paginação para
  autocomplete no frontend.

## Perguntas e respostas
- P: Qual o limite de resultados retornados pela busca de entidades, e o menu de
  sugestão deve ter paginação/scroll infinito?
  → R: 10 resultados no endpoint `GET /search`, sem paginação (apenas trunca nos
  10 primeiros). Menu de sugestão sem scroll infinito/paginação.
- P: Qual o gatilho para disparar a busca (quantidade mínima de caracteres após
  o "@") e deve haver debounce?
  → R: Mínimo de 2 caracteres após o "@" para disparar a chamada; debounce de
  300ms.
- P: Qual o formato do valor de `entityType` retornado/armazenado (ex.:
  maiúsculo, minúsculo, singular/plural)?
  → R: Minúsculo — `"creature"`, `"user"`.
- P: O que deve acontecer se a entidade mencionada tiver sido excluída no
  momento da visualização?
  → R: A tag aparece normalmente e só falha ao clicar, exibindo um toast
  "entidade não encontrada" (pt-BR). Não há verificação prévia de existência ao
  carregar a view.
- P: O nome exibido na tag deve ser um snapshot do momento da menção ou sempre o
  nome atual da entidade (refletindo renomeações)?
  → R: Sempre o nome atual da entidade — deve refletir renomeações. O node de
  mention guarda `id` + `entityType`, e o nome exibido na visualização deve ser
  resolvido a partir do dado atual da entidade a cada render (não é snapshot
  fixo no HTML). Implicação técnica registrada: pode ser necessário um endpoint
  para resolver entidade por `id` + `entityType` (ou reaproveitar endpoints de
  detalhe existentes) para o frontend buscar o nome atual ao renderizar.
- P: Menções a `User` devem ser clicáveis (abrindo alguma view de usuário) nesta
  entrega? E qual a exigência de autenticação do endpoint de busca?
  → R: Por enquanto NÃO clicável — a busca continua sugerindo usuários e a
  menção de usuário pode ser criada/exibida, mas clicar numa tag de usuário não
  abre modal (nenhum componente de view de `User` será criado nesta feature).
  Apenas menções de `creature` abrem o `ViewModal` com `CreatureView`. O
  dispatcher entityType→view deve tratar tipos sem view registrada de forma
  graciosa (ex.: não abrir nada / tag de user renderizada como não-clicável).
  Autenticação do endpoint de busca: exige JWT, seguindo o padrão de todos os
  outros controllers.

## Decisões arquiteturais
As decisões abaixo já foram validadas com o usuário e não estão sujeitas a
reavaliação nesta etapa; ficam registradas aqui apenas para consolidar o escopo.

1. **Backend — endpoint de busca**: não adicionar coluna `entityType` nas
   entidades. Criar um módulo de busca (ex.: `search`) com endpoint único
   `GET /search?query=...` cujo service busca por `ILIKE` no campo `name` em
   uma lista fixa e mantida manualmente de entidades "linkáveis" (começar com
   `User` e `Creature`), retornando `{ id, name, entityType }[]` montado em
   código (o `entityType` não vem do banco, é atribuído conforme qual entidade
   foi buscada).
2. **Frontend — captura da menção**: adicionar `@tiptap/extension-mention` +
   `@tiptap/suggestion` ao `FormRichTextInput`, configurado para chamar o novo
   endpoint de busca conforme o usuário digita depois do "@", inserindo um node
   de mention guardando `id` + `entityType` (+ label de exibição) nos
   atributos — usar a serialização nativa do TipTap, sem codificação de tag
   própria.
3. **Frontend — visualização/clique**: ajustar a renderização de rich text
   somente-leitura (usada em views como `CreatureView`) para não depender só de
   `dangerouslySetInnerHTML` puro — usar uma instância TipTap `editable: false`
   (ou equivalente) para que o node de mention tenha clique em React.
4. **Frontend — abertura de modal genérica**: criar mecanismo central (store
   Zustand global) que guarda `{ entityType, entityId }` pendente de
   visualização, com dispatcher que mapeia `entityType -> componente de view`
   (`CreatureView` primeiro; preparado para adicionar outros tipos). Deve
   funcionar mesmo quando o clique ocorre dentro de outro modal já aberto
   (menção dentro do texto de uma view).

## Escopo confirmado / Critérios de aceite

### Backend (app-api)
- Novo endpoint `GET /search?query=...`, protegido por `JwtAuthGuard` (mesmo
  padrão de autenticação dos demais controllers).
- A busca considera uma lista fixa e mantida manualmente de entidades
  "linkáveis", iniciando com `User` e `Creature`.
- Para cada entidade da lista, a busca é feita por `ILIKE` no campo `name`
  contra o texto informado em `query`.
- O `entityType` de cada resultado não vem de coluna de banco: é atribuído em
  código conforme a entidade de origem da busca, em formato minúsculo (ex.:
  `"user"`, `"creature"`).
- O endpoint retorna no máximo 10 resultados no total (consolidando todas as
  entidades pesquisadas), sem paginação — apenas truncando nos 10 primeiros.
- Formato de resposta: lista de itens `{ id, name, entityType }`.
- Não há endpoint de verificação prévia de existência da entidade mencionada;
  a validação de existência ocorre apenas no momento em que o frontend tenta
  resolver/exibir os dados da entidade (comportamento tratado no frontend).
- Implicação técnica a considerar na etapa de planejamento/implementação: pode
  ser necessário expor (ou reaproveitar) uma forma de resolver uma entidade por
  `id` + `entityType`, para que o frontend obtenha o nome atual da entidade
  mencionada a cada renderização (ver seção de frontend/visualização).
- Mensagens de erro e validação voltadas ao usuário devem estar em português
  (pt-BR), consistente com o restante da API.

### Frontend (app-web)
**Edição / captura da menção**
- No componente `FormRichTextInput`, ao digitar "@" seguido de no mínimo 2
  caracteres, deve ser disparada (com debounce de 300ms) uma busca no endpoint
  `GET /search`, abrindo um menu de sugestão estilo autocomplete com os
  resultados retornados (no máximo 10, sem paginação/scroll infinito).
- Ao selecionar uma sugestão, o texto digitado é substituído por uma "tag"
  inline (node de mention do TipTap) que armazena `id` + `entityType` da
  entidade selecionada, além de um label de exibição, utilizando a serialização
  nativa do TipTap (sem formato de tag textual próprio).

**Visualização / renderização somente-leitura**
- Em componentes de visualização de conteúdo rich text (ex.: `CreatureView`
  dentro do `ViewModal`), o conteúdo deve deixar de depender apenas de
  `dangerouslySetInnerHTML` puro, passando a ser renderizado por uma instância
  TipTap em modo somente-leitura (`editable: false` ou equivalente), de forma
  que o node de mention seja clicável via React.
- O nome exibido em cada tag de menção deve refletir o nome atual da entidade
  (não um snapshot fixo salvo no HTML), sendo resolvido a partir do dado atual
  da entidade a cada renderização.

**Comportamento ao clicar em uma tag**
- Tags de menção do tipo `creature` são clicáveis: ao clicar, abre-se o
  `ViewModal` com o componente `CreatureView` correspondente à entidade
  mencionada.
- Tags de menção do tipo `user` NÃO são clicáveis nesta entrega — nenhum
  componente de view de `User` é criado; a tag é renderizada apenas como texto
  destacado, sem ação de clique.
- Caso a entidade mencionada do tipo `creature` não seja encontrada no momento
  do clique (ex.: foi excluída), deve ser exibido um toast com a mensagem
  "entidade não encontrada" (em pt-BR), sem abrir o modal. Não há verificação
  prévia de existência ao carregar a view — a checagem ocorre somente na
  tentativa de abertura.

**Mecanismo central de abertura de view por entidade**
- Deve existir um mecanismo central (store Zustand global) responsável por
  guardar qual entidade (`entityType` + `entityId`) está pendente de
  visualização, desacoplado do estado local de cada página.
- Deve existir um dispatcher que mapeia `entityType` para o componente de view
  correspondente, iniciando com `creature -> CreatureView`, e preparado para
  registrar outros tipos futuramente.
- Tipos de entidade sem view registrada (ex.: `user`, nesta entrega) devem ser
  tratados de forma graciosa pelo dispatcher — ou seja, não abrir nenhum modal
  nem gerar erro.
- Esse mecanismo deve funcionar mesmo quando o clique em uma tag de menção
  ocorre dentro de outro modal de visualização já aberto (ex.: uma menção
  dentro do texto exibido dentro do `ViewModal` de outra entidade), abrindo o
  novo `ViewModal` corretamente nesse cenário.
- Toda mensagem voltada ao usuário (toasts, labels) deve estar em português
  (pt-BR), consistente com o restante do frontend.
