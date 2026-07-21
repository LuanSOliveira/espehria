# Task Web: Menção a entidades (@mention) em campos de texto rico

## Contexto
Ver .claude/tasks/entity-mentions/spec.md

**Dependência bloqueante**: esta etapa depende do endpoint `GET /search?query=...`
do `app-api` já estar implementado e funcional (task-api do slug `entity-mentions`).
O orquestrador só deve executar `web-dev` depois que `api-dev` concluir essa parte
do backend. Se o endpoint ainda não existir/estiver instável ao iniciar esta etapa,
`web-dev` deve interromper e sinalizar o bloqueio em vez de mockar a resposta.

Referências de padrão já existentes no repo, usadas como base deste plano:
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`
  (editor atual, TipTap `@tiptap/react` v2.11.5 + `@tiptap/starter-kit`; ainda
  sem `@tiptap/extension-mention`/`@tiptap/suggestion` instalados).
- `app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`
  (view de criatura; hoje renderiza rich text só com `dangerouslySetInnerHTML`
  via componente interno `RichTextValue`).
- `app-web/src/app/(authorized)/criaturas/page.tsx` (estado local
  `creaturePendingView` + `ViewModal` — mostra o padrão atual que o novo store
  global deve complementar, sem quebrar o uso existente).
- `app-web/src/shared/components/Modals/ViewModal/index.tsx` (`ViewModal`
  genérico já usado pelas páginas, aceita `title`, `size`, `children`).
- `app-web/src/hooks/Queries/DefaultQueries/useGetEntityList` e
  `useGetEntityById` (padrão de hooks genéricos sobre `ApiFactory` +
  `getAuthToken()`, usados como base para o hook de busca de menções).
- `app-web/src/store/PageStore/CreaturesStore` e `app-web/src/store/index.ts`
  (padrão de store Zustand por feature) e
  `app-web/src/store/ThemeStore/index.ts` (padrão de store global, fora de
  `PageStore`, para mecanismos cross-feature — modelo a seguir para o novo
  store de visualização de menção).
- `app-web/src/app/(authorized)/layout.tsx` (monta `ThemeInitializer` e
  `ToastContainer` globalmente ao lado do `AuthorizedShell` — mesmo ponto de
  extensão para montar o dispatcher global de views por menção).
- `app-web/src/shared/interfaces/Entities/*` (padrão de interfaces por
  entidade, ex.: `ICreature`, `IUser`) — usar o mesmo padrão para o tipo de
  resultado de busca (`ISearchResult` ou similar).
- Não há hook de debounce genérico no repo hoje; será necessário implementar
  o debounce de 300ms diretamente na integração da extensão de mention (ex.:
  `setTimeout`/`clearTimeout` dentro do `items()` do `Suggestion`), sem criar
  dependência nova de terceiros para isso.

## Etapas

### 1. web-dev
Status: concluído (com uma pendência de infraestrutura registrada abaixo)
Componentes:
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/MentionSuggestionList/index.tsx` (novo, específico do editor de rich text)
- `app-web/src/shared/components/RichTextViewer/index.tsx` (novo, genérico)
- `app-web/src/shared/components/RichTextViewer/EntityMentionNodeView.tsx` (novo, node view de menção somente-leitura)
- `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` (novo, dispatcher global)
- `app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx` (alterado: usa `RichTextViewer`, trata 404 com "Entidade não encontrada.", novo prop `onNotFound`)

Arquivos:
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx` (extensão Mention + suggestion com debounce 300ms/mínimo 2 caracteres, integração `ApiFactory`/`GET /search`)
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/EntityMentionExtension.ts` (novo, extensão base compartilhada edição/leitura)
- `app-web/src/store/EntityMentionViewStore/index.ts` (novo, store global) e `app-web/src/store/index.ts` (barrel)
- `app-web/src/shared/interfaces/Entities/SearchResult/index.ts` (novo, `ISearchResult`) e `app-web/src/shared/interfaces/Entities/index.ts` (barrel)
- `app-web/src/shared/constants/EntityMentions/index.ts` (novo: rótulos pt-BR por tipo, resolução de URL de detalhe por tipo, tipos com view registrada) e `app-web/src/shared/constants/index.ts` (barrel)
- `app-web/src/shared/constants/Styles/InputStyles/index.ts` (novas chaves: estilo de chip de menção em `richTextContent`/`richTextContentLight`, `mentionSuggestionMenu`, `mentionSuggestionItem`, `mentionSuggestionItemActive`)
- `app-web/src/app/(authorized)/layout.tsx` (monta `EntityMentionViewDispatcher` ao lado de `ThemeInitializer`/`ToastContainer`)

Decisões de escopo tomadas durante a implementação:
- `tippy.js` (v6.3.7, já presente no lockfile apenas como dependência transitiva de extensões de bubble/floating menu do TipTap) precisa ser adicionado como dependência direta do `app-web`, pois é importado diretamente em `FormRichTextInput` para posicionar o menu de sugestão. Idem para `@tiptap/extension-mention` e `@tiptap/suggestion` (`^2.11.5`).
- **Pendência de infraestrutura**: por restrição de escopo de ferramentas desta etapa (Edit/Write restritos a `app-web/src/**`/`.claude/tasks/**`), não foi possível editar `app-web/package.json` nem rodar `npm install`. É necessário, antes do build/execução, adicionar manualmente as dependências `@tiptap/extension-mention@^2.11.5`, `@tiptap/suggestion@^2.11.5` e `tippy.js@^6.3.7` ao `package.json` do `app-web` e instalar (`npm install`).
- Rótulos de tipo no menu de sugestão: mapa local `entityType -> label` em `shared/constants/EntityMentions` com `creature: 'criatura'`, `user: 'usuário'` (exibidos como `"Nome (criatura)"`/`"Nome (usuário)"`).
- Resolução do nome atual da entidade mencionada (RichTextViewer) reaproveita `GET /creatures/:id` e `GET /users/:id` via `useGetEntityById`, conforme confirmado pelo orquestrador (sem endpoint de resolução dedicado).
- Menção de `user` é renderizada destacada porém não clicável (sem `cursor: pointer`, sem handler de clique) — apenas `creature` está registrado em `ENTITY_MENTION_VIEWABLE_TYPES`/`EntityMentionViewDispatcher`.
- Mensagem "Entidade não encontrada." é usada exclusivamente para erro 404 em `CreatureView` (tanto na visualização normal quanto via menção); demais erros mantêm a mensagem genérica pré-existente.

#### Componentes (se necessário)

- Componente: `MentionSuggestionList`
  - Localização sugerida: junto ao `FormRichTextInput`, ex.
    `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/MentionSuggestionList/index.tsx`
    (ou arquivo irmão dentro da mesma pasta), pois é acoplado à extensão de
    mention do editor e não é um primitivo de uso genérico fora desse
    contexto.
  - Props: `items: { id: string; name: string; entityType: string }[]`,
    `selectedIndex: number`, `onSelectItem: (item) => void`, `isLoading?: boolean`.
  - Comportamento esperado: renderiza a lista de sugestões (estilo
    autocomplete/menu flutuante posicionado no cursor via `tippy.js`, que é
    dependência transitiva de `@tiptap/suggestion`), exibindo `name` e um
    rótulo do tipo de entidade (ex.: "(criatura)"/"(usuário)") por item; sem
    paginação/scroll infinito (máximo 10 itens vindos do backend); navegação
    por teclado (setas + Enter) delegada ao `SuggestionOptions` do TipTap,
    este componente só precisa expor `onSelectItem`/destacar `selectedIndex`;
    exibir estado vazio ("Nenhuma entidade encontrada") quando a busca
    retornar lista vazia.

- Componente: `RichTextViewer` (renderização somente-leitura reutilizável)
  - Localização sugerida: novo componente em
    `app-web/src/shared/components/RichTextViewer/index.tsx` (fora de
    `FormInputs`, pois não é um campo de formulário — é reutilizável em
    qualquer view de conteúdo rich text salvo).
  - Props: `value?: string | null` (HTML salvo), `emptyLabel?: string`
    (default "Não informado", mantendo o comportamento atual do
    `CreatureView`), `sx`/className opcionais para estilização pontual.
  - Comportamento esperado: instancia um `useEditor` do TipTap com
    `editable: false`, mesmas extensões usadas na edição (`StarterKit` +
    extensão de mention configurada em modo leitura, sem `Suggestion` ativo),
    `content: value`; quando vazio (reaproveitar util `isRichTextEmpty`
    já existente), renderiza o texto de `emptyLabel` como hoje. Deve
    substituir o uso de `dangerouslySetInnerHTML` no `CreatureView`
    (componente interno `RichTextValue`) e ficar disponível para uso em
    futuras views com rich text.
  - O node de mention renderizado por este componente deve:
    - resolver o nome atual da entidade a cada render, via chamada a
      `useGetEntityById` (ou endpoint equivalente de detalhe/resolução por
      `id` + `entityType`, conforme o que o `task-api` disponibilizar) — não
      usar o `label`/nome gravado no HTML da menção como texto exibido, ele
      serve apenas como fallback enquanto a resolução carrega ou em caso de
      erro de rede;
    - exibir a tag com destaque visual (estilo "chip"/texto sublinhado,
      seguindo paleta de `APP_COLORS`), com cursor de clique somente quando
      `entityType` tiver view registrada no dispatcher (ver mecanismo
      central abaixo) — caso contrário (ex. `user`), renderizar como texto
      destacado não clicável (sem `cursor: pointer`, sem handler de click);
    - ao clicar em uma tag com `entityType` clicável, disparar a store
      global de visualização de menção com `{ entityType, entityId }`.

- Mecanismo central (store Zustand global + dispatcher)
  - Store: `app-web/src/store/EntityMentionViewStore/index.ts` (store global,
    fora de `PageStore`, seguindo o padrão de `ThemeStore`/
    `FontAccessibilityStore`, pois não pertence a uma feature específica).
    Estado: `pendingView: { entityType: string; entityId: string } | null`,
    ações `openEntityView(entityType, entityId)` e `closeEntityView()`.
    Exportar em `app-web/src/store/index.ts` junto aos demais stores globais.
  - Dispatcher: componente `EntityMentionViewDispatcher`, ex. em
    `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`.
    Mantém um mapa `entityType -> componente de view` (registro inicial:
    `creature -> CreatureView`), lê `pendingView` do
    `useEntityMentionViewStore`, e:
    - se `pendingView` existir e o `entityType` tiver view registrada,
      renderiza `<ViewModal open title="Detalhes" size="wide">` com o
      componente mapeado (passando `creatureId={pendingView.entityId}` no
      caso de `creature`, seguindo a prop já usada por `CreatureView`);
    - se o `entityType` não tiver view registrada (ex. `user` nesta
      entrega), não deve nem chegar a esse ponto — o clique na tag para
      tipos sem view já é bloqueado no próprio `RichTextViewer` (tag não
      clicável); o dispatcher, ainda assim, deve tratar defensivamente um
      `entityType` desconhecido sem quebrar (simplesmente não renderiza
      nenhum modal);
    - ao fechar o `ViewModal`, chama `closeEntityView()`.
    - Este componente deve ser montado uma única vez, globalmente, dentro de
      `app-web/src/app/(authorized)/layout.tsx` (ao lado de
      `ThemeInitializer`/`ToastContainer`), para que funcione
      independentemente de qual página/estado local disparou o clique — e
      para suportar o cenário de menção clicada dentro de um `ViewModal` já
      aberto (o `Dialog` do MUI empilha por padrão; não é necessário
      tratamento extra de z-index, mas validar visualmente durante a
      implementação que o novo `ViewModal` aparece sobre o já aberto).
  - Resolução de "entidade não encontrada" ao clicar: o clique deve, antes
    de (ou ao) abrir a view, validar a existência da entidade. Duas opções
    equivalentes a avaliar na implementação (escolher a mais simples dado o
    endpoint que o `task-api` expuser): (a) o próprio dispatcher/`CreatureView`
    já trata erro 404 de `useGetEntityById` mostrando toast — reaproveitar
    esse fluxo de erro já existente em `CreatureView` (`isError` +
    `showToast`) fechando o modal nesse caso; ou (b) checar existência antes
    de abrir o modal. Preferir (a) por já existir e exigir menos código,
    desde que ao falhar o `ViewModal` feche novamente e o toast exiba
    exatamente "Entidade não encontrada." (pt-BR) — ajustar a mensagem de
    erro usada em `CreatureView` para esse caso específico (404), sem
    alterar a mensagem genérica de outros erros.

#### Funcionalidade

- Dependências a instalar: `@tiptap/extension-mention` e
  `@tiptap/suggestion`, ambos na mesma versão major/minor já usada
  (`^2.11.5`), para compatibilidade com `@tiptap/react`/`@tiptap/starter-kit`
  já presentes.

- Alterações em `FormRichTextInput`
  (`app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`):
  - Adicionar a extensão `Mention` (de `@tiptap/extension-mention`) à lista
    de `extensions` do `useEditor`, configurada com:
    - `HTMLAttributes`/`renderHTML` guardando `data-id` (id da entidade),
      `data-entity-type` (entityType) e o label de exibição como texto do
      node — usando a serialização nativa do TipTap (`addAttributes`/
      `parseHTML`/`renderHTML`), sem formato de tag textual próprio;
    - `suggestion.char: '@'`;
    - `suggestion.items`: função que só dispara busca quando a `query` tiver
      pelo menos 2 caracteres (antes disso, retorna lista vazia sem chamar a
      API); aplica debounce de 300ms (cancelando chamada anterior a cada
      nova tecla) antes de chamar o endpoint `GET /search?query=<texto>`;
    - a chamada ao endpoint deve reaproveitar a mesma infraestrutura dos
      hooks de `hooks/Queries` (`ApiFactory(getAuthToken())`), respeitando o
      padrão do CLAUDE.md mesmo não podendo usar diretamente um hook React
      (`useGetEntityList`) dentro do callback `items` do `Suggestion`, que
      roda fora do ciclo de render — chamar a API diretamente via
      `ApiFactory` dentro dessa função, análogo ao que os hooks fazem
      internamente;
    - `suggestion.render`: renderiza `MentionSuggestionList` posicionado via
      `tippy.js` (dependência transitiva já usada internamente por
      `@tiptap/suggestion` em projetos TipTap 2.x — confirmar disponibilidade
      no lockfile durante a implementação; se não vier transitivamente,
      adicionar como dependência direta) próximo ao cursor;
    - ao selecionar um item, insere o node de mention com `id`, `entityType`
      e `label` (nome exibido no momento da seleção) como atributos.
  - Nenhuma alteração é necessária no `RichTextEditorField`/`onUpdate` além
    de incluir a extensão — o valor salvo continua sendo `editor.getHTML()`.

- Ajuste em `CreatureView`
  (`app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`):
  - Substituir o componente interno `RichTextValue` (que hoje usa
    `dangerouslySetInnerHTML`) por uso do novo `RichTextViewer`, mantendo o
    comportamento de exibir "Não informado" quando vazio (via
    `isRichTextEmpty`, já reaproveitado internamente pelo `RichTextViewer`).
  - Ajustar a mensagem de erro de `useGetEntityById` (usada tanto na
    abertura “normal” pela página quanto quando aberta via
    `EntityMentionViewDispatcher`) para diferenciar 404 (entidade excluída
    — exibir "Entidade não encontrada.") de outros erros (mensagem genérica
    atual), e fechar a view nesse caso quando aberta via menção.

- Novo tipo/interface: adicionar `ISearchResult` (ou nome equivalente) em
  `app-web/src/shared/interfaces/Entities/SearchResult/index.ts`, com o
  formato `{ id: string; name: string; entityType: string }`, exportado em
  `app-web/src/shared/interfaces/index.ts`, para tipar tanto a resposta do
  endpoint de busca quanto os itens do `MentionSuggestionList`.

- Integrações com API:
  - `GET /search?query=<texto>` — usado dentro da extensão de mention do
    `FormRichTextInput` (autenticado via `ApiFactory(getAuthToken())`,
    seguindo o padrão dos hooks em `hooks/Queries`; exige JWT conforme a
    spec).
  - `GET /creatures/:id` (já existente, via `useGetEntityById`) — reutilizado
    pelo `CreatureView` tanto no fluxo atual (clique na listagem de
    criaturas) quanto no novo fluxo de clique em menção.
  - Caso o `task-api` disponibilize um endpoint dedicado de resolução por
    `id` + `entityType` (mencionado como implicação técnica na spec) em vez
    de reaproveitar `GET /creatures/:id`, ajustar `RichTextViewer` para
    consumir esse endpoint ao resolver o nome atual da entidade mencionada,
    mantendo o restante do plano inalterado.

- Formulário/validação: não há novos campos de formulário nesta feature — a
  menção é um recurso do próprio editor rich text já usado pelos formulários
  existentes (ex.: criação/edição de criatura). Nenhuma regra de `zod` nova é
  necessária, pois o valor continua sendo uma string HTML.

- Pontos sinalizados para atenção do `web-dev` durante a implementação (não
  são lacunas de requisito, mas decisões técnicas a resolver no código):
  - Confirmar se `tippy.js` precisa ser adicionado como dependência direta
    do `app-web` ou se já vem disponível via `@tiptap/suggestion`.
  - Definir o texto exato do rótulo de tipo de entidade mostrado ao lado do
    nome no menu de sugestão (ex.: "(criatura)"/"(usuário)") — usar um mapa
    simples `entityType -> label pt-BR` local à feature.

### 2. web-dev-codereviewer
Status: concluído

## Revisão

Etapa "1. web-dev" está marcada como concluída (com uma pendência de
infraestrutura já registrada pelo próprio `web-dev`); revisão realizada sobre
todos os arquivos listados em "Componentes"/"Arquivos" dessa etapa, cruzando
com `CLAUDE.md` e com o endpoint real `GET /search` do `app-api`
(`app-api/src/modules/search/**`, já implementado e compatível em formato —
`entityType: 'user' | 'creature'`, `query`, limite de 10 itens — com o que o
front-end espera).

- **BLOQUEANTE — `app-web/package.json`** — `@tiptap/extension-mention` e
  `@tiptap/suggestion` são importados diretamente em
  `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/EntityMentionExtension.ts`
  (`import Mention from '@tiptap/extension-mention'`) e em
  `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`
  (`import { SuggestionOptions } from '@tiptap/suggestion'`), mas nenhum dos
  dois pacotes está listado em `app-web/package.json` nem existe em
  `app-web/package-lock.json`/`node_modules` (nem mesmo como dependência
  transitiva) — confirmado via busca no lockfile, que não tem nenhuma entrada
  `node_modules/@tiptap/suggestion` ou `node_modules/@tiptap/extension-mention`.
  O código não compila/executa como entregue. `tippy.js` é o único dos três
  pacotes citados na pendência que já está fisicamente instalado
  (`node_modules/tippy.js` no lockfile, como dependência transitiva de
  `@tiptap/extension-bubble-menu`/`@tiptap/extension-floating-menu`), mas
  segue sendo uma dependência "fantasma" (usada sem estar declarada em
  `package.json`), o que quebra em qualquer reinstalação limpa que dedupe/pode
  remover pacotes não referenciados diretamente.
  - Trecho: `import Mention from '@tiptap/extension-mention';` (linha 1 de
    `EntityMentionExtension.ts`); `import { SuggestionOptions } from '@tiptap/suggestion';`
    e `import tippy, { Instance as TippyInstance } from 'tippy.js';` (linhas 8-9
    de `FormRichTextInput/index.tsx`).
  - Sugestão: adicionar `@tiptap/extension-mention@^2.11.5`,
    `@tiptap/suggestion@^2.11.5` e `tippy.js@^6.3.7` como dependências diretas
    de `app-web/package.json` e rodar `npm install` antes de considerar esta
    etapa pronta para build/execução — exatamente como a própria "Pendência de
    infraestrutura" registrada na etapa 1 já antecipa, reforçando que ela deve
    ser tratada como bloqueio real e não apenas nota informativa.

- **Recomendação — condição de corrida no resolver de sugestões**
  (`app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`,
  `createMentionItemsResolver`) — o debounce cancela apenas o `setTimeout`
  pendente (chamada ainda não disparada); uma vez que a chamada a
  `api.get('/search', ...)` já foi disparada, não há `AbortController`/token de
  requisição para descartá-la caso uma busca mais recente já tenha sido
  iniciada. Se a resposta da requisição mais antiga chegar depois da mais
  nova (comum com latência de rede variável), o `resolve` da promise antiga
  ainda dispara e o TipTap `Suggestion` pode atualizar o menu com resultados
  desatualizados, sobrescrevendo os resultados da busca mais recente.
  - Trecho: `debounceTimeout = setTimeout(async () => { ... const { data } = await api.get<ISearchResult[]>('/search', { params: { query } }); resolve(data); ... }, MENTION_DEBOUNCE_MS);`
  - Sugestão: usar um contador/token de requisição (incrementado a cada
    chamada) e ignorar (`resolve([])` ou simplesmente não resolver) respostas
    cujo token não seja mais o mais recente, ou usar `AbortController` passado
    via `config` do axios e abortar a chamada anterior ao iniciar uma nova.

- **Recomendação — feedback de carregamento morto**
  (`MentionSuggestionList`/`createMentionSuggestion` em
  `FormRichTextInput/index.tsx`) — `MentionSuggestionListProps.isLoading` é
  declarado e tratado em
  `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/MentionSuggestionList/index.tsx`,
  mas `buildProps` (usado em `onStart`/`onUpdate`) nunca define `isLoading`, ou
  seja, o valor é sempre o default (`false`); o branch de `CircularProgress`
  nunca é alcançado. Durante o debounce (300ms) + latência de rede, o usuário
  não recebe nenhum feedback visual de carregamento (o menu simplesmente some
  ou mostra o estado anterior/vazio).
  - Trecho: `const buildProps = (items: ISearchResult[], command: (item: ISearchResult) => void) => ({ items, selectedIndex, onSelectItem: command });` (sem `isLoading`).
  - Sugestão: setar `isLoading: true` ao iniciar cada busca (ex. logo após
    disparar `debounceTimeout`/antes do `await`) e propagar esse estado via
    `component?.updateProps` até a resposta chegar.

- **Recomendação — mensagem de "nenhuma entidade encontrada" ambígua**
  (`createMentionItemsResolver`, `FormRichTextInput/index.tsx`) — quando
  `query.trim().length < MENTION_MIN_QUERY_LENGTH`, a função resolve `[]`
  imediatamente, e o `MentionSuggestionList` exibe a mesma mensagem
  ("Nenhuma entidade encontrada") usada para uma busca real sem resultados.
  Isso pode confundir o usuário logo após digitar `@` ou apenas 1 caractere,
  sugerindo que não há entidades cadastradas quando na verdade o mínimo de 2
  caracteres ainda não foi atingido.
  - Sugestão: diferenciar os dois estados (ex. texto "Digite ao menos 2
    caracteres para buscar" quando `query.trim().length < 2`).

- **Recomendação — menção clicável sem acesso por teclado**
  (`app-web/src/shared/components/RichTextViewer/EntityMentionNodeView.tsx`) —
  a tag de menção clicável (`entityType` com view registrada) é um `<span>`
  (via `NodeViewWrapper`) com apenas `onClick`, sem `role="button"`,
  `tabIndex={0}` nem `onKeyDown` para `Enter`/`Espaço`, tornando a interação
  inacessível a usuários de teclado/leitores de tela.
  - Trecho: `<NodeViewWrapper as="span" data-type="mention" data-clickable={isClickable ? 'true' : 'false'} onClick={handleClick}>`
  - Sugestão: quando `isClickable` for `true`, adicionar `role="button"`,
    `tabIndex={0}`, `onKeyDown` tratando `Enter`/`Espaço`, e um `aria-label`
    em pt-BR (ex. `Ver detalhes de ${displayName}`).

- **Recomendação — extensão base de menção acoplada à pasta de um input
  específico** — `EntityMentionExtension.ts` foi propositalmente descrito no
  plano como "extensão base compartilhada edição/leitura", mas está fisicamente
  em `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/`;
  como consequência, o componente genérico
  `app-web/src/shared/components/RichTextViewer/EntityMentionNodeView.tsx`
  (que a própria spec define como "fora de FormInputs, pois não é um campo de
  formulário") importa de dentro da pasta de um input de formulário
  específico (`.../FormInputs/FormRichTextInput/EntityMentionExtension`),
  invertendo a fronteira de reaproveitamento pretendida.
  - Trecho: `import { EntityMentionExtension } from '@/shared/components/Inputs/FormInputs/FormRichTextInput/EntityMentionExtension';`
  - Sugestão: mover `EntityMentionExtension.ts` para um local neutro (ex.
    `app-web/src/shared/components/RichTextViewer/EntityMentionExtension.ts`
    ou uma nova pasta `shared/tiptap/`), com `FormRichTextInput` importando de
    lá em vez do inverso.

- **Trivial — dispatcher global importa componente de feature** —
  `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`
  importa `CreatureView` diretamente de
  `app/(authorized)/criaturas/components/CreatureView`, invertendo a direção
  usual de dependência (`shared/` não costuma depender de `app/`). Isso foi
  uma decisão explícita do plano da task (registro `entityType -> view`
  precisa apontar para views de feature) e não é um erro de implementação,
  mas vale registrar como ponto de atenção arquitetural para quando mais tipos
  de entidade ganharem view registrada (o acoplamento shared -> app tende a
  crescer).

- **Trivial — `query` não normalizado antes do envio à API**
  (`createMentionItemsResolver`, `FormRichTextInput/index.tsx`) — o
  `query.trim()` só é usado para validar o tamanho mínimo; o valor enviado ao
  endpoint (`params: { query }`) não é o valor trimado. Pouco provável de
  causar problema prático dado o caractere `@` de gatilho, mas por consistência
  vale enviar `query.trim()`.
  - Sugestão: `params: { query: query.trim() }`.

Pontos verificados e aprovados (sem achados):
- Hooks genéricos: `useGetEntityById` é reaproveitado corretamente em
  `CreatureView`/`EntityMentionNodeView` (via `ApiFactory(getAuthToken())`
  internamente); a chamada a `/search` dentro do `Suggestion.items` também usa
  `ApiFactory(getAuthToken())` diretamente, conforme orientado no plano (não é
  possível usar hook React dentro do callback fora do ciclo de render).
- Store global (`EntityMentionViewStore`) segue o padrão estrutural de
  `ThemeStore`/`FontAccessibilityStore` (fora de `PageStore`, exportado em
  `store/index.ts`); único ponto de melhoria seria considerar persistência,
  mas não é necessária aqui (estado efêmero de UI).
- `EntityMentionViewDispatcher` montado uma única vez em
  `app/(authorized)/layout.tsx` ao lado de `ThemeInitializer`/`ToastContainer`,
  conforme especificado.
- Debounce de 300ms e gatilho mínimo de 2 caracteres implementados
  corretamente (`MENTION_DEBOUNCE_MS`/`MENTION_MIN_QUERY_LENGTH`), sem chamar
  a API antes do mínimo.
- Menção de `user` corretamente não-clicável: `ENTITY_MENTION_VIEWABLE_TYPES`
  contém apenas `'creature'`, e tanto o estilo (`cursor: pointer` só via CSS
  `[data-clickable="true"]`) quanto o `handleClick` em
  `EntityMentionNodeView` respeitam essa flag.
  `EntityMentionViewDispatcher.ENTITY_MENTION_VIEW_REGISTRY` também só registra
  `creature`, tratando defensivamente tipos desconhecidos (retorna `null`,
  sem quebrar).
- Resolução do nome atual da entidade mencionada em `RichTextViewer`
  reaproveita `GET /creatures/:id`/`GET /users/:id` via `useGetEntityById`,
  conforme decisão de escopo registrada na etapa 1 (o plano previa consumir um
  endpoint dedicado caso ele existisse; como o `task-api` não expôs um
  endpoint de resolução dedicado, o reaproveitamento dos endpoints de detalhe
  já existentes está de acordo com a decisão de escopo registrada).
- Tratamento de 404: `CreatureView` diferencia `error.response?.status === 404`
  ("Entidade não encontrada.") de outros erros (mensagem genérica
  pré-existente) e chama `onNotFound?.()` apenas no caso 404, fechando o
  `ViewModal` do dispatcher; o uso existente em `criaturas/page.tsx` continua
  funcionando sem passar `onNotFound` (prop opcional).
- Ícones: todos os ícones usados nos arquivos revisados vêm de `react-icons`
  (`react-icons/fi`, `react-icons/bs`); nenhum uso de `@mui/icons-material`,
  SVG customizado ou emoji como ícone funcional nesta feature. Botões de
  toolbar com apenas ícone têm `aria-label` em pt-BR.
- Reaproveitamento: `RichTextViewer` substitui integralmente o antigo
  `RichTextValue`/`dangerouslySetInnerHTML` em `CreatureView` (confirmado, sem
  ocorrências residuais); `ViewModal` genérico reaproveitado sem duplicação
  no `EntityMentionViewDispatcher`.
- Tipagem: `ISearchResult` é usado de forma consistente entre
  `MentionSuggestionList`, o resolver de itens e o `command` do `Suggestion`;
  compatível com o formato retornado por
  `app-api/src/modules/search/dto/search-result-item-response.dto.ts`
  (`id`/`name`/`entityType`, com `entityType` em `'user' | 'creature'`
  minúsculo, batendo com `ENTITY_MENTION_TYPE_LABELS`/
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE`).
- Textos: mensagens visíveis ao usuário nos arquivos revisados estão em
  pt-BR ("Nenhuma entidade encontrada", "Não informado", "Entidade não
  encontrada.", rótulos "(criatura)"/"(usuário)").

## Correções pós-revisão (web-dev)
Status: concluído (achados "Recomendação"/"Trivial" endereçados; o achado
BLOQUEANTE de dependências em `package.json` permanece pendente, fora do
escopo de escrita deste agente — a ser tratado manualmente).

- Condição de corrida no resolver de sugestões: `createMentionItemsResolver`
  (`FormRichTextInput/index.tsx`) agora usa um contador `latestRequestId`
  incrementado a cada chamada; a resposta de uma requisição só é resolvida
  (`resolve`/`onLoadingChange(false)`) se seu `requestId` ainda for o mais
  recente no momento em que ela chega, descartando silenciosamente respostas
  fora de ordem.
- `isLoading` do `MentionSuggestionList`: passou a ser controlado de fato —
  `createMentionItemsResolver` agora recebe um callback `onLoadingChange` que
  é acionado com `true` ao iniciar uma busca válida (query com 2+ caracteres)
  e `false` ao concluir (sucesso, erro ou obsolescência); `createMentionSuggestion`
  liga esse callback ao componente ativo (`component?.updateProps`) via uma
  referência compartilhada (`notifyLoadingChange`), atualizando o menu já
  visível durante o debounce/latência de rede.
- Mensagem ambígua de estado vazio: `MentionSuggestionList` recebeu a prop
  `isQueryTooShort`, calculada em `buildProps` a partir do `query` do próprio
  `SuggestionProps` do TipTap; exibe "Digite ao menos 2 caracteres para
  buscar" quando a busca ainda não atingiu o mínimo, e "Nenhuma entidade
  encontrada" apenas para busca real sem resultados.
- Acessibilidade da menção clicável: `EntityMentionNodeView` agora adiciona
  `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Espaço) e
  `aria-label="Ver detalhes de <nome>"` quando `isClickable` é `true`,
  mantendo o comportamento visual e o clique por mouse inalterados.
- Fronteira estrutural do `EntityMentionExtension.ts`: a extensão
  compartilhada foi movida para
  `app-web/src/shared/components/RichTextViewer/EntityMentionExtension.ts`
  (local neutro, fora de `FormInputs`); `FormRichTextInput/index.tsx` e
  `EntityMentionNodeView.tsx` passaram a importar dessa localização. O
  arquivo antigo em
  `FormRichTextInput/EntityMentionExtension.ts` não pôde ser removido (as
  ferramentas disponíveis a este agente não incluem exclusão de arquivos) e
  foi convertido em um re-export/redirecionamento do novo caminho, sem lógica
  duplicada; recomenda-se removê-lo manualmente numa limpeza futura.
- `query` trimado antes do envio à API: `createMentionItemsResolver` agora
  calcula `trimmedQuery = query.trim()` uma única vez e usa esse valor tanto
  na validação de tamanho mínimo quanto em `params: { query: trimmedQuery }`.

Arquivos alterados:
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/MentionSuggestionList/index.tsx`
- `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/EntityMentionExtension.ts` (agora um re-export, ver nota acima)
- `app-web/src/shared/components/RichTextViewer/EntityMentionExtension.ts` (novo, local canônico)
- `app-web/src/shared/components/RichTextViewer/EntityMentionNodeView.tsx`
