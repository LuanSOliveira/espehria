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
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { FindTechniquesQueryDto } from './dto/find-techniques-query.dto';
import { TechniqueResponseDto } from './dto/technique-response.dto';
import { TechniqueListItemResponseDto } from './dto/technique-list-item-response.dto';
import { PaginatedTechniquesResponseDto } from './dto/paginated-techniques-response.dto';
import { TechniquesService } from './techniques.service';

@ApiTags('techniques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('techniques')
export class TechniquesController {
  constructor(private readonly techniquesService: TechniquesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma técnica' })
  @ApiCreatedResponse({ type: TechniqueResponseDto })
  @ApiConflictResponse({
    description:
      'Já existe uma técnica com este nome, ou violação de regra em Requisitos (duplicata ou autorreferência)',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags ou entidades referenciadas em Requisitos não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes ou formato inválido de entityType/id',
  })
  async create(@Body() dto: CreateTechniqueDto): Promise<TechniqueResponseDto> {
    const { technique, requirements } =
      await this.techniquesService.create(dto);
    return TechniqueResponseDto.fromEntity(technique, requirements);
  }

  @Get()
  @ApiOperation({ summary: 'Lista técnicas com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedTechniquesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTechniquesQueryDto,
  ): Promise<PaginatedTechniquesResponseDto> {
    const { data, total, page, perPage } =
      await this.techniquesService.findAllPaginated(query);

    return {
      data: data.map((technique) =>
        TechniqueListItemResponseDto.fromEntity(technique),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma técnica pelo id' })
  @ApiOkResponse({ type: TechniqueResponseDto })
  @ApiNotFoundResponse({ description: 'Técnica não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de técnica em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TechniqueResponseDto> {
    const result = await this.techniquesService.findById(id);
    if (!result) {
      throw new NotFoundException('Técnica não encontrada.');
    }
    return TechniqueResponseDto.fromEntity(
      result.technique,
      result.requirements,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma técnica' })
  @ApiOkResponse({ type: TechniqueResponseDto })
  @ApiNotFoundResponse({
    description:
      'Técnica ou uma ou mais tags/entidades referenciadas não encontradas',
  })
  @ApiConflictResponse({
    description:
      'Já existe uma técnica com este nome, ou violação de regra em Requisitos (duplicata ou autorreferência)',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido ou formato inválido de entityType/id em Requisitos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechniqueDto,
  ): Promise<TechniqueResponseDto> {
    const { technique, requirements } =
      await this.techniquesService.update(id, dto);
    return TechniqueResponseDto.fromEntity(technique, requirements);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma técnica' })
  @ApiNoContentResponse({ description: 'Técnica removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Técnica não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de técnica em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.techniquesService.remove(id);
  }
}
