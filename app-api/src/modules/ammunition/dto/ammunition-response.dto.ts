import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ammunition } from '../entities/ammunition.entity';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class AmmunitionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único do item de munição',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do item de munição',
    example: 'Flecha de Aço',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência do item de munição',
    example: 'https://exemplo.com/flecha-de-aco.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description: 'Descrição do item de munição em HTML',
    example: '<p>Flecha com ponta de aço reforçado</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Preço do item de munição (texto livre)',
    example: '5 moedas de cobre',
  })
  price: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas do item de munição em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas ao item de munição',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(ammunition: Ammunition): AmmunitionResponseDto {
    const dto = new AmmunitionResponseDto();
    dto.id = ammunition.id;
    dto.name = ammunition.name;
    dto.referenceImage = ammunition.referenceImage;
    dto.description = ammunition.description;
    dto.price = ammunition.price;
    dto.privateInformation = ammunition.privateInformation;
    dto.tags = (ammunition.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = ammunition.createdAt;
    dto.updatedAt = ammunition.updatedAt;
    return dto;
  }
}
