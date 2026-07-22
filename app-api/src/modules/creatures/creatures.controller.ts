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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCreatureDto } from './dto/create-creature.dto';
import { UpdateCreatureDto } from './dto/update-creature.dto';
import { FindCreaturesQueryDto } from './dto/find-creatures-query.dto';
import { CreatureResponseDto } from './dto/creature-response.dto';
import { CreatureListItemResponseDto } from './dto/creature-list-item-response.dto';
import { PaginatedCreaturesResponseDto } from './dto/paginated-creatures-response.dto';
import { CreatureCategoryResponseDto } from './dto/creature-category-response.dto';
import { CreaturesService } from './creatures.service';

@ApiTags('creatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('creatures')
export class CreaturesController {
  constructor(private readonly creaturesService: CreaturesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma criatura' })
  @ApiCreatedResponse({ type: CreatureResponseDto })
  @ApiConflictResponse({ description: 'Nome da criatura já existe' })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada ou uma ou mais tags não encontradas' })
  @ApiBadRequestResponse({ description: 'URL de imagem de referência inválida ou dados obrigatórios ausentes' })
  async create(@Body() dto: CreateCreatureDto): Promise<CreatureResponseDto> {
    const creature = await this.creaturesService.create(dto);
    return CreatureResponseDto.fromEntity(creature);
  }

  @Get()
  @ApiOperation({ summary: 'Lista criaturas com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedCreaturesResponseDto })
  @ApiBadRequestResponse({ description: 'Parâmetros de paginação ou filtro inválidos' })
  async findAll(
    @Query() query: FindCreaturesQueryDto,
  ): Promise<PaginatedCreaturesResponseDto> {
    const { data, total, page, perPage } =
      await this.creaturesService.findAllPaginated(query);

    return {
      data: data.map((creature) =>
        CreatureListItemResponseDto.fromEntity(creature),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lista todas as categorias de criaturas' })
  @ApiOkResponse({ type: [CreatureCategoryResponseDto] })
  async findAllCategories(): Promise<CreatureCategoryResponseDto[]> {
    const categories = await this.creaturesService.findAllCategories();
    return categories.map((category) =>
      CreatureCategoryResponseDto.fromEntity(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma criatura pelo id' })
  @ApiOkResponse({ type: CreatureResponseDto })
  @ApiNotFoundResponse({ description: 'Criatura não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de criatura em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CreatureResponseDto> {
    const creature = await this.creaturesService.findById(id);
    if (!creature) {
      throw new NotFoundException('Criatura não encontrada.');
    }
    return CreatureResponseDto.fromEntity(creature);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma criatura' })
  @ApiOkResponse({ type: CreatureResponseDto })
  @ApiNotFoundResponse({ description: 'Criatura, categoria ou uma ou mais tags não encontradas' })
  @ApiConflictResponse({ description: 'Nome da criatura já existe' })
  @ApiBadRequestResponse({ description: 'URL de imagem de referência inválida ou ID em formato inválido' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCreatureDto,
  ): Promise<CreatureResponseDto> {
    const creature = await this.creaturesService.update(id, dto);
    return CreatureResponseDto.fromEntity(creature);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma criatura' })
  @ApiNoContentResponse({ description: 'Criatura removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Criatura não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de criatura em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.creaturesService.remove(id);
  }
}
