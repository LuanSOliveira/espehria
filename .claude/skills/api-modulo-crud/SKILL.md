---
name: api-modulo-crud
description: Use sempre que for necessário criar um módulo novo (ou o CRUD completo de uma entidade) no app-api. Define a estrutura completa esperada — entidade, DTOs, service, controller e module — seguindo exatamente o padrão já implementado no módulo `users`.
---

# Padrão de módulo NestJS (app-api)

Referência completa no código: `app-api/src/modules/users/` (entidade, DTOs, service,
controller, module) — use como modelo linha a linha para qualquer módulo novo.

## Estrutura de pastas

```
src/modules/<nome>/
  entities/<nome>.entity.ts
  dto/
    create-<nome>.dto.ts
    update-<nome>.dto.ts
    find-<nome>-query.dto.ts        (se houver listagem)
    <nome>-response.dto.ts
    paginated-<nome>-response.dto.ts (se houver listagem)
  enums/<algo>.enum.ts               (se houver campo enum)
  <nome>.service.ts
  <nome>.controller.ts
  <nome>.module.ts
```

## 1. Entidade

```ts
@Entity('<tabela_plural>')
export class Nome extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })   // quando o campo precisa ser único
  @Column()
  campo!: string;

  @Column({ type: 'varchar', nullable: true, select: false }) // campo sensível
  campoSensivel!: string | null;
}
```

- Sempre `extends BaseEntity` (`common/entities/base.entity.ts`) — isso já dá `id`
  (uuid), `createdAt`, `updatedAt` com `@ApiProperty` prontos; não redeclare esses
  campos.
- `@ApiProperty()` em todo campo que deve aparecer na resposta pública; **omita**
  `@ApiProperty` em campos sensíveis (senha, tokens) e marque-os `select: false` para
  nunca vazarem em queries normais (só aparecem com `.addSelect(...)` explícito no
  service, como em `findByEmailWithPassword`).
- `autoLoadEntities: true` já está ativo em `app.module.ts` — não é preciso registrar a
  entidade manualmente em nenhum lugar além do próprio `<nome>.module.ts`
  (`TypeOrmModule.forFeature`).

## 2. DTOs

- **Create**: `class-validator` em cada campo (`@IsEmail`, `@IsString`, `@MinLength`,
  etc.) + `@ApiProperty({ example: ... })` com exemplo realista.
- **Update**: mesmos campos, mas normalmente opcionais (avalie se cabe usar
  `PartialType(CreateXDto)` do `@nestjs/swagger` quando os campos forem exatamente os
  mesmos, seguindo o que for mais consistente com o restante do módulo).
- **Find query** (quando há listagem): campos de filtro opcionais
  (`@IsOptional()`) + paginação — `page`/`perPage` como `@Type(() => Number) @IsInt()
  @Min(1)`, ambos `@ApiPropertyOptional`.
- **Response**: classe simples com `@ApiProperty()` nos campos expostos (nunca os
  `select: false` da entidade) e um método estático:
  ```ts
  static fromEntity(entity: Nome): NomeResponseDto {
    const dto = new NomeResponseDto();
    dto.id = entity.id;
    // ...um campo por vez, nunca spread da entidade inteira
    return dto;
  }
  ```
  Nunca faça `{ ...entity }` ou retorne a entidade direto do controller — sempre passe
  pelo `fromEntity`, campo a campo, para controlar exatamente o que é exposto.
- **Paginated response** (quando há listagem): `data: XResponseDto[]`, `total`,
  `page`, `perPage`, `totalPages`, todos com `@ApiProperty()`.

## 3. Service

- `@Injectable()`, injeta o repositório via `@InjectRepository(Nome) private readonly
  nomeRepository: Repository<Nome>`.
- Métodos de busca simples via `findOneBy`/`find`; buscas com filtro dinâmico e
  paginação via `createQueryBuilder`, seguindo exatamente o padrão de
  `findAllLocalPaginated`:
  ```ts
  const page = query.page ?? DEFAULT_PAGE;
  const perPage = query.perPage ?? DEFAULT_PER_PAGE; // common/variables/pagination
  const [data, total] = await queryBuilder
    .orderBy(...)
    .skip((page - 1) * perPage)
    .take(perPage)
    .getManyAndCount();
  return { data, total, page, perPage };
  ```
- Erros de negócio via exceptions do Nest (`NotFoundException`, `ConflictException`,
  etc.) com mensagem em pt-BR objetiva (ex.: `'Usuário não encontrado.'`,
  `'Este e-mail já está em uso.'`) — nunca retorne `null`/`undefined` silenciosamente
  em um fluxo que deveria falhar.
- Nunca faça hash/lógica sensível fora do service (ex.: hashing de senha com bcrypt
  fica no service, nunca no controller).

## 4. Controller

```ts
@ApiTags('<nome-plural>')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('<nome-plural>')
export class NomeController {
  constructor(private readonly nomeService: NomeService) {}

  @Post()
  async create(@Body() dto: CreateNomeDto): Promise<NomeResponseDto> {
    const entity = await this.nomeService.create(dto);
    return NomeResponseDto.fromEntity(entity);
  }

  @Get()
  async findAll(@Query() query: FindNomeQueryDto): Promise<PaginatedNomeResponseDto> {
    const { data, total, page, perPage } = await this.nomeService.findAllPaginated(query);
    return {
      data: data.map((e) => NomeResponseDto.fromEntity(e)),
      total, page, perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<NomeResponseDto> {
    const entity = await this.nomeService.findById(id);
    if (!entity) throw new NotFoundException('Registro não encontrado.');
    return NomeResponseDto.fromEntity(entity);
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNomeDto) { ... }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> { ... }
}
```

- `@UseGuards(JwtAuthGuard)` (+ `@ApiBearerAuth()`) em todo controller cuja rota exija
  usuário autenticado — se a task não especificar o contrário, trate como protegido por
  padrão, já que é o caso comum no projeto.
- `ParseUUIDPipe` em todo `:id` de rota (as chaves primárias são sempre UUID).
- `DELETE` retorna `204 No Content` (`@HttpCode(HttpStatus.NO_CONTENT)`), sem corpo.
- O controller nunca acessa o repositório diretamente — toda regra de negócio e acesso
  a dados passa pelo service.
- `@ApiTags`/`@ApiOperation`/`@ApiResponse` completos e finos ficam por conta da etapa
  `api-dev-doc` — aqui inclua só o mínimo estrutural (`@ApiTags`, `@ApiBearerAuth`
  quando protegido) necessário para o módulo funcionar.

## 5. Module

```ts
@Module({
  imports: [TypeOrmModule.forFeature([Nome])],
  controllers: [NomeController],
  providers: [NomeService],
  exports: [NomeService],
})
export class NomeModule {}
```

- Exporte o service sempre que outro módulo puder precisar reutilizá-lo (padrão já
  usado em `UsersModule`).
- Se o módulo for novo, importe-o em `app.module.ts` (`imports: [..., NomeModule]`),
  junto dos módulos já existentes (`UsersModule`, `AuthModule`).
