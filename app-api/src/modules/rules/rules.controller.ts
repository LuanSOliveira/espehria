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
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { FindRulesQueryDto } from './dto/find-rules-query.dto';
import { RuleResponseDto } from './dto/rule-response.dto';
import { RuleListItemResponseDto } from './dto/rule-list-item-response.dto';
import { PaginatedRulesResponseDto } from './dto/paginated-rules-response.dto';
import { RulesService } from './rules.service';

@ApiTags('rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma regra' })
  @ApiCreatedResponse({ type: RuleResponseDto })
  @ApiConflictResponse({ description: 'Nome da regra já existe' })
  @ApiBadRequestResponse({ description: 'Dados obrigatórios ausentes' })
  async create(@Body() dto: CreateRuleDto): Promise<RuleResponseDto> {
    const rule = await this.rulesService.create(dto);
    return RuleResponseDto.fromEntity(rule);
  }

  @Get()
  @ApiOperation({ summary: 'Lista regras com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedRulesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindRulesQueryDto,
  ): Promise<PaginatedRulesResponseDto> {
    const { data, total, page, perPage } =
      await this.rulesService.findAllPaginated(query);

    return {
      data: data.map((rule) => RuleListItemResponseDto.fromEntity(rule)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma regra pelo id' })
  @ApiOkResponse({ type: RuleResponseDto })
  @ApiNotFoundResponse({ description: 'Regra não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de regra em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RuleResponseDto> {
    const rule = await this.rulesService.findById(id);
    if (!rule) {
      throw new NotFoundException('Regra não encontrada.');
    }
    return RuleResponseDto.fromEntity(rule);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma regra' })
  @ApiOkResponse({ type: RuleResponseDto })
  @ApiNotFoundResponse({ description: 'Regra não encontrada' })
  @ApiConflictResponse({ description: 'Nome da regra já existe' })
  @ApiBadRequestResponse({ description: 'ID de regra em formato inválido' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRuleDto,
  ): Promise<RuleResponseDto> {
    const rule = await this.rulesService.update(id, dto);
    return RuleResponseDto.fromEntity(rule);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma regra' })
  @ApiNoContentResponse({ description: 'Regra removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Regra não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de regra em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rulesService.remove(id);
  }
}
