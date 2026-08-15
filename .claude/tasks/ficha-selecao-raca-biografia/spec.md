# Spec: Seleção de raça e biografia na ficha de personagem

## Pedido original
Na página de visualização da ficha de personagem (`app-web`, `app/(authorized)/fichas/[id]`):
1. Raça: ao clicar em adicionar raça, não deve mais aparecer autocomplete. Deve abrir um modal com a listagem de raças (com suas informações) e uma opção de "visualizar" cada raça, para então selecionar a raça desejada. O mesmo comportamento vale ao editar a raça já presente na ficha.
2. Biografia: ao abrir o modal de adicionar biografia, também não deve mais haver autocomplete. Deve ser apresentada a lista de biografias em cards, para visualização e seleção. Depois de selecionada a biografia, aí sim são apresentadas as opções de atributos (passo 2 permanece exatamente como funciona hoje).

## Perguntas e respostas

- P: No fluxo de raça, a listagem deve ser em formato de tabela (como `SheetAbilitySelectionModal`/`EntityReferenceSelectionModal`) ou em cards? → R: Tabela, reaproveitando o padrão existente de `SheetAbilitySelectionModal` / `EntityReferenceSelectionModal` — colunas Imagem / Nome / Categoria / Tags / Ações.
- P: A listagem de raças deve ter filtros (nome/tags) e paginação, substituindo o carregamento atual com `perPage: 100`? → R: Sim — filtro por nome + filtro por tags + paginação (padrão `TablePagination` com `APP_DEFAULT_PAGE_SIZE`). Isso substitui o carregamento atual de `/races` com `perPage: 100` feito na página.
- P: O botão "visualizar" de cada raça deve abrir o quê? → R: Abre o `RaceView` completo dentro de um `ViewModal` aninhado ao modal de seleção (mesmo padrão já usado para a raça vinculada).
- P: Ao selecionar uma raça quando a ficha ainda não tem raça vinculada, a seleção é imediata (vincula e fecha) ou exige confirmação? → R: Vincula e fecha o modal direto, sem confirmação extra.
- P: Ao editar/trocar a raça já vinculada à ficha, deve haver algum aviso/confirmação antes de efetivar a troca? → R: Sim, exibir aviso/confirmação antes de efetivar a troca, porque a troca de raça impacta características, talentos e pontos de vida da ficha. Ou seja, o passo de confirmação existe apenas no fluxo de troca (edição); ao adicionar do zero, não há confirmação.
- P: No fluxo de biografia, o que cada card deve exibir (imagem, nome, tags, descrição resumida)? → R: Imagem, nome e tags. Nada além disso — descrição não está disponível em `IBiographyListItem` e não haverá mudança de API.
- P: A listagem de biografias deve ter filtros (nome/tags) e paginação? → R: Sim, grid de cards responsivo, com busca por nome + filtro por tags + paginação.
- P: Cada card de biografia deve ter ação de clique única (seleciona direto) ou botões separados de "visualizar" e "selecionar"? → R: Botões separados em cada card — "Visualizar" (abre `BiographyView` em `ViewModal`) e "Selecionar" (avança para o passo 2). O corpo do card não tem ação de clique.
- P: Ao editar uma biografia já vinculada à ficha, o modal deve abrir direto no passo 2 (atributos) ou voltar ao passo 1 (grid de seleção)? → R: Abre direto no passo 2 (atributos, como hoje), com opção "trocar".
- P: O botão "trocar" no passo 2 deve levar para onde? → R: Volta para o grid de cards de seleção (consistente com a resposta anterior).

## Escopo confirmado

Demanda 100% frontend (`app-web`). Nenhuma alteração em `app-api` está prevista — os endpoints `/races` e `/biographies` já suportam os filtros de nome, tags e paginação necessários. Caso surja algum gap real de API durante o planejamento/desenvolvimento, ele deve ser registrado e tratado à parte.

### Fluxo de raça
- Remoção do autocomplete atualmente usado para seleção de raça na ficha.
- Seleção passa a ocorrer por meio de um modal com listagem em formato de tabela (colunas: Imagem, Nome, Categoria, Tags, Ações), reaproveitando o padrão visual/estrutural já usado em `SheetAbilitySelectionModal` / `EntityReferenceSelectionModal`.
- A listagem oferece filtro por nome, filtro por tags e paginação (padrão `TablePagination` com `APP_DEFAULT_PAGE_SIZE`), substituindo o carregamento único de `/races` com `perPage: 100` feito hoje na página.
- Cada linha possui ação de "visualizar", que abre o conteúdo completo da raça (`RaceView`) dentro de um `ViewModal` aninhado ao modal de seleção — mesmo padrão já utilizado para exibir a raça atualmente vinculada à ficha.
- Fluxo de adicionar raça (ficha sem raça vinculada): ao selecionar uma raça na listagem, ela é vinculada à ficha e o modal é fechado imediatamente, sem etapa de confirmação.
- Fluxo de editar/trocar raça (ficha já com raça vinculada): ao selecionar uma nova raça, é exibido um aviso/confirmação antes de efetivar a troca, informando que a troca de raça impacta características, talentos e pontos de vida da ficha. A troca só é efetivada após confirmação do usuário.
- O comportamento de edição da raça (abrir o mesmo fluxo de seleção) é o mesmo tanto para adicionar quanto para editar, diferindo apenas pela presença ou não do passo de confirmação.

### Fluxo de biografia
- Remoção do autocomplete atualmente usado no primeiro passo do modal de adicionar/editar biografia.
- O primeiro passo passa a apresentar a listagem de biografias em um grid de cards responsivo, exibindo em cada card: imagem, nome e tags da biografia (sem descrição, pois não está disponível em `IBiographyListItem` e não haverá alteração de API).
- A listagem de biografias oferece busca por nome, filtro por tags e paginação.
- Cada card possui dois botões de ação independentes: "Visualizar" (abre o conteúdo completo da biografia — `BiographyView` — dentro de um `ViewModal`) e "Selecionar" (avança para o passo 2 de atributos). O corpo do card não possui ação de clique própria.
- Fluxo de adicionar biografia (ficha sem biografia vinculada): o modal abre no passo 1 (grid de seleção); após "Selecionar", avança para o passo 2 (atributos), mantendo o comportamento atual dessa etapa.
- Fluxo de editar biografia já vinculada à ficha: o modal abre diretamente no passo 2 (atributos), como ocorre hoje, com uma opção adicional "trocar" biografia.
- Ao acionar "trocar" no passo 2, o modal retorna ao passo 1 (grid de cards de seleção), permitindo escolher outra biografia.
- O passo 2 do fluxo de biografia (apresentação de melhorias/defeitos via checkbox com `ImprovementDefectCard`, melhoria de atributo livre, e demais regras de atributos) permanece inalterado em comportamento e validações, incluindo a validação de propriedade repetida com exibição de toast de erro.

### Restrições transversais
- Toda a interface de ambos os fluxos deve usar texto em português (pt-BR).
- Reaproveitamento obrigatório dos componentes compartilhados existentes: `FormModal`, `ViewModal`, `ConfirmationModal`, `DefaultTextInput`, `DefaultMultiAutocompleteInput`, `TagBadge`, `ImageAvatarPreview`, além dos botões e estilos definidos em `shared/constants`.
- Nenhuma alteração de código em `app-api`.
