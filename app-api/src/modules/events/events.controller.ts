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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindEventsQueryDto } from './dto/find-events-query.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventListItemResponseDto } from './dto/event-list-item-response.dto';
import { PaginatedEventsResponseDto } from './dto/paginated-events-response.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um evento' })
  @ApiCreatedResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({
    description: 'Era ou uma ou mais tags não foram encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou dados obrigatórios ausentes',
  })
  async create(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    const event = await this.eventsService.create(dto);
    return EventResponseDto.fromEntity(event);
  }

  @Get()
  @ApiOperation({ summary: 'Lista eventos com paginação e filtro' })
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
  })
  async findAll(
    @Query() query: FindEventsQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    const { data, total, page, perPage } =
      await this.eventsService.findAllPaginated(query);

    return {
      data: data.map((event) => EventListItemResponseDto.fromEntity(event)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um evento pelo id' })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({ description: 'Evento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de evento em formato inválido' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return EventResponseDto.fromEntity(event);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um evento' })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({
    description: 'Evento, era ou uma ou mais tags não encontradas',
  })
  @ApiBadRequestResponse({
    description:
      'URL de imagem de referência inválida ou ID em formato inválido',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventsService.update(id, dto);
    return EventResponseDto.fromEntity(event);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um evento' })
  @ApiNoContentResponse({ description: 'Evento removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Evento não encontrado' })
  @ApiBadRequestResponse({ description: 'ID de evento em formato inválido' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.eventsService.remove(id);
  }
}
