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
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';
import { FindWeaponsQueryDto } from './dto/find-weapons-query.dto';
import { WeaponResponseDto } from './dto/weapon-response.dto';
import { WeaponListItemResponseDto } from './dto/weapon-list-item-response.dto';
import { PaginatedWeaponsResponseDto } from './dto/paginated-weapons-response.dto';
import { WeaponsService } from './weapons.service';

@ApiTags('weapons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('weapons')
export class WeaponsController {
  constructor(private readonly weaponsService: WeaponsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma arma' })
  @ApiCreatedResponse({ type: WeaponResponseDto })
  @ApiConflictResponse({ description: 'Já existe uma arma com este nome' })
  @ApiNotFoundResponse({
    description:
      'Uma ou mais tags, moeda, grau de tamanho, tipo de dano, um ou mais traços, ou um ou mais tipos de dano informados dentro dos danos alternativos/extras não foram encontrados',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, valores de hands/weaponStyle/damageDie (incluindo dentro dos danos alternativos/extras) fora do enum, ou volume/distanceMeters (incluindo dentro dos danos alternativos/extras) com mais de 1 casa decimal ou negativos, ou valores negativos em damageValue/reloadActions (incluindo dentro dos danos alternativos/extras)',
  })
  async create(@Body() dto: CreateWeaponDto): Promise<WeaponResponseDto> {
    const weapon = await this.weaponsService.create(dto);
    return WeaponResponseDto.fromEntity(weapon);
  }

  @Get()
  @ApiOperation({ summary: 'Lista armas com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedWeaponsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindWeaponsQueryDto,
  ): Promise<PaginatedWeaponsResponseDto> {
    const { data, total, page, perPage } =
      await this.weaponsService.findAllPaginated(query);

    return {
      data: data.map((weapon) => WeaponListItemResponseDto.fromEntity(weapon)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma arma pelo id' })
  @ApiOkResponse({ type: WeaponResponseDto })
  @ApiNotFoundResponse({ description: 'Arma não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de arma em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WeaponResponseDto> {
    const weapon = await this.weaponsService.findById(id);
    if (!weapon) {
      throw new NotFoundException('Arma não encontrada.');
    }
    return WeaponResponseDto.fromEntity(weapon);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma arma' })
  @ApiOkResponse({ type: WeaponResponseDto })
  @ApiNotFoundResponse({
    description:
      'Arma, uma ou mais tags, moeda, grau de tamanho, tipo de dano, um ou mais traços, ou um ou mais tipos de dano informados dentro dos danos alternativos/extras não foram encontrados',
  })
  @ApiConflictResponse({ description: 'Já existe uma arma com este nome' })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, valores de hands/weaponStyle/damageDie (incluindo dentro dos danos alternativos/extras) fora do enum, ou volume/distanceMeters (incluindo dentro dos danos alternativos/extras) com mais de 1 casa decimal ou negativos, ou valores negativos em damageValue/reloadActions (incluindo dentro dos danos alternativos/extras)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWeaponDto,
  ): Promise<WeaponResponseDto> {
    const weapon = await this.weaponsService.update(id, dto);
    return WeaponResponseDto.fromEntity(weapon);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma arma' })
  @ApiNoContentResponse({ description: 'Arma removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Arma não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de arma em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.weaponsService.remove(id);
  }
}
