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
import { ProficiencyGradationResponseDto } from './dto/proficiency-gradation-response.dto';
import { ProficiencyGradationsService } from './proficiency-gradations.service';

@ApiTags('proficiency-gradations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('proficiency-gradations')
export class ProficiencyGradationsController {
  constructor(
    private readonly proficiencyGradationsService: ProficiencyGradationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todas as graduações de proficiência (lista fixa)',
  })
  @ApiOkResponse({ type: [ProficiencyGradationResponseDto] })
  async findAll(): Promise<ProficiencyGradationResponseDto[]> {
    const gradations = await this.proficiencyGradationsService.findAll();
    return gradations.map((gradation) =>
      ProficiencyGradationResponseDto.fromEntity(gradation),
    );
  }
}
