# Spec: Perícias e Condições

## Pedido original

Implementar duas novas entidades/páginas completas (CRUD full-stack, app-api + app-web): "Perícias" (skills) e "Condições" (conditions).

Requisitos funcionais:
- Ambas as entidades devem ficar na seção "JOGO" do menu de navegação (Sidebar), como novas páginas.
- Página de listagem (para cada entidade): listagem paginada com filtro por nome; cada item com ações visualizar, editar e deletar.
- Campos de cadastro (idênticos para as duas entidades):
  - Nome* (obrigatório): campo de texto comum.
  - Tags: input padrão de tags já existente no projeto.
  - Descrição: rich text, não obrigatório.
  - "Adicionar Seção": comportamento EXATAMENTE igual ao campo "Adicionar Seção" da entidade "locais", replicando estrutura de dados e componentes.
  - Propriedades da entidade em inglês.
- Modal de visualização (para cada entidade), nesta ordem: (1) nome da entidade centralizado no topo; (2) abaixo, as tags; (3) abaixo, a descrição em linha completa (largura total); (4) depois da descrição, as seções adicionais, no mesmo padrão de exibição do modal de visualização de "locais".
- Integração com busca global: atualizar `search.controller`/`search.service` (app-api) e a busca correspondente no app-web para incluir as novas entidades.
- Permissões por tipo de usuário: no app-api aplicar `GoogleAccessGuard` (usuários Google = somente leitura); no app-web ocultar criar/editar/excluir para usuários Google via `useIsGoogleUser`, deixando apenas "visualizar".
- Ambas entidades têm exatamente a mesma estrutura de campos e comportamento — duas implementações paralelas do mesmo padrão, apenas com nomes/rotas diferentes.

Escopo estendido posteriormente pelo próprio solicitante (ver seção de decisões abaixo): integração completa de "Perícias" e "Condições" com o sistema de menções (@mention) do rich text, e correção da mesma lacuna de menções hoje existente na entidade "Regras".

## Perguntas e respostas

Uma investigação prévia do código já havia sido feita e as ambiguidades já haviam sido esclarecidas diretamente com o usuário antes desta etapa formal de spec. As decisões definitivas resultantes desse esclarecimento foram:

- P: Como deve funcionar a integração de "Perícias" e "Condições" com o sistema de menções (@mention) do editor de texto rico? → R: Integração completa: rótulo em pt-BR em `ENTITY_MENTION_TYPE_LABELS`, menção clicável no texto via `ENTITY_MENTION_VIEWABLE_TYPES` + `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, e modal de visualização conectado ao `EntityMentionViewDispatcher`, reaproveitando os componentes de View criados para a listagem.
- P: A entidade "Regras" hoje não está registrada no sistema de menções (não tem rótulo pt-BR, não é clicável e não abre modal de visualização a partir de uma menção) — isso deve ser corrigido neste mesmo trabalho? → R: Sim. Registrar "rule" com rótulo pt-BR em `ENTITY_MENTION_TYPE_LABELS`, torná-la clicável via `ENTITY_MENTION_VIEWABLE_TYPES` + `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, e conectá-la ao `EntityMentionViewDispatcher`, uniformizando com Locais/Criaturas/Perícias/Condições.

Achados de investigação de código, tratados como base confirmada (não são perguntas ao usuário, mas checagens de convenções existentes que eliminam ambiguidade de implementação):

- O padrão de campo "Adicionar Seção" está implementado de forma idêntica em `Location`/`LocationSection` e replicado em `Rule`/`RuleSection`: entidade relacionada via `OneToMany`, com `label` (texto, obrigatório), `description` (rich text/HTML, opcional) e coluna `order` (posição de inserção, sem reordenação). No app-web: campos dentro de `useFieldArray`, botão "Adicionar Seção" alinhado à direita, exibição em 2 colunas no formulário e no modal de visualização, remoção direta sem confirmação, bloco de seções omitido no modal quando vazio.
- O padrão de campo Tags está implementado como `ManyToMany` com `Tag` via tabela de junção dedicada por entidade (ex.: `location_tags`), exposto no DTO de criação/edição como `tagIds?: string[]` (array de UUIDs, opcional) e populado na resposta como array de objetos `Tag`. No app-web, é renderizado com o input padrão de autocomplete múltiplo de tags, buscando todas as tags sem filtro por tipo.
- O padrão de permissão "Google = somente leitura" já está implementado de ponta a ponta no módulo de Regras: no app-api, o controller aplica `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` e `@GoogleAccess('read-only')` a nível de controller (cobrindo automaticamente create/update/delete); no app-web, `useIsGoogleUser()` é usado tanto na página de listagem quanto no item de listagem para ocultar as ações de criar/editar/excluir, mantendo apenas visualizar.
- O módulo "Regras" (`app-api/src/modules/rules/**`, `app-web/src/app/(authorized)/regras/**`) é o par de referência mais próximo do pedido: nome único, descrição rich text, seções, paginação, filtro por nome, ViewModal/FormModal/ConfirmationModal — faltando apenas o campo de tags, cujo padrão vem do módulo de Locais.
- A seção "JOGO" da Sidebar já existe e atualmente contém apenas o item "Regras" (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`); "Perícias" e "Condições" devem ser adicionadas a essa mesma seção.
- A busca usada pelo autocomplete de menções no app-web (`GET /search`, consumido em `FormRichTextInput`/`MentionSuggestionList`) é o mesmo endpoint de busca global mencionado no pedido — não existe uma barra de busca global separada no app-web hoje. Assim, incluir "Perícias"/"Condições" no `SearchService` do app-api (novo `Repository` injetado + nova entrada no array de entidades pesquisáveis) e registrá-las em `ENTITY_MENTION_TYPE_LABELS` no app-web cobre integralmente o requisito de "busca correspondente no app-web".
- Confirmado por leitura direta do código: `Rule` não está presente em `ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_VIEWABLE_TYPES`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE` nem no `ENTITY_MENTION_VIEW_REGISTRY` do `EntityMentionViewDispatcher` (arquivo `app-web/src/shared/constants/EntityMentions/index.ts` e `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`), embora já esteja registrada no `SearchService`/`LinkableEntityType` do app-api. Isso confirma a lacuna relatada pelo usuário na decisão de escopo estendido.
- O layout do modal de visualização de Locais (nome centralizado no topo → tags logo abaixo → bloco de descrição em largura total → grade de seções adicionais) está confirmado em `LocationView`, e é o padrão a seguir para Perícias e Condições, na mesma ordem descrita no pedido original.

## Escopo confirmado

### Escopo geral

Duas novas entidades de domínio, "Perícias" (nome técnico em inglês: `Skill`) e "Condições" (nome técnico em inglês: `Condition`), serão implementadas como CRUD completo em app-api e app-web, seguindo estritamente o padrão já existente do módulo "Regras" acrescido do campo de tags no padrão do módulo "Locais". As duas entidades têm exatamente a mesma estrutura de campos e comportamento, diferindo apenas em nome e rotas.

### Campos de cada entidade (Perícias e Condições, idênticos entre si)

- Nome: texto, obrigatório, único.
- Tags: associação muitos-para-muitos com a entidade de Tags já existente, opcional, sem filtro por tipo de tag.
- Descrição: rich text (HTML), opcional.
- Seções adicionais ("Adicionar Seção"): lista de seções compostas por título (texto, obrigatório) e descrição (rich text, opcional), adicionadas dinamicamente pelo usuário, sem limite mínimo ou máximo, sem reordenação, mantendo a ordem de inserção, com remoção direta (sem confirmação) — replicando integralmente a estrutura de dados e o comportamento de UI já usados no campo equivalente de "Locais".

### API (app-api)

- Duas novas entidades TypeORM, `Skill` e `Condition` (tabelas `skills` e `conditions`), cada uma com sua entidade de seção relacionada (`SkillSection`/`ConditionSection`), replicando a estrutura de `Rule`/`RuleSection` acrescida do relacionamento de tags no padrão de `Location`.
- Dois novos módulos Nest (`skills` e `conditions`) com controller, service, DTOs de criação/edição/resposta/listagem/paginação e query de filtro por nome, seguindo o padrão de `rules` (paginação, filtro por nome, respostas de listagem enxutas vs. resposta de detalhe completa).
- Endpoints REST para cada entidade cobrindo: criar, listar paginado com filtro por nome, buscar por id, atualizar e remover — no padrão de rotas usado por `rules` (`/rules` → equivalente para `/skills` e `/conditions`).
- Ambos os controllers protegidos com `JwtAuthGuard` + `GoogleAccessGuard` e `@GoogleAccess('read-only')`, restringindo usuários autenticados via Google a operações de leitura, no mesmo padrão do controller de `rules`.
- `SearchService`/`SearchController` do app-api atualizados para incluir `Skill` e `Condition` como entidades pesquisáveis: novos repositórios injetados, novas entradas no array de entidades pesquisáveis e dois novos valores no enum `LinkableEntityType` (ex.: `skill`, `condition`).

### Frontend (app-web)

- Duas novas páginas sob `(authorized)`, com rotas próprias registradas em `shared/routes.ts` (`MENU_ROUTES`/`APP_ROUTES.private`), seguindo o padrão de nomenclatura de rota em português já usado pelas demais entidades (ex.: `/pericias`, `/condicoes`).
- Duas novas entradas de menu na seção "JOGO" da Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`), ao lado do item já existente "Regras", cada uma com ícone próprio.
- Para cada entidade: página de listagem paginada com filtro por nome e ações de visualizar/editar/deletar por item, modal de criação/edição com os campos Nome, Tags, Descrição (rich text) e seções adicionais, modal de visualização e modal de confirmação de exclusão — reaproveitando os hooks genéricos de CRUD (`useGetEntityList`, `usePostEntity`, `usePutEntity`, `useDeleteEntity`) e os componentes de UI compartilhados já usados por "Regras" e "Locais".
- Layout do modal de visualização, na seguinte ordem vertical: (1) nome da entidade centralizado no topo; (2) tags logo abaixo do nome; (3) bloco de descrição ocupando a largura total; (4) grade de seções adicionais (2 colunas, omitida quando não houver seções) — replicando o padrão já usado no modal de visualização de "Locais".
- Ações de criar/editar/excluir ocultadas para usuários autenticados via Google (`useIsGoogleUser`) tanto na listagem quanto no item de listagem de cada entidade, mantendo disponível apenas a ação de visualizar — no mesmo padrão já aplicado em "Regras".

### Integração com busca e menções (@mention), incluindo correção de "Regras"

- `ENTITY_MENTION_TYPE_LABELS` (app-web) atualizado com rótulos em pt-BR para os novos tipos de entidade `skill` e `condition`, e também com o rótulo em pt-BR para o tipo `rule`, hoje ausente.
- `ENTITY_MENTION_DETAIL_URL_BY_TYPE` e `ENTITY_MENTION_VIEWABLE_TYPES` (app-web) atualizados para incluir `skill`, `condition` e `rule`, tornando menções desses três tipos clicáveis no texto renderizado pelo `RichTextViewer`.
- `EntityMentionViewDispatcher` (app-web) atualizado com entradas de registro para `skill`, `condition` e `rule`, reaproveitando os componentes de visualização criados para as páginas de listagem de Perícias e Condições, e o componente de visualização já existente de Regras (`RuleView`).
- Como o autocomplete de menções (`GET /search`) consome o mesmo `SearchService` do app-api, a inclusão de `Skill`/`Condition` nesse serviço (já descrita na seção de API) é suficiente para que ambas as entidades passem a aparecer nas sugestões de menção do editor de texto rico — não há barra de busca global separada no app-web a atualizar além disso.

### Fora de escopo

- Qualquer decisão de nomes de arquivos, classes, funções, migrations específicas ou demais detalhes de implementação — cabe à etapa de planejamento técnico subsequente.
- Alterações em qualquer outra entidade além de "Perícias", "Condições" e da correção pontual de registro de menções de "Regras" descrita acima.
