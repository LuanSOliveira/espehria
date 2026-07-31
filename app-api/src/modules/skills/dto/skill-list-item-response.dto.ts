import { ApiProperty } from '@nestjs/swagger';
import { Skill } from '../entities/skill.entity';
import { AttributeResponseDto } from '../../attributes/dto/attribute-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class SkillListItemResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da perícia',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da perícia',
    example: 'Furtividade',
  })
  name: string;

  @ApiProperty({
    type: () => AttributeResponseDto,
    description: 'Atributo chave da perícia',
  })
  keyAttribute: AttributeResponseDto;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à perícia',
  })
  tags: TagResponseDto[];

  static fromEntity(skill: Skill): SkillListItemResponseDto {
    const dto = new SkillListItemResponseDto();
    dto.id = skill.id;
    dto.name = skill.name;
    dto.keyAttribute = AttributeResponseDto.fromEntity(skill.keyAttribute);
    dto.tags = (skill.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    return dto;
  }
}
