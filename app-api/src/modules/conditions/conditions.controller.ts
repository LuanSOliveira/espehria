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
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { FindConditionsQueryDto } from './dto/find-conditions-query.dto';
import { ConditionResponseDto } from './dto/condition-response.dto';
import { ConditionListItemResponseDto } from './dto/condition-list-item-response.dto';
import { PaginatedConditionsResponseDto } from './dto/paginated-conditions-response.dto';
import { ConditionsService } from './conditions.service';

@ApiTags('conditions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('conditions')
export class ConditionsController {
  constructor(private readonly conditionsService: ConditionsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma condição' })
  @ApiCreatedResponse({ type: ConditionResponseDto })
  @ApiConflictResponse({ description: 'Nome da condição já existe' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({ description: 'Dados obrigatórios ausentes' })
  async create(@Body() dto: CreateConditionDto): Promise<ConditionResponseDto> {
    const condition = await this.conditionsService.create(dto);
    return ConditionResponseDto.fromEntity(condition);
  }

  @Get()
  @ApiOperation({ summary: 'Lista condições com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedConditionsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindConditionsQueryDto,
  ): Promise<PaginatedConditionsResponseDto> {
    const { data, total, page, perPage } =
      await this.conditionsService.findAllPaginated(query);

    return {
      data: data.map((condition) =>
        ConditionListItemResponseDto.fromEntity(condition),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma condição pelo id' })
  @ApiOkResponse({ type: ConditionResponseDto })
  @ApiNotFoundResponse({ description: 'Condição não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de condição em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConditionResponseDto> {
    const condition = await this.conditionsService.findById(id);
    if (!condition) {
      throw new NotFoundException('Condição não encontrada.');
    }
    return ConditionResponseDto.fromEntity(condition);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma condição' })
  @ApiOkResponse({ type: ConditionResponseDto })
  @ApiNotFoundResponse({
    description: 'Condição não encontrada ou uma ou mais tags não encontradas',
  })
  @ApiConflictResponse({ description: 'Nome da condição já existe' })
  @ApiBadRequestResponse({ description: 'ID de condição em formato inválido' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConditionDto,
  ): Promise<ConditionResponseDto> {
    const condition = await this.conditionsService.update(id, dto);
    return ConditionResponseDto.fromEntity(condition);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma condição' })
  @ApiNoContentResponse({ description: 'Condição removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Condição não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de condição em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.conditionsService.remove(id);
  }
}
