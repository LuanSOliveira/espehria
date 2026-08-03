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
import { ImprovementFlawTypeResponseDto } from './dto/improvement-flaw-type-response.dto';
import { ImprovementFlawTypesService } from './improvement-flaw-types.service';

@ApiTags('improvement-flaw-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('improvement-flaw-types')
export class ImprovementFlawTypesController {
  constructor(
    private readonly improvementFlawTypesService: ImprovementFlawTypesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todos os tipos de melhoria/defeito (lista fixa)',
  })
  @ApiOkResponse({ type: [ImprovementFlawTypeResponseDto] })
  async findAll(): Promise<ImprovementFlawTypeResponseDto[]> {
    const types = await this.improvementFlawTypesService.findAll();
    return types.map((type) => ImprovementFlawTypeResponseDto.fromEntity(type));
  }
}
