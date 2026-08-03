import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { ImprovementFlaw } from './entities/improvement-flaw.entity';
import { ImprovementFlawType } from '../improvement-flaw-types/entities/improvement-flaw-type.entity';
import { ImprovementFlawProperty } from '../improvement-flaw-properties/entities/improvement-flaw-property.entity';
import { ImprovementFlawCategory } from './enums/improvement-flaw-category.enum';
import { ImprovementFlawOwnerType } from './enums/improvement-flaw-owner-type.enum';
import { ImprovementFlawItemInputDto } from './dto/improvement-flaw-item-input.dto';
import { ImprovementFlawItemResponseDto } from './dto/improvement-flaw-item-response.dto';

export interface ResolvedImprovementFlawItem {
  type: ImprovementFlawType;
  property: ImprovementFlawProperty;
}

type OwnerColumn =
  'ownerTalent' | 'ownerTraining' | 'ownerCharacteristic' | 'ownerBiography';

@Injectable()
export class ImprovementFlawsService {
  constructor(
    @InjectRepository(ImprovementFlaw)
    private readonly improvementFlawsRepository: Repository<ImprovementFlaw>,
    @InjectRepository(ImprovementFlawType)
    private readonly improvementFlawTypesRepository: Repository<ImprovementFlawType>,
    @InjectRepository(ImprovementFlawProperty)
    private readonly improvementFlawPropertiesRepository: Repository<ImprovementFlawProperty>,
  ) {}

  private ownerColumnFor(ownerType: ImprovementFlawOwnerType): OwnerColumn {
    switch (ownerType) {
      case ImprovementFlawOwnerType.TALENT:
        return 'ownerTalent';
      case ImprovementFlawOwnerType.TRAINING:
        return 'ownerTraining';
      case ImprovementFlawOwnerType.CHARACTERISTIC:
        return 'ownerCharacteristic';
      case ImprovementFlawOwnerType.BIOGRAPHY:
        return 'ownerBiography';
    }
  }

  async validateAndResolveItems(
    items: ImprovementFlawItemInputDto[],
  ): Promise<Map<string, ResolvedImprovementFlawItem>> {
    const resolved = new Map<string, ResolvedImprovementFlawItem>();
    if (items.length === 0) {
      return resolved;
    }

    const typeIds = [...new Set(items.map((item) => item.type))];
    const propertyIds = [...new Set(items.map((item) => item.property))];

    const [types, properties] = await Promise.all([
      this.improvementFlawTypesRepository.findBy({ id: In(typeIds) }),
      this.improvementFlawPropertiesRepository.find({
        where: { id: In(propertyIds) },
        relations: { types: true },
      }),
    ]);

    if (
      types.length !== typeIds.length ||
      properties.length !== propertyIds.length
    ) {
      throw new NotFoundException(
        'Um ou mais tipos ou propriedades de melhoria/defeito não foram encontrados.',
      );
    }

    const typesById = new Map(types.map((type) => [type.id, type]));
    const propertiesById = new Map(
      properties.map((property) => [property.id, property]),
    );

    for (const item of items) {
      const type = typesById.get(item.type);
      const property = propertiesById.get(item.property);
      if (!type || !property) {
        throw new NotFoundException(
          'Um ou mais tipos ou propriedades de melhoria/defeito não foram encontrados.',
        );
      }
      if (!property.types.some((type) => type.id === item.type)) {
        throw new ConflictException(
          'A propriedade selecionada não é compatível com o tipo selecionado.',
        );
      }
      resolved.set(`${item.type}:${item.property}`, { type, property });
    }

    return resolved;
  }

  validateLists(params: {
    improvements: ImprovementFlawItemInputDto[];
    flaws: ImprovementFlawItemInputDto[];
  }): void {
    const { improvements, flaws } = params;
    const key = (item: ImprovementFlawItemInputDto) =>
      `${item.type}:${item.property}`;

    const improvementsKeys = new Set<string>();
    for (const item of improvements) {
      const itemKey = key(item);
      if (improvementsKeys.has(itemKey)) {
        throw new ConflictException(
          'Uma mesma combinação de Tipo e Propriedade não pode ser adicionada duas vezes na mesma lista.',
        );
      }
      improvementsKeys.add(itemKey);
    }

    const flawsKeys = new Set<string>();
    for (const item of flaws) {
      const itemKey = key(item);
      if (flawsKeys.has(itemKey)) {
        throw new ConflictException(
          'Uma mesma combinação de Tipo e Propriedade não pode ser adicionada duas vezes na mesma lista.',
        );
      }
      flawsKeys.add(itemKey);
    }

    for (const itemKey of improvementsKeys) {
      if (flawsKeys.has(itemKey)) {
        throw new ConflictException(
          'Uma mesma combinação de Tipo e Propriedade não pode estar em Melhorias e em Defeitos ao mesmo tempo.',
        );
      }
    }
  }

  async replaceItems(
    ownerType: ImprovementFlawOwnerType,
    ownerId: string,
    category: ImprovementFlawCategory,
    items: ImprovementFlawItemInputDto[],
    resolvedItems?: Map<string, ResolvedImprovementFlawItem>,
  ): Promise<void> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    const deleteCriteria: Record<string, unknown> = {
      category,
      [ownerColumn]: { id: ownerId },
    };
    await this.improvementFlawsRepository.delete(deleteCriteria);

    if (items.length === 0) {
      return;
    }

    const resolved =
      resolvedItems ?? (await this.validateAndResolveItems(items));

    const rows = items.map((item, index) => {
      const resolvedItem = resolved.get(`${item.type}:${item.property}`);
      if (!resolvedItem) {
        throw new NotFoundException(
          'Um ou mais tipos ou propriedades de melhoria/defeito não foram encontrados.',
        );
      }
      const rowData: Record<string, unknown> = {
        category,
        value: item.value,
        sortOrder: index,
        type: { id: resolvedItem.type.id },
        property: { id: resolvedItem.property.id },
        [ownerColumn]: { id: ownerId },
      };
      return this.improvementFlawsRepository.create(
        rowData as DeepPartial<ImprovementFlaw>,
      );
    });

    await this.improvementFlawsRepository.save(rows);
  }

  async loadItemsFor(
    ownerType: ImprovementFlawOwnerType,
    ownerId: string,
  ): Promise<{
    improvements: ImprovementFlawItemResponseDto[];
    flaws: ImprovementFlawItemResponseDto[];
  }> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    const whereCriteria: Record<string, unknown> = {
      [ownerColumn]: { id: ownerId },
    };

    const items = await this.improvementFlawsRepository.find({
      where: whereCriteria as FindOptionsWhere<ImprovementFlaw>,
      relations: { type: true, property: { types: true } },
      order: { sortOrder: 'ASC' },
    });

    const improvements = items
      .filter((item) => item.category === ImprovementFlawCategory.IMPROVEMENT)
      .map((item) => ImprovementFlawItemResponseDto.fromResolved(item));

    const flaws = items
      .filter((item) => item.category === ImprovementFlawCategory.FLAW)
      .map((item) => ImprovementFlawItemResponseDto.fromResolved(item));

    return { improvements, flaws };
  }
}
