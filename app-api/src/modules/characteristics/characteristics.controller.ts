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
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { FindCharacteristicsQueryDto } from './dto/find-characteristics-query.dto';
import { CharacteristicResponseDto } from './dto/characteristic-response.dto';
import { CharacteristicListItemResponseDto } from './dto/characteristic-list-item-response.dto';
import { PaginatedCharacteristicsResponseDto } from './dto/paginated-characteristics-response.dto';
import { CharacteristicsService } from './characteristics.service';

@ApiTags('characteristics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('characteristics')
export class CharacteristicsController {
  constructor(
    private readonly characteristicsService: CharacteristicsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma característica' })
  @ApiCreatedResponse({ type: CharacteristicResponseDto })
  @ApiConflictResponse({
    description:
      'Já existe uma característica com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags, entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, ou propriedades/graduações de Proficiências não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'Dados obrigatórios ausentes, formato inválido de entityType/id, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async create(
    @Body() dto: CreateCharacteristicDto,
  ): Promise<CharacteristicResponseDto> {
    const {
      characteristic,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    } = await this.characteristicsService.create(dto);
    return CharacteristicResponseDto.fromEntity(characteristic, {
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lista características com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedCharacteristicsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindCharacteristicsQueryDto,
  ): Promise<PaginatedCharacteristicsResponseDto> {
    const { data, total, page, perPage } =
      await this.characteristicsService.findAllPaginated(query);

    return {
      data: data.map((characteristic) =>
        CharacteristicListItemResponseDto.fromEntity(characteristic),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma característica pelo id' })
  @ApiOkResponse({ type: CharacteristicResponseDto })
  @ApiNotFoundResponse({ description: 'Característica não encontrada' })
  @ApiBadRequestResponse({
    description: 'ID de característica em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CharacteristicResponseDto> {
    const result = await this.characteristicsService.findById(id);
    if (!result) {
      throw new NotFoundException('Característica não encontrada.');
    }
    return CharacteristicResponseDto.fromEntity(result.characteristic, {
      improvedFrom: result.improvedFrom,
      requirements: result.requirements,
      additionalAbilities: result.additionalAbilities,
      improvements: result.improvements,
      flaws: result.flaws,
      proficiencies: result.proficiencies,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma característica' })
  @ApiOkResponse({ type: CharacteristicResponseDto })
  @ApiNotFoundResponse({
    description:
      'Característica, uma ou mais tags/entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, ou propriedades/graduações de Proficiências não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Já existe uma característica com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiBadRequestResponse({
    description:
      'ID em formato inválido, formato inválido de entityType/id em Aprimorado de/Requisitos/Habilidades Adicionais, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCharacteristicDto,
  ): Promise<CharacteristicResponseDto> {
    const {
      characteristic,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    } = await this.characteristicsService.update(id, dto);
    return CharacteristicResponseDto.fromEntity(characteristic, {
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma característica' })
  @ApiNoContentResponse({ description: 'Característica removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Característica não encontrada' })
  @ApiBadRequestResponse({
    description: 'ID de característica em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.characteristicsService.remove(id);
  }
}
