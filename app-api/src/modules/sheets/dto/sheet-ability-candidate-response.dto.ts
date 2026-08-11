import { ApiProperty } from '@nestjs/swagger';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class SheetAbilityCandidateResponseDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador único da Característica/Treinamento/Talento candidato',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da entidade candidata',
    example: 'Força Sobre-humana',
  })
  name: string;

  @ApiProperty({
    description: 'Nível da entidade candidata',
    example: 3,
  })
  level: number;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à entidade candidata',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description:
      'Indica se este item já está presente na ficha (herdado, em slot ou extra)',
    example: false,
  })
  alreadyPresent: boolean;

  @ApiProperty({
    description:
      'Indica se a ficha atende aos requisitos (nível, requirements e, para Talento, a regra de tag "Raça") deste item',
    example: true,
  })
  requirementsMet: boolean;

  static fromRaw(raw: {
    id: string;
    name: string;
    level: number;
    tags: TagResponseDto[];
    alreadyPresent: boolean;
    requirementsMet: boolean;
  }): SheetAbilityCandidateResponseDto {
    const dto = new SheetAbilityCandidateResponseDto();
    dto.id = raw.id;
    dto.name = raw.name;
    dto.level = raw.level;
    dto.tags = raw.tags;
    dto.alreadyPresent = raw.alreadyPresent;
    dto.requirementsMet = raw.requirementsMet;
    return dto;
  }
}
