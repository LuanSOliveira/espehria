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
import { ProficiencyPropertyResponseDto } from './dto/proficiency-property-response.dto';
import { ProficiencyPropertiesService } from './proficiency-properties.service';

@ApiTags('proficiency-properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('proficiency-properties')
export class ProficiencyPropertiesController {
  constructor(
    private readonly proficiencyPropertiesService: ProficiencyPropertiesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todas as propriedades de proficiência (lista fixa)',
  })
  @ApiOkResponse({ type: [ProficiencyPropertyResponseDto] })
  async findAll(): Promise<ProficiencyPropertyResponseDto[]> {
    const properties = await this.proficiencyPropertiesService.findAll();
    return properties.map((property) =>
      ProficiencyPropertyResponseDto.fromEntity(property),
    );
  }
}
