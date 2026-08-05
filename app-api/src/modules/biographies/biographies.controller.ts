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
import { CreateBiographyDto } from './dto/create-biography.dto';
import { UpdateBiographyDto } from './dto/update-biography.dto';
import { FindBiographiesQueryDto } from './dto/find-biographies-query.dto';
import { BiographyResponseDto } from './dto/biography-response.dto';
import { BiographyListItemResponseDto } from './dto/biography-list-item-response.dto';
import { PaginatedBiographiesResponseDto } from './dto/paginated-biographies-response.dto';
import { BiographiesService } from './biographies.service';

@ApiTags('biographies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('biographies')
export class BiographiesController {
  constructor(private readonly biographiesService: BiographiesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma biografia' })
  @ApiCreatedResponse({ type: BiographyResponseDto })
  @ApiConflictResponse({
    description:
      'Já existe uma biografia com este nome, ou violação de regra em Habilidades Adicionais (autorreferência ou duplicata), ou violação de regra em Melhorias (duplicidade de combinação Tipo×Propriedade na mesma lista ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags, entidades referenciadas em Habilidades Adicionais, tipos/propriedades de Melhorias, ou propriedades/graduações de Proficiências não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'Dados obrigatórios ausentes, formato inválido de entityType/id, formato inválido de value/type/property em Melhorias (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async create(@Body() dto: CreateBiographyDto): Promise<BiographyResponseDto> {
    const { biography, additionalAbilities, improvements, proficiencies } =
      await this.biographiesService.create(dto);
    return BiographyResponseDto.fromEntity(biography, {
      additionalAbilities,
      improvements,
      proficiencies,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lista biografias com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedBiographiesResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindBiographiesQueryDto,
  ): Promise<PaginatedBiographiesResponseDto> {
    const { data, total, page, perPage } =
      await this.biographiesService.findAllPaginated(query);

    return {
      data: data.map((biography) =>
        BiographyListItemResponseDto.fromEntity(biography),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma biografia pelo id' })
  @ApiOkResponse({ type: BiographyResponseDto })
  @ApiNotFoundResponse({ description: 'Biografia não encontrada' })
  @ApiBadRequestResponse({
    description: 'ID de biografia em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BiographyResponseDto> {
    const result = await this.biographiesService.findById(id);
    if (!result) {
      throw new NotFoundException('Biografia não encontrada.');
    }
    return BiographyResponseDto.fromEntity(result.biography, {
      additionalAbilities: result.additionalAbilities,
      improvements: result.improvements,
      proficiencies: result.proficiencies,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma biografia' })
  @ApiOkResponse({ type: BiographyResponseDto })
  @ApiNotFoundResponse({
    description:
      'Biografia, uma ou mais tags/entidades referenciadas em Habilidades Adicionais, tipos/propriedades de Melhorias, ou propriedades/graduações de Proficiências não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Já existe uma biografia com este nome, ou violação de regra em Habilidades Adicionais (autorreferência ou duplicata), ou violação de regra em Melhorias (duplicidade de combinação Tipo×Propriedade na mesma lista ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiBadRequestResponse({
    description:
      'ID em formato inválido, formato inválido de entityType/id em Habilidades Adicionais, formato inválido de value/type/property em Melhorias (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBiographyDto,
  ): Promise<BiographyResponseDto> {
    const { biography, additionalAbilities, improvements, proficiencies } =
      await this.biographiesService.update(id, dto);
    return BiographyResponseDto.fromEntity(biography, {
      additionalAbilities,
      improvements,
      proficiencies,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma biografia' })
  @ApiNoContentResponse({ description: 'Biografia removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Biografia não encontrada' })
  @ApiBadRequestResponse({
    description: 'ID de biografia em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.biographiesService.remove(id);
  }
}
