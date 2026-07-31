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
    description: 'Já existe um treinamento com este nome',
  })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description: 'Dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateTrainingDto): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.create(dto);
    return TrainingResponseDto.fromEntity(training);
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
    const training = await this.trainingsService.findById(id);
    if (!training) {
      throw new NotFoundException('Treinamento não encontrado.');
    }
    return TrainingResponseDto.fromEntity(training);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um treinamento' })
  @ApiOkResponse({ type: TrainingResponseDto })
  @ApiNotFoundResponse({
    description: 'Treinamento ou uma ou mais tags não encontrados',
  })
  @ApiConflictResponse({
    description: 'Já existe um treinamento com este nome',
  })
  @ApiBadRequestResponse({
    description: 'ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingDto,
  ): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.update(id, dto);
    return TrainingResponseDto.fromEntity(training);
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
