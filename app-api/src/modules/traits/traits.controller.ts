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
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { FindTraitsQueryDto } from './dto/find-traits-query.dto';
import { TraitResponseDto } from './dto/trait-response.dto';
import { TraitListItemResponseDto } from './dto/trait-list-item-response.dto';
import { PaginatedTraitsResponseDto } from './dto/paginated-traits-response.dto';
import { TraitsService } from './traits.service';

@ApiTags('traits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('traits')
export class TraitsController {
  constructor(private readonly traitsService: TraitsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um traço' })
  @ApiCreatedResponse({ type: TraitResponseDto })
  @ApiConflictResponse({ description: 'Já existe um traço com este nome' })
  @ApiNotFoundResponse({
    description: 'Tipo de traço ou uma ou mais tags não foram encontrados',
  })
  @ApiBadRequestResponse({
    description: 'Dados obrigatórios ausentes ou em formato inválido',
  })
  async create(@Body() dto: CreateTraitDto): Promise<TraitResponseDto> {
    const trait = await this.traitsService.create(dto);
    return TraitResponseDto.fromEntity(trait);
  }

  @Get()
  @ApiOperation({ summary: 'Lista traços com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedTraitsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTraitsQueryDto,
  ): Promise<PaginatedTraitsResponseDto> {
    const { data, total, page, perPage } =
      await this.traitsService.findAllPaginated(query);

    return {
      data: data.map((trait) => TraitListItemResponseDto.fromEntity(trait)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um traço pelo id' })
  @ApiOkResponse({ type: TraitResponseDto })
  @ApiNotFoundResponse({ description: 'Traço não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de traço em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TraitResponseDto> {
    const trait = await this.traitsService.findById(id);
    if (!trait) {
      throw new NotFoundException('Traço não encontrado.');
    }
    return TraitResponseDto.fromEntity(trait);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um traço' })
  @ApiOkResponse({ type: TraitResponseDto })
  @ApiNotFoundResponse({
    description:
      'Traço, tipo de traço, ou uma ou mais tags informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe um traço com este nome' })
  @ApiBadRequestResponse({
    description: 'ID em formato inválido ou dados inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTraitDto,
  ): Promise<TraitResponseDto> {
    const trait = await this.traitsService.update(id, dto);
    return TraitResponseDto.fromEntity(trait);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um traço' })
  @ApiNoContentResponse({ description: 'Traço removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Traço não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de traço em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.traitsService.remove(id);
  }
}
