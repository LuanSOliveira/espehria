import { ApiProperty } from '@nestjs/swagger';
import { Knowledge } from '../entities/knowledge.entity';
import { ProficiencyGradationResponseDto } from '../../proficiency-gradations/dto/proficiency-gradation-response.dto';

export class KnowledgeItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b3f1c2a4-5d6e-4f7a-8b9c-0d1e2f3a4b5c',
    description: 'Identificador do registro de saber',
  })
  id: string;

  @ApiProperty({
    description: 'Título livre do saber',
    example: 'Astronomia Élfica',
  })
  title: string;

  @ApiProperty({
    type: () => ProficiencyGradationResponseDto,
    description: 'Graduação do saber',
  })
  gradation: ProficiencyGradationResponseDto;

  @ApiProperty({
    description: 'Indica se este saber permite anotações livres na ficha',
    example: false,
  })
  editable: boolean;

  static fromResolved(item: Knowledge): KnowledgeItemResponseDto {
    const dto = new KnowledgeItemResponseDto();
    dto.id = item.id;
    dto.title = item.title;
    dto.gradation = ProficiencyGradationResponseDto.fromEntity(item.gradation);
    dto.editable = item.editable;
    return dto;
  }
}
