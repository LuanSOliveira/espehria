import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Utility } from '../entities/utility.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class UtilityResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do utilitário',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do utilitário',
    example: 'Kit de Escalada',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do utilitário',
    example: 'https://exemplo.com/kit-de-escalada.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do utilitário em HTML',
    example: '<p>Conjunto de cordas, ganchos e mosquetões</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Preço do utilitário (texto livre)',
    example: '5 moedas de prata',
  })
  price: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do utilitário em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao utilitário',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(utility: Utility): UtilityResponseDto {
    const dto = new UtilityResponseDto();
    dto.id = utility.id;
    dto.name = utility.name;
    dto.referenceImage = utility.referenceImage;
    dto.description = utility.description;
    dto.price = utility.price;
    dto.privateInformation = utility.privateInformation;
    dto.tags = (utility.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = utility.createdAt;
    dto.updatedAt = utility.updatedAt;
    return dto;
  }
}
