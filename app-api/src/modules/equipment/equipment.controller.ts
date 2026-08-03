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
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentQueryDto } from './dto/find-equipment-query.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { EquipmentListItemResponseDto } from './dto/equipment-list-item-response.dto';
import { PaginatedEquipmentResponseDto } from './dto/paginated-equipment-response.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um equipamento' })
  @ApiCreatedResponse({ type: EquipmentResponseDto })
  @ApiConflictResponse({
    description: 'Já existe um equipamento com este nome',
  })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentService.create(dto);
    return EquipmentResponseDto.fromEntity(equipment);
  }

  @Get()
  @ApiOperation({ summary: 'Lista equipamentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedEquipmentResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindEquipmentQueryDto,
  ): Promise<PaginatedEquipmentResponseDto> {
    const { data, total, page, perPage } =
      await this.equipmentService.findAllPaginated(query);

    return {
      data: data.map((equipment) =>
        EquipmentListItemResponseDto.fromEntity(equipment),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um equipamento pelo id' })
  @ApiOkResponse({ type: EquipmentResponseDto })
  @ApiNotFoundResponse({ description: 'Equipamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de equipamento em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentService.findById(id);
    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado.');
    }
    return EquipmentResponseDto.fromEntity(equipment);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um equipamento' })
  @ApiOkResponse({ type: EquipmentResponseDto })
  @ApiNotFoundResponse({
    description:
      'Equipamento, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({
    description: 'Já existe um equipamento com este nome',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentService.update(id, dto);
    return EquipmentResponseDto.fromEntity(equipment);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um equipamento' })
  @ApiNoContentResponse({ description: 'Equipamento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Equipamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de equipamento em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.equipmentService.remove(id);
  }
}
