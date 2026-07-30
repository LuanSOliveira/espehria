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
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FindConsumablesQueryDto } from './dto/find-consumables-query.dto';
import { ConsumableResponseDto } from './dto/consumable-response.dto';
import { ConsumableListItemResponseDto } from './dto/consumable-list-item-response.dto';
import { PaginatedConsumablesResponseDto } from './dto/paginated-consumables-response.dto';
import { ConsumablesService } from './consumables.service';

@ApiTags('consumables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um consumível' })
  @ApiCreatedResponse({ type: ConsumableResponseDto })
  @ApiConflictResponse({ description: 'Já existe um consumível com este nome' })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(
    @Body() dto: CreateConsumableDto,
  ): Promise<ConsumableResponseDto> {
    const consumable = await this.consumablesService.create(dto);
    return ConsumableResponseDto.fromEntity(consumable);
  }

  @Get()
  @ApiOperation({ summary: 'Lista consumíveis com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedConsumablesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindConsumablesQueryDto,
  ): Promise<PaginatedConsumablesResponseDto> {
    const { data, total, page, perPage } =
      await this.consumablesService.findAllPaginated(query);

    return {
      data: data.map((consumable) =>
        ConsumableListItemResponseDto.fromEntity(consumable),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um consumível pelo id' })
  @ApiOkResponse({ type: ConsumableResponseDto })
  @ApiNotFoundResponse({ description: 'Consumível não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de consumível em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsumableResponseDto> {
    const consumable = await this.consumablesService.findById(id);
    if (!consumable) {
      throw new NotFoundException('Consumível não encontrado.');
    }
    return ConsumableResponseDto.fromEntity(consumable);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um consumível' })
  @ApiOkResponse({ type: ConsumableResponseDto })
  @ApiNotFoundResponse({
    description: 'Consumível ou uma ou mais tags não encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um consumível com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsumableDto,
  ): Promise<ConsumableResponseDto> {
    const consumable = await this.consumablesService.update(id, dto);
    return ConsumableResponseDto.fromEntity(consumable);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um consumível' })
  @ApiNoContentResponse({ description: 'Consumível removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Consumível não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de consumível em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.consumablesService.remove(id);
  }
}
