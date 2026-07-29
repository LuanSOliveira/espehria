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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { OrganizationListItemResponseDto } from './dto/organization-list-item-response.dto';
import { PaginatedOrganizationsResponseDto } from './dto/paginated-organizations-response.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma organização' })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiConflictResponse({
    description: 'Nome da organização já existe',
  })
  @ApiNotFoundResponse({
    description: 'Uma ou mais tags não encontradas ou personagem-membro não encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, dados obrigatórios ausentes, ou duplicidade de par em membros (mesmo characterId mais de uma vez)',
  })
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.create(dto);
    return OrganizationResponseDto.fromEntity(organization);
  }

  @Get()
  @ApiOperation({ summary: 'Lista organizações com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedOrganizationsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindOrganizationsQueryDto,
  ): Promise<PaginatedOrganizationsResponseDto> {
    const { data, total, page, perPage } =
      await this.organizationsService.findAllPaginated(query);

    return {
      data: data.map((organization) =>
        OrganizationListItemResponseDto.fromEntity(organization),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma organização pelo id' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organização não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de organização em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.findById(id);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }
    return OrganizationResponseDto.fromEntity(organization);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma organização' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiConflictResponse({
    description: 'Nome da organização já existe',
  })
  @ApiNotFoundResponse({
    description:
      'Organização não encontrada, uma ou mais tags não encontradas, ou personagem-membro não encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida, ID em formato inválido, ou duplicidade de par em membros (mesmo characterId mais de uma vez)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.update(id, dto);
    return OrganizationResponseDto.fromEntity(organization);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma organização' })
  @ApiNoContentResponse({ description: 'Organização removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Organização não encontrada' })
  @ApiBadRequestResponse({ description: 'ID de organização em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.organizationsService.remove(id);
  }
}
