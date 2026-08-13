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
import { SizeGradeResponseDto } from './dto/size-grade-response.dto';
import { SizeGradesService } from './size-grades.service';

@ApiTags('size-grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('size-grades')
export class SizeGradesController {
  constructor(private readonly sizeGradesService: SizeGradesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os graus de tamanho' })
  @ApiOkResponse({ type: [SizeGradeResponseDto] })
  async findAll(): Promise<SizeGradeResponseDto[]> {
    const sizeGrades = await this.sizeGradesService.findAll();
    return sizeGrades.map((sizeGrade) =>
      SizeGradeResponseDto.fromEntity(sizeGrade),
    );
  }
}
