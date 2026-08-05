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
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FindTrainingsQueryDto } from './dto/find-trainings-query.dto';
import { TrainingResponseDto } from './dto/training-response.dto';
import { TrainingListItemResponseDto } from './dto/training-list-item-response.dto';
import { PaginatedTrainingsResponseDto } from './dto/paginated-trainings-response.dto';
import { TrainingsService } from './trainings.service';

@ApiTags('trainings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um treinamento' })
  @ApiCreatedResponse({ type: TrainingResponseDto })
  @ApiConflictResponse({
    description:
      'Já existe um treinamento com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags, entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, ou propriedades/graduações de Proficiências não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'Dados obrigatórios ausentes, formato inválido de entityType/id, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async create(@Body() dto: CreateTrainingDto): Promise<TrainingResponseDto> {
    const {
      training,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    } = await this.trainingsService.create(dto);
    return TrainingResponseDto.fromEntity(training, {
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lista treinamentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedTrainingsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindTrainingsQueryDto,
  ): Promise<PaginatedTrainingsResponseDto> {
    const { data, total, page, perPage } =
      await this.trainingsService.findAllPaginated(query);

    return {
      data: data.map((training) =>
        TrainingListItemResponseDto.fromEntity(training),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um treinamento pelo id' })
  @ApiOkResponse({ type: TrainingResponseDto })
  @ApiNotFoundResponse({ description: 'Treinamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de treinamento em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrainingResponseDto> {
    const result = await this.trainingsService.findById(id);
    if (!result) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
    return TrainingResponseDto.fromEntity(result.training, {
      improvedFrom: result.improvedFrom,
      requirements: result.requirements,
      additionalAbilities: result.additionalAbilities,
      improvements: result.improvements,
      flaws: result.flaws,
      proficiencies: result.proficiencies,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um treinamento' })
  @ApiOkResponse({ type: TrainingResponseDto })
  @ApiNotFoundResponse({
    description:
      'Treinamento, uma ou mais tags/entidades referenciadas em Aprimorado de/Requisitos/Habilidades Adicionais, tipos/propriedades de Melhorias/Defeitos, ou propriedades/graduações de Proficiências não encontrados',
  })
  @ApiConflictResponse({
    description:
      'Já existe um treinamento com este nome, ou violação de regra em Aprimorado de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em mais de uma das três listas), ou violação de regra em Melhorias/Defeitos (duplicidade de combinação Tipo×Propriedade na mesma lista, exclusividade entre listas ou incompatibilidade entre o Tipo e a Propriedade selecionados), ou violação de regra em Proficiências (duplicidade de propriedade na mesma lista)',
  })
  @ApiBadRequestResponse({
    description:
      'ID em formato inválido, formato inválido de entityType/id em Aprimorado de/Requisitos/Habilidades Adicionais, formato inválido de value/type/property em Melhorias/Defeitos (value deve ser inteiro ≥ 1, type/property devem ser UUIDs válidas), ou formato inválido de property/gradation em Proficiências (devem ser UUIDs válidas)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingDto,
  ): Promise<TrainingResponseDto> {
    const {
      training,
      improvedFrom,
      requirements,
      additionalAbilities,
      improvements,
      flaws,
      proficiencies,
    } = await this.trainingsService.update(id, dto);
    return TrainingResponseDto.fromEntity(training, {
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
  @ApiOperation({ summary: 'Remove um treinamento' })
  @ApiNoContentResponse({ description: 'Treinamento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Treinamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de treinamento em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.trainingsService.remove(id);
  }
}
