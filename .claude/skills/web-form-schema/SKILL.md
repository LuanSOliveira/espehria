---
name: web-form-schema
description: Use sempre que for necessário criar um schema zod para validação de formulário no app-web. Define o padrão já estabelecido em shared/formSchemas — exportar o schema, a tipagem inferida, o resolver do react-hook-form e os valores default, incluindo a variante de edição quando aplicável.
---

# Padrão de schema de formulário com zod (app-web)

Referência completa no código: `app-web/src/shared/formSchemas/UserFormSchema/index.ts`.

## Local e nome do arquivo

`shared/formSchemas/<Feature>FormSchema/index.ts` — uma pasta por formulário, mesmo
padrão de pasta-por-módulo usado em outras partes do projeto (`hooks/Queries`, etc.).
Reexporte pelo barrel `shared/formSchemas/index.ts`.

## O que o arquivo deve exportar

1. **Campos base**, como um objeto simples (não um `z.object` ainda) quando o
   formulário tiver uma variante de edição — isso permite reaproveitar os mesmos
   campos nas duas variantes sem duplicar as regras:
   ```ts
   const <feature>BaseFields = {
     name: z.string().min(1, 'Informe o nome').min(2, 'Nome muito curto'),
     email: z.string().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
   };
   ```
   Mensagens de erro sempre em pt-BR, objetivas e no mesmo tom das existentes.

2. **Schema principal** (`<feature>FormSchema`), com `z.object({ ...<feature>BaseFields,
   <demais campos exclusivos da criação> })`.

3. **Tipo inferido** (`<Feature>FormData`) via `z.infer<typeof <feature>FormSchema>` —
   nunca declare a interface do formulário manualmente à parte; sempre infira do
   schema para que tipo e validação nunca divirjam.

4. **Resolver** (`<feature>FormResolver`) via `zodResolver(<feature>FormSchema)`,
   pronto para passar direto em `useForm({ resolver: ... })`.

5. **Valores default** (`<feature>FormDefaultValues`), tipados como `<Feature>FormData`,
   com todos os campos preenchidos com valor vazio/neutro coerente com o tipo.

## Variante de edição (quando o formulário serve para criar E editar)

Quando um campo tem regra diferente na edição (o caso mais comum no projeto é senha
opcional na edição), crie uma segunda variante reaproveitando os campos base:

```ts
export const <feature>EditFormSchema = z.object({
  ...<feature>BaseFields,
  password: z.union([
    z.literal(''),
    z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  ]),
});

export const <feature>EditFormResolver = zodResolver(<feature>EditFormSchema);
```

Não crie um segundo conjunto de `FormData`/`DefaultValues` para a variante de edição a
menos que o formato dos dados realmente mude — normalmente o mesmo `<Feature>FormData`
e `<feature>FormDefaultValues` servem para as duas variantes, e só o `resolver` muda
entre criar e editar (o componente de formulário decide qual resolver usar com base em
estar ou não em modo edição — isso é responsabilidade do componente, não do schema).

## Uso no componente

O componente de formulário consome o schema assim (não faça diferente):
```ts
const { control, handleSubmit, reset } = useForm<FeatureFormData>({
  resolver: isEditMode ? featureEditFormResolver : featureFormResolver,
  defaultValues: featureFormDefaultValues,
});
```
