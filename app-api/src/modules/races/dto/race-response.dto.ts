import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Race } from '../entities/race.entity';
import { RaceCategoryResponseDto } from './race-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class RaceResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da raça',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da raça',
    example: 'Elfo',
  })
  name: string;

  @ApiProperty({
    type: () => RaceCategoryResponseDto,
    description: 'Categoria da raça',
  })
  category: RaceCategoryResponseDto;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da raça (pode ser nula se não informada)',
    example: 'https://exemplo.com/elfo.jpg',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description:
      'Características físicas da raça em HTML (pode ser nula se não informada)',
    example: '<p>Orelhas pontudas, estatura esguia e traços delicados</p>',
  })
  physicalCharacteristics: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da raça em HTML (pode ser nula se não informada)',
    example: '<p>Povo antigo, ligado à natureza e à magia</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da raça em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à raça',
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-15T10:30:00Z',
  })
  updatedAt: Date;

  static fromEntity(race: Race): RaceResponseDto {
    const dto = new RaceResponseDto();
    dto.id = race.id;
    dto.name = race.name;
    dto.category = RaceCategoryResponseDto.fromEntity(race.category);
    dto.referenceImageUrl = race.referenceImageUrl;
    dto.physicalCharacteristics = race.physicalCharacteristics;
    dto.description = race.description;
    dto.privateInformation = race.privateInformation;
    dto.tags = (race.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag));
    dto.createdAt = race.createdAt;
    dto.updatedAt = race.updatedAt;
    return dto;
  }
}
