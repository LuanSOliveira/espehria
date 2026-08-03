# Task Web: Melhorias — tipo "Atributo" (ImprovementFlawType/Property ManyToMany)

## Contexto
Não há spec.md para esta demanda. O modelo de dados já foi validado com o usuário: no
backend, a relação entre `ImprovementFlawType` e `ImprovementFlawProperty` está mudando
de ManyToOne para ManyToMany, para permitir um novo tipo "Atributo" que reaproveita as
propriedades Força/Destreza/Constituição/Inteligência/Sabedoria/Carisma já existentes
sob "Teste de Resistência".

Consequência no contrato da API: `improvement-flaw-property-response.dto.ts` deixa de
expor `typeId: string` e passa a expor `typeIds: string[]`. O endpoint
`GET /improvement-flaw-properties` continua sem filtro por tipo (o filtro é feito no
front).

Esta é uma mudança pequena e cirúrgica no `app-web`: não há novos componentes, páginas
ou rotas.

## ALERTA IMPORTANTE — não fazer rename cego

Existem DOIS `typeId` distintos no app-web e apenas UM deles deve ser alterado:

- **Alterar**: `IImprovementDefectProperty.typeId` (campo da PROPRIEDADE, vindo da API)
  → deve virar `typeIds: string[]`. É consumido apenas em
  `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx` (linha ~69,
  dentro do cálculo de `propertyOptions`).
- **NÃO alterar**: `typeId` do `ImprovementDefectFormSchema`
  (`app-web/src/shared/formSchemas/ImprovementDefectFormSchema/index.ts`, linhas 10 e
  24) e seus usos em `ImprovementDefectAddModal` (`watch('typeId')` linha 53,
  `data.typeId` linha 73, `name="typeId"` linha 105 no `FormAutocompleteInput`). Esse
  `typeId` é o campo do FORMULÁRIO que guarda o tipo selecionado pelo usuário — uma
  entidade de dados totalmente diferente (`ImprovementDefectFormData.typeId`), sem
  relação com o campo da propriedade. Renomear/alterar este campo quebra o formulário
  de Melhorias/Defeitos usado por Treinamentos, Características e Biografias.

Investigação já confirmou que nenhum outro arquivo do app-web lê `property.typeId`:
`ImprovementDefectCard` e `ImprovementDefectListField` (consumidores de
`IImprovementDefectItem`, que embute `property: IImprovementDefectProperty`) usam
apenas `type.name`, `property.name`, `type.id` e `property.id` — não tocam em
`typeId`/`typeIds`, portanto não precisam de alteração.
`useImprovementDefectPropertiesQuery` apenas repassa o array retornado pela API
(tipado como `IImprovementDefectProperty[]`) e não referencia `typeId` diretamente —
basta que a interface seja atualizada para o tipo continuar correto.

## Etapas

### 1. web-dev
Status: concluído
Componentes: nenhum (alteração em `ImprovementDefectAddModal`, componente já existente)
Arquivos:
- app-web/src/shared/interfaces/Entities/ImprovementDefectProperty/index.ts (`typeId: string` → `typeIds: string[]`)
- app-web/src/shared/components/ImprovementDefectAddModal/index.tsx (filtro de `propertyOptions` ajustado para `property.typeIds.includes(selectedTypeId)`; `typeId` do formulário mantido intacto)
- app-web/src/hooks/Queries/EntityQueries/useImprovementDefectPropertiesQuery/index.ts: conferido, sem alterações necessárias
- Confirmado via busca por `typeId` em todo `app-web/src`: `ImprovementDefectCard` e `ImprovementDefectListField` não referenciam `typeId`/`typeIds`; único `typeId` remanescente é o do `ImprovementDefectFormSchema`/formulário, preservado como especificado

#### Funcionalidade
- Não há páginas/rotas novas nem alteradas — mudança restrita a interface e a um
  filtro dentro de um componente já existente.
- Integrações com API: `GET /improvement-flaw-properties`
  (`useImprovementDefectPropertiesQuery`) — endpoint inalterado na URL/uso, mas o
  formato dos itens retornados muda (`typeId: string` → `typeIds: string[]`).
- Alterações a fazer:
  1. `app-web/src/shared/interfaces/Entities/ImprovementDefectProperty/index.ts`:
     trocar o campo `typeId: string` por `typeIds: string[]` na interface
     `IImprovementDefectProperty`.
  2. `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx` (linha ~69):
     ajustar o filtro de `propertyOptions` de
     `(property) => !selectedTypeId || property.typeId === selectedTypeId` para
     `(property) => !selectedTypeId || property.typeIds.includes(selectedTypeId)`.
     Não alterar nada mais neste arquivo — em especial, `watch('typeId')` (linha 53),
     `data.typeId` (linha 73) e `name="typeId"` (linha 105) referem-se ao campo do
     formulário (`ImprovementDefectFormData.typeId`) e devem permanecer exatamente
     como estão.
  3. `app-web/src/hooks/Queries/EntityQueries/useImprovementDefectPropertiesQuery/index.ts`:
     conferir que nada além da tipagem `IImprovementDefectProperty[]` referencia o
     campo `typeId`; nenhuma mudança de código é esperada além de a tipagem já vir
     corrigida pela alteração do item 1.
  4. Confirmar (sem alterar, exceto se algo escapou à investigação prévia) que
     `ImprovementDefectCard` (`app-web/src/shared/components/ImprovementDefectCard/index.tsx`)
     e `ImprovementDefectListField` (`app-web/src/shared/components/ImprovementDefectListField/index.tsx`)
     não leem `property.typeId`/`typeIds` — eles hoje usam apenas `type.name`,
     `property.name`, `type.id` e `property.id`.
  5. Rodar uma busca por `typeId` em todo `app-web/src` após a alteração para garantir
     que sobrou apenas o `typeId` do `ImprovementDefectFormSchema`/formulário (não
     alterado) e nenhum resquício de `property.typeId`.
- Formulário/validação: nenhuma mudança de campos ou regras de validação do
  `ImprovementDefectFormSchema` — o `typeId` do formulário continua exatamente igual.
  Apenas o filtro de opções de propriedade (derivado dos dados da API) muda de forma
  interna, sem alterar UX nem mensagens.
- Acesso Google: não aplicável — este componente é um modal de seleção usado dentro de
  formulários de Treinamentos/Características/Biografias, não uma listagem com
  ações de criar/editar/excluir sujeitas à regra de somente-visualização para
  `provider: 'google'`.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/interfaces/Entities/ImprovementDefectProperty/index.ts`
- `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx`
- `app-web/src/hooks/Queries/EntityQueries/useImprovementDefectPropertiesQuery/index.ts`
- `app-web/src/shared/formSchemas/ImprovementDefectFormSchema/index.ts`
- `app-web/src/shared/components/ImprovementDefectCard/index.tsx`
- `app-web/src/shared/components/ImprovementDefectListField/index.tsx`
- `app-web/src/shared/interfaces/Entities/ImprovementDefectItem/index.ts`

Verificações realizadas:
- `IImprovementDefectProperty` expõe `typeIds: string[]`, idêntico ao contrato de
  `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`
  (`typeIds: string[]`, preenchido via `property.types.map((type) => type.id)`).
- O filtro de `propertyOptions` em `ImprovementDefectAddModal` (linha 68-70) usa
  `(property) => !selectedTypeId || property.typeIds.includes(selectedTypeId)`. Como
  `selectedTypeId` é `''` (string vazia) quando nenhum tipo está selecionado —
  `improvementDefectFormDefaultValues.typeId = ''` —, a condição `!selectedTypeId` é
  `true` nesse caso e todas as propriedades são exibidas, preservando o comportamento
  original.
- O `typeId` do formulário (`ImprovementDefectFormSchema`/`ImprovementDefectFormData`)
  permanece intacto: `watch('typeId')` (linha 53), `data.typeId` (linha 73) e
  `name="typeId"` (linha 105) não foram alterados, e o schema em
  `ImprovementDefectFormSchema/index.ts` continua com `typeId: z.string().min(1, ...)`
  e default `typeId: ''`. Não há rename cego — os dois `typeId` distintos (campo do
  formulário vs. campo da propriedade vindo da API) foram tratados corretamente.
- Busca por `typeId` em todo `app-web/src` confirma que não sobrou nenhum resquício de
  `property.typeId`: o único consumo de `property.typeIds` está no filtro do modal, e
  os demais matches de `typeId` pertencem exclusivamente ao
  `ImprovementDefectFormSchema` e a seus usos dentro de `ImprovementDefectAddModal`.
- `ImprovementDefectCard` e `ImprovementDefectListField` (consumidores de
  `IImprovementDefectItem`) usam apenas `item.type.name`, `item.property.name`,
  `item.type.id` e `item.property.id` — não referenciam `typeId`/`typeIds`, portanto
  não exigiam alteração, como previsto na task.
- `useImprovementDefectPropertiesQuery` apenas repassa `IImprovementDefectProperty[]`
  da resposta da API, sem lógica própria de `typeId`; a tipagem já reflete
  corretamente `typeIds: string[]` por herança da interface atualizada.
- Nenhum problema de tipagem, hooks fora de ordem, imports quebrados, acessibilidade
  (o `IconButton` de remoção em `ImprovementDefectCard` já possui `aria-label` em
  pt-BR) ou padrões de projeto (ícone via `react-icons`, componentes `Form*Input`
  reaproveitados) foi identificado nos arquivos tocados por esta mudança.
