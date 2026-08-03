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
import { ImprovementFlawPropertyResponseDto } from './dto/improvement-flaw-property-response.dto';
import { ImprovementFlawPropertiesService } from './improvement-flaw-properties.service';

@ApiTags('improvement-flaw-properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('improvement-flaw-properties')
export class ImprovementFlawPropertiesController {
  constructor(
    private readonly improvementFlawPropertiesService: ImprovementFlawPropertiesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as propriedades de melhoria/defeito (lista fixa)' })
  @ApiOkResponse({ type: [ImprovementFlawPropertyResponseDto] })
  async findAll(): Promise<ImprovementFlawPropertyResponseDto[]> {
    const properties = await this.improvementFlawPropertiesService.findAll();
    return properties.map((property) =>
      ImprovementFlawPropertyResponseDto.fromEntity(property),
    );
  }
}
