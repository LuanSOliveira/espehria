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
import { CreateEnchantmentDto } from './dto/create-enchantment.dto';
import { UpdateEnchantmentDto } from './dto/update-enchantment.dto';
import { FindEnchantmentsQueryDto } from './dto/find-enchantments-query.dto';
import { EnchantmentResponseDto } from './dto/enchantment-response.dto';
import { EnchantmentListItemResponseDto } from './dto/enchantment-list-item-response.dto';
import { PaginatedEnchantmentsResponseDto } from './dto/paginated-enchantments-response.dto';
import { EnchantmentsService } from './enchantments.service';

@ApiTags('enchantments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('enchantments')
export class EnchantmentsController {
  constructor(private readonly enchantmentsService: EnchantmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um encantamento' })
  @ApiCreatedResponse({ type: EnchantmentResponseDto })
  @ApiConflictResponse({
    description: 'Já existe um encantamento com este nome',
  })
  @ApiBadRequestResponse({
    description: 'Dados obrigatórios ausentes ou em formato inválido',
  })
  async create(
    @Body() dto: CreateEnchantmentDto,
  ): Promise<EnchantmentResponseDto> {
    const enchantment = await this.enchantmentsService.create(dto);
    return EnchantmentResponseDto.fromEntity(enchantment);
  }

  @Get()
  @ApiOperation({ summary: 'Lista encantamentos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedEnchantmentsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindEnchantmentsQueryDto,
  ): Promise<PaginatedEnchantmentsResponseDto> {
    const { data, total, page, perPage } =
      await this.enchantmentsService.findAllPaginated(query);

    return {
      data: data.map((enchantment) =>
        EnchantmentListItemResponseDto.fromEntity(enchantment),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um encantamento pelo id' })
  @ApiOkResponse({ type: EnchantmentResponseDto })
  @ApiNotFoundResponse({ description: 'Encantamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de encantamento em formato inválido',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnchantmentResponseDto> {
    const enchantment = await this.enchantmentsService.findById(id);
    if (!enchantment) {
      throw new NotFoundException('Encantamento não encontrado.');
    }
    return EnchantmentResponseDto.fromEntity(enchantment);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um encantamento' })
  @ApiOkResponse({ type: EnchantmentResponseDto })
  @ApiNotFoundResponse({ description: 'Encantamento não encontrado' })
  @ApiConflictResponse({
    description: 'Já existe um encantamento com este nome',
  })
  @ApiBadRequestResponse({
    description: 'ID em formato inválido ou dados inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnchantmentDto,
  ): Promise<EnchantmentResponseDto> {
    const enchantment = await this.enchantmentsService.update(id, dto);
    return EnchantmentResponseDto.fromEntity(enchantment);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um encantamento' })
  @ApiNoContentResponse({ description: 'Encantamento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Encantamento não encontrado' })
  @ApiBadRequestResponse({
    description: 'ID de encantamento em formato inválido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.enchantmentsService.remove(id);
  }
}
