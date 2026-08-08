# Spec: Equipamentos submenu (substituição de Equipamentos por Armas, Armaduras, Acessórios e Escudos)

## Pedido original
Substituir a entidade única "Equipamentos" (backend e frontend) por quatro novas entidades independentes — Armas, Armaduras, Acessórios e Escudos —, cada uma com seu próprio CRUD, mantendo a estrutura de campos hoje existente em Equipment, e reorganizar a navegação para que essas quatro entidades apareçam como um submenu "EQUIPAMENTOS" dentro da seção "Itens" da sidebar.

## Perguntas e respostas

- P: O que deve acontecer com a entidade/dados de Equipamentos atuais (backend e frontend)? Devem ser totalmente removidos, mantidos como "arquivados", ou migrados para uma das novas categorias?
  → R: Remover completamente. Migration de drop das tabelas `equipment` e `equipment_tags`, sem migração de registros. Deletar o módulo backend inteiro (`app-api/src/modules/equipment/`), remover seu registro em `app.module.ts`, e deletar a página/rota e todos os artefatos do frontend relacionados a Equipamentos (pasta `equipamentos/`, interface, form schema, store, rota em `routes.ts`, entrada de menção).

- P: As quatro novas entidades (Armas, Armaduras, Acessórios, Escudos) devem ter exatamente os mesmos campos que Equipment hoje (name, referenceImage, description, price, currency, privateInformation, tags), ou alguma delas precisa de campos específicos (ex.: dano de armas, bônus de CA de armaduras/escudos)?
  → R: Campos idênticos aos de Equipment hoje — `name` (obrigatório, único por entidade, indexado), `referenceImage`, `description`, `price` + `currency` (currencyId obrigatório quando price é informado), `privateInformation`, e tags com ordem de inserção preservada via tabela de junção própria por entidade. Nenhum campo específico por tipo nesta demanda (sem dano/tipo de dano em Armas, sem bônus de CA em Armaduras/Escudos). Cada entidade é totalmente independente das outras (tabelas separadas, unicidade de nome por tabela).

- P: Como deve funcionar o sistema de menções (rich text) para as quatro novas entidades — cada uma vira um tipo mencionável próprio no `LinkableEntityType`, ou elas continuam compartilhando um único tipo "equipment"?
  → R: Cada uma das 4 novas entidades ganha seu próprio valor em `LinkableEntityType` e passa a ser mencionável em texto rico, exatamente como Equipment é hoje. O valor `EQUIPMENT = 'equipment'` é removido do enum. Menções antigas apontando para `equipment` podem ficar quebradas/ignoradas (aceito pelo usuário, já que os dados serão removidos) — não é necessário script de migração de conteúdo. O frontend (`shared/constants/EntityMentions/` e `EntityMentionViewDispatcher`) deve ser atualizado na mesma medida: remover a entrada de equipment e adicionar as 4 novas.

- P: A busca global (`search.service.ts`) deve passar a cobrir as quatro novas entidades no lugar de Equipamentos?
  → R: Sim, as 4 novas entidades substituem Equipamentos, com a mesma cobertura que Equipment tem hoje.

- P: Quais devem ser as rotas/URLs (frontend e API) para as quatro novas entidades?
  → R: Frontend, rotas próprias no nível raiz: `/armas`, `/armaduras`, `/acessorios`, `/escudos` (pastas em `app-web/src/app/(authorized)/`), registradas em `APP_ROUTES.private` (ex.: `weapons`, `armors`, `accessories`, `shields`). API em inglês, seguindo o padrão dos demais módulos: `/weapons`, `/armors`, `/accessories`, `/shields`. Módulos backend em `app-api/src/modules/weapons/`, `armors/`, `accessories/`, `shields/`. Tabelas: `weapons`/`weapon_tags`, `armors`/`armor_tags`, `accessories`/`accessory_tags`, `shields`/`shield_tags`.

- P: Como deve se comportar visualmente o submenu "EQUIPAMENTOS" na sidebar — expande/colapsa (accordion) mostrando os 4 itens, ou é apenas um agrupamento visual sem interação?
  → R: A seção "Itens" ganha um item expansível (accordion) chamado "EQUIPAMENTOS", que ao ser aberto mostra os 4 itens (Armas, Armaduras, Acessórios, Escudos) indentados abaixo. Os demais itens da seção Itens (Materiais, Consumíveis, Munições, Utilitários) continuam como itens simples no mesmo nível, sem alteração de comportamento. Isso exige estender as estruturas `NavItem`/`NavSection` em `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` (hoje planas, sem suporte a subníveis) e o componente Sidebar correspondente. Há uma demanda anterior de accordion nas seções da sidebar (`.claude/tasks/sidebar-secoes-accordion/`) cujo padrão de expansão/estado deve ser reaproveitado em vez de inventar outro.

## Escopo confirmado

### Remoção de Equipamentos (backend)
- Remoção completa do módulo `app-api/src/modules/equipment/` (entidades `Equipment` e `EquipmentTag`, controller, service, module, todos os DTOs).
- Remoção do registro do módulo em `src/app.module.ts`.
- Remoção da integração com busca global: referências a Equipment em `src/modules/search/search.module.ts` e `src/modules/search/search.service.ts`.
- Remoção do valor `EQUIPMENT = 'equipment'` do enum `src/modules/search/enums/linkable-entity-type.enum.ts`.
- Criação de migration de drop das tabelas `equipment` e `equipment_tags`, sem migração/preservação de registros existentes.

### Remoção de Equipamentos (frontend)
- Remoção da pasta `app-web/src/app/(authorized)/equipamentos/` (page e todos os componentes: `EquipmentList`, `EquipmentListItem`, `EquipmentCreateForm`, `EquipmentFilterSection`, `EquipmentView`).
- Remoção da entrada de Equipamentos em `shared/routes.ts` (`APP_ROUTES.private.equipment`).
- Remoção de `shared/interfaces/Entities/Equipment/` e de sua referência em `shared/interfaces/Entities/index.ts`.
- Remoção de `shared/formSchemas/EquipmentFormSchema/` e de sua referência em `shared/formSchemas/index.ts`.
- Remoção de `store/PageStore/EquipmentStore/` e de sua referência em `store/index.ts`.
- Remoção da entrada de Equipamentos em `shared/constants/EntityMentions/` e no `shared/components/EntityMentionViewDispatcher/`.
- Remoção da entrada de Equipamentos em `app/(authorized)/components/Sidebar/data/index.ts`.

### Novas entidades: Armas, Armaduras, Acessórios, Escudos
Cada uma das quatro entidades é independente das demais (tabela própria, unicidade de nome própria) e replica exatamente a estrutura de campos hoje existente em Equipment:
- `name`: obrigatório, único por entidade, indexado.
- `referenceImage`: opcional.
- `description`: opcional, texto rico (HTML).
- `price`: opcional (integer).
- `currency`: relação para `Currency`; `currencyId` obrigatório quando `price` for informado; comportamento de exclusão (onDelete) igual ao atual de Equipment.
- `privateInformation`: opcional (texto).
- `tags`: associação via tabela de junção própria por entidade, com ordem de inserção preservada, seguindo o mesmo padrão de `EquipmentTag` (unicidade [entidade, tag], onDelete CASCADE).

Nenhum campo específico por tipo de entidade está incluído nesta demanda (ex.: sem dano/tipo de dano para Armas, sem bônus de CA para Armaduras/Escudos).

#### Backend — módulos e tabelas por entidade
- Weapons: módulo `app-api/src/modules/weapons/`, rota da API `/weapons`, tabelas `weapons` e `weapon_tags`.
- Armors: módulo `app-api/src/modules/armors/`, rota da API `/armors`, tabelas `armors` e `armor_tags`.
- Accessories: módulo `app-api/src/modules/accessories/`, rota da API `/accessories`, tabelas `accessories` e `accessory_tags`.
- Shields: módulo `app-api/src/modules/shields/`, rota da API `/shields`, tabelas `shields` e `shield_tags`.
- Cada módulo replica a mesma estrutura de arquivos hoje existente em `equipment/` (entidade, entidade de junção de tags, controller, service, module, DTOs de create/update/query/response/lista paginada), adaptada ao nome da entidade correspondente.
- Registro de cada novo módulo em `src/app.module.ts`.
- Migrations de criação das quatro novas tabelas principais e das quatro tabelas de junção de tags, seguindo o padrão das migrations existentes de Equipment.

#### Busca global
- `search.module.ts` e `search.service.ts` passam a cobrir as quatro novas entidades (Weapons, Armors, Accessories, Shields), com a mesma cobertura que Equipment tem hoje, no lugar de Equipment.

#### Sistema de menções (rich text)
- `LinkableEntityType` (enum) ganha quatro novos valores, um por entidade nova, substituindo o valor removido `equipment`.
- Cada entidade nova passa a ser mencionável em texto rico da mesma forma que Equipment é hoje.
- Menções antigas que apontavam para `equipment` podem ficar quebradas/ignoradas; nenhuma migração de conteúdo de menções é necessária.

#### Frontend — rotas e páginas por entidade
- Weapons: rota `/armas`, pasta `app-web/src/app/(authorized)/armas/`, entrada `weapons` em `APP_ROUTES.private`.
- Armors: rota `/armaduras`, pasta `app-web/src/app/(authorized)/armaduras/`, entrada `armors` em `APP_ROUTES.private`.
- Accessories: rota `/acessorios`, pasta `app-web/src/app/(authorized)/acessorios/`, entrada `accessories` em `APP_ROUTES.private`.
- Shields: rota `/escudos`, pasta `app-web/src/app/(authorized)/escudos/`, entrada `shields` em `APP_ROUTES.private`.
- Cada rota/página replica a mesma estrutura hoje existente em `equipamentos/` (page + componentes de listagem, item de lista, formulário de criação/edição, seção de filtros, visualização), adaptada à entidade correspondente.
- Cada entidade nova ganha sua própria interface em `shared/interfaces/Entities/`, seu próprio form schema em `shared/formSchemas/`, seu próprio store em `store/PageStore/`, e sua própria entrada em `shared/constants/EntityMentions/` e no `EntityMentionViewDispatcher`.

#### Sidebar
- A seção "Itens" (`app/(authorized)/components/Sidebar/data/index.ts`) ganha um item expansível (accordion) chamado "EQUIPAMENTOS", contendo os 4 itens Armas, Armaduras, Acessórios e Escudos, exibidos indentados abaixo quando expandido.
- Os demais itens da seção Itens (Materiais, Consumíveis, Munições, Utilitários) permanecem como itens simples no mesmo nível, sem alteração de comportamento.
- As estruturas `NavItem`/`NavSection` (hoje planas, sem suporte a subníveis) precisam ser estendidas para suportar itens com filhos, e o componente Sidebar correspondente precisa suportar a renderização e o estado de expansão desse novo nível.
- O padrão de expansão/estado de accordion já implementado na demanda anterior `.claude/tasks/sidebar-secoes-accordion/` deve ser reaproveitado para este novo nível de submenu, em vez de um padrão novo.