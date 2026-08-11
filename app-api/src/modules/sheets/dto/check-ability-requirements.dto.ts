import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { EntityReferenceInputDto } from '../../entity-links/dto/entity-reference-input.dto';

export class CheckAbilityRequirementsDto {
  @ApiProperty({
    type: () => [EntityReferenceInputDto],
    description:
      'Itens do catálogo a avaliar (entityType restrito a training | talent | characteristic — 400 caso outro tipo seja enviado)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  items: EntityReferenceInputDto[];
}
