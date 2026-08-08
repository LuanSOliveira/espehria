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
import { CreateArmorDto } from './dto/create-armor.dto';
import { UpdateArmorDto } from './dto/update-armor.dto';
import { FindArmorsQueryDto } from './dto/find-armors-query.dto';
import { ArmorResponseDto } from './dto/armor-response.dto';
import { ArmorListItemResponseDto } from './dto/armor-list-item-response.dto';
import { PaginatedArmorsResponseDto } from './dto/paginated-armors-response.dto';
import { ArmorsService } from './armors.service';

@ApiTags('armors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('armors')
export class ArmorsController {
  constructor(private readonly armorsService: ArmorsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma armadura' })
  @ApiCreatedResponse({ type: ArmorResponseDto })
  @ApiConflictResponse({ description: 'Já existe uma armadura com este nome' })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags não foram encontradas, ou a moeda informada não existe',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateArmorDto): Promise<ArmorResponseDto> {
    const armor = await this.armorsService.create(dto);
    return ArmorResponseDto.fromEntity(armor);
  }

  @Get()
  @ApiOperation({ summary: 'Lista armaduras com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedArmorsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindArmorsQueryDto,
  ): Promise<PaginatedArmorsResponseDto> {
    const { data, total, page, perPage } =
      await this.armorsService.findAllPaginated(query);

    return {
      data: data.map((armor) => ArmorListItemResponseDto.fromEntity(armor)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma armadura pelo id' })
  @ApiOkResponse({ type: ArmorResponseDto })
  @ApiNotFoundResponse({ description: 'Armadura não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de armadura em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ArmorResponseDto> {
    const armor = await this.armorsService.findById(id);
    if (!armor) {
      throw new NotFoundException('Armadura não encontrada.');
    }
    return ArmorResponseDto.fromEntity(armor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma armadura' })
  @ApiOkResponse({ type: ArmorResponseDto })
  @ApiNotFoundResponse({
    description:
      'Armadura, uma ou mais tags, ou a moeda informados não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe uma armadura com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArmorDto,
  ): Promise<ArmorResponseDto> {
    const armor = await this.armorsService.update(id, dto);
    return ArmorResponseDto.fromEntity(armor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma armadura' })
  @ApiNoContentResponse({ description: 'Armadura removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Armadura não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de armadura em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.armorsService.remove(id);
  }
}
