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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FindFamiliesQueryDto } from './dto/find-families-query.dto';
import { FamilyResponseDto } from './dto/family-response.dto';
import { FamilyListItemResponseDto } from './dto/family-list-item-response.dto';
import { PaginatedFamiliesResponseDto } from './dto/paginated-families-response.dto';
import { FamiliesService } from './families.service';

@ApiTags('families')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma família' })
  @ApiCreatedResponse({ type: FamilyResponseDto })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não encontradas ou personagem-membro não encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, classificação fora do enum FamilyClassification, tipo de vínculo fora do enum FamilyRelationshipType, dados obrigatórios ausentes, ID em formato inválido, duplicidade de par em membros/vínculos, autovínculo (sourceCharacterId === targetCharacterId), par cônjuge invertido já existente, contradição de ascendência (par PARENT invertido), vínculo envolvendo personagem que não é membro da árvore, ou personagem já associado ao número máximo de duas famílias',
  })
  async create(@Body() dto: CreateFamilyDto): Promise<FamilyResponseDto> {
    const family = await this.familiesService.create(dto);
    const looseCharacters =
      await this.familiesService.findLooseCharacters(family);
    return FamilyResponseDto.fromEntity(family, looseCharacters);
  }

  @Get()
  @ApiOperation({ summary: 'Lista famílias com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedFamiliesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindFamiliesQueryDto,
  ): Promise<PaginatedFamiliesResponseDto> {
    const { data, total, page, perPage } =
      await this.familiesService.findAllPaginated(query);

    return {
      data: data.map((family) => FamilyListItemResponseDto.fromEntity(family)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma família pelo id' })
  @ApiOkResponse({ type: FamilyResponseDto })
  @ApiNotFoundResponse({ description: 'Família não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de família em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FamilyResponseDto> {
    const family = await this.familiesService.findById(id);
    if (!family) {
      throw new NotFoundException('Família não encontrada.');
    }
    const looseCharacters =
      await this.familiesService.findLooseCharacters(family);
    return FamilyResponseDto.fromEntity(family, looseCharacters);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma família' })
  @ApiOkResponse({ type: FamilyResponseDto })
  @ApiNotFoundResponse({
    description:
      'Família não encontrada, uma ou mais tags não encontradas, ou personagem-membro não encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, classificação fora do enum FamilyClassification, tipo de vínculo fora do enum FamilyRelationshipType, ID em formato inválido, duplicidade de par em membros/vínculos, autovínculo (sourceCharacterId === targetCharacterId), par cônjuge invertido já existente, contradição de ascendência (par PARENT invertido), vínculo envolvendo personagem que não é membro da árvore, ou personagem já associado ao número máximo de duas famílias',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyDto,
  ): Promise<FamilyResponseDto> {
    const family = await this.familiesService.update(id, dto);
    const looseCharacters =
      await this.familiesService.findLooseCharacters(family);
    return FamilyResponseDto.fromEntity(family, looseCharacters);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma família' })
  @ApiNoContentResponse({ description: 'Família removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Família não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de família em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.familiesService.remove(id);
  }
}
