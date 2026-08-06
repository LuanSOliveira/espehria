import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { FindTalentsQueryDto } from './dto/find-talents-query.dto';
import { TalentResponseDto } from './dto/talent-response.dto';
import { TalentListItemResponseDto } from './dto/talent-list-item-response.dto';
import { PaginatedTalentsResponseDto } from './dto/paginated-talents-response.dto';
import { TalentsService } from './talents.service';

@ApiTags('talents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('talents')
export class TalentsController {
  constructor(private readonly talentsService: TalentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um talento' })
  @ApiCreatedResponse({ type: TalentResponseDto })
  @ApiConflictResponse({
    description:
      'Já existe um talento com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista), ou violação de regra em Saberes (título duplicado na mesma lista)',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags, entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, propriedades/graduações de Proficiências, ou graduações de Saberes não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'Dados obrigatórios ausentes, formato inválido de entityType/id, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas), ou formato inválido de title/gradation em Saberes (title deve ser string não vazia, gradation deve ser UUID válido)',
  })
  async create(@Body() dto: CreateTalentDto): Promise<TalentResponseDto> {
    const {
      talent,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    } = await this.talentsService.create(dto);
    return TalentResponseDto.fromEntity(talent, {
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lista talentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedTalentsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTalentsQueryDto,
  ): Promise<PaginatedTalentsResponseDto> {
    const { data, total, page, perPage } =
      await this.talentsService.findAllPaginated(query);

    return {
      data: data.map((talent) => TalentListItemResponseDto.fromEntity(talent)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um talento pelo id' })
  @ApiOkResponse({ type: TalentResponseDto })
  @ApiNotFoundResponse({ description: 'Talento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de talento em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TalentResponseDto> {
    const result = await this.talentsService.findById(id);
    if (!result) {
      throw new NotFoundException('Talento não encontrado.');
    }
    return TalentResponseDto.fromEntity(result.talent, {
      improvedFrom: result.improvedFrom,
      requirements: result.requirements,
      additionalAbilities: result.additionalAbilities,
      improvements: result.improvements,
      flaws: result.flaws,
      proficiencies: result.proficiencies,
      knowledges: result.knowledges,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um talento' })
  @ApiOkResponse({ type: TalentResponseDto })
  @ApiNotFoundResponse({
    description:
      'Talento, uma ou mais tags/entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, propriedades/graduações de Proficiências, ou graduações de Saberes não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Já existe um talento com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista), ou violação de regra em Saberes (título duplicado na mesma lista)',
  })
  @ApiBadRequestResponse({
    description:
      'ID em formato inválido, formato inválido de entityType/id em Aprimorado de/Requisitos/Habilidades Adicionais, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas), ou formato inválido de title/gradation em Saberes (title deve ser string não vazia, gradation deve ser UUID válido)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTalentDto,
  ): Promise<TalentResponseDto> {
    const {
      talent,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    } = await this.talentsService.update(id, dto);
    return TalentResponseDto.fromEntity(talent, {
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
      knowledges,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um talento' })
  @ApiNoContentResponse({ description: 'Talento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Talento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de talento em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.talentsService.remove(id);
  }
}
