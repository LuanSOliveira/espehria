import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleAccess } from '../auth/decorators/google-access.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleAccessGuard } from '../auth/guards/google-access.guard';
import { TraitTypeResponseDto } from './dto/trait-type-response.dto';
import { TraitTypesService } from './trait-types.service';

@ApiTags('trait-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('trait-types')
export class TraitTypesController {
  constructor(private readonly traitTypesService: TraitTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os tipos de traço' })
  @ApiOkResponse({ type: [TraitTypeResponseDto] })
  async findAll(): Promise<TraitTypeResponseDto[]> {
    const traitTypes = await this.traitTypesService.findAll();
    return traitTypes.map((traitType) =>
      TraitTypeResponseDto.fromEntity(traitType),
    );
  }
}
