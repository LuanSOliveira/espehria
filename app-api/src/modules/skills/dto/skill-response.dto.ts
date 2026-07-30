import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Skill } from '../entities/skill.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';
import { SkillSectionResponseDto } from './skill-section-response.dto';

export class SkillResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da perícia',
  })
  id: string;

  @ApiProperty({ description: 'Nome da perícia', example: 'Furtividade' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da perícia (HTML)',
    example: '<p>Capacidade de se mover sem ser percebido.</p>',
  })
  description: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à perícia',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    type: () => [SkillSectionResponseDto],
    description: 'Seções da perícia',
  })
  sections: SkillSectionResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(skill: Skill): SkillResponseDto {
    const dto = new SkillResponseDto();
    dto.id = skill.id;
    dto.name = skill.name;
    dto.description = skill.description;
    dto.tags = (skill.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.sections = (skill.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => SkillSectionResponseDto.fromEntity(section));
    dto.createdAt = skill.createdAt;
    dto.updatedAt = skill.updatedAt;
    return dto;
  }
}
