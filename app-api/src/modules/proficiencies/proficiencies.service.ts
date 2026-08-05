import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { Proficiency } from './entities/proficiency.entity';
import { ProficiencyProperty } from '../proficiency-properties/entities/proficiency-property.entity';
import { ProficiencyGradation } from '../proficiency-gradations/entities/proficiency-gradation.entity';
import { ProficiencyOwnerType } from './enums/proficiency-owner-type.enum';
import { ProficiencyItemInputDto } from './dto/proficiency-item-input.dto';
import { ProficiencyItemResponseDto } from './dto/proficiency-item-response.dto';

export interface ResolvedProficiencyItem {
  property: ProficiencyProperty;
  gradation: ProficiencyGradation;
}

type OwnerColumn =
  | 'ownerTalent'
  | 'ownerTraining'
  | 'ownerCharacteristic'
  | 'ownerBiography'
  | 'ownerRace';

@Injectable()
export class ProficienciesService {
  constructor(
    @InjectRepository(Proficiency)
    private readonly proficienciesRepository: Repository<Proficiency>,
    @InjectRepository(ProficiencyProperty)
    private readonly proficiencyPropertiesRepository: Repository<ProficiencyProperty>,
    @InjectRepository(ProficiencyGradation)
    private readonly proficiencyGradationsRepository: Repository<ProficiencyGradation>,
  ) {}

  private ownerColumnFor(ownerType: ProficiencyOwnerType): OwnerColumn {
    switch (ownerType) {
      case ProficiencyOwnerType.TALENT:
        return 'ownerTalent';
      case ProficiencyOwnerType.TRAINING:
        return 'ownerTraining';
      case ProficiencyOwnerType.CHARACTERISTIC:
        return 'ownerCharacteristic';
      case ProficiencyOwnerType.BIOGRAPHY:
        return 'ownerBiography';
      case ProficiencyOwnerType.RACE:
        return 'ownerRace';
    }
  }

  async validateAndResolveItems(
    items: ProficiencyItemInputDto[],
  ): Promise<Map<string, ResolvedProficiencyItem>> {
    const resolved = new Map<string, ResolvedProficiencyItem>();
    if (items.length === 0) {
      return resolved;
    }

    const propertyIds = [...new Set(items.map((item) => item.property))];
    const gradationIds = [...new Set(items.map((item) => item.gradation))];

    const [properties, gradations] = await Promise.all([
      this.proficiencyPropertiesRepository.findBy({ id: In(propertyIds) }),
      this.proficiencyGradationsRepository.findBy({ id: In(gradationIds) }),
    ]);

    if (
      properties.length !== propertyIds.length ||
      gradations.length !== gradationIds.length
    ) {
      throw new NotFoundException(
        'Uma ou mais propriedades ou graduações de proficiência não foram encontradas.',
      );
    }

    const propertiesById = new Map(
      properties.map((property) => [property.id, property]),
    );
    const gradationsById = new Map(
      gradations.map((gradation) => [gradation.id, gradation]),
    );

    for (const item of items) {
      const property = propertiesById.get(item.property);
      const gradation = gradationsById.get(item.gradation);
      if (!property || !gradation) {
        throw new NotFoundException(
          'Uma ou mais propriedades ou graduações de proficiência não foram encontradas.',
        );
      }
      resolved.set(item.property, { property, gradation });
    }

    return resolved;
  }

  validateList(items: ProficiencyItemInputDto[]): void {
    const propertyIds = new Set<string>();
    for (const item of items) {
      if (propertyIds.has(item.property)) {
        throw new ConflictException(
          'Uma mesma propriedade de proficiência não pode ser adicionada duas vezes.',
        );
      }
      propertyIds.add(item.property);
    }
  }

  async replaceItems(
    ownerType: ProficiencyOwnerType,
    ownerId: string,
    items: ProficiencyItemInputDto[],
    resolvedItems?: Map<string, ResolvedProficiencyItem>,
  ): Promise<void> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    await this.proficienciesRepository.delete({
      [ownerColumn]: { id: ownerId },
    } as FindOptionsWhere<Proficiency>);

    if (items.length === 0) {
      return;
    }

    const resolved =
      resolvedItems ?? (await this.validateAndResolveItems(items));

    const rows = items.map((item, index) => {
      const resolvedItem = resolved.get(item.property);
      if (!resolvedItem) {
        throw new NotFoundException(
          'Uma ou mais propriedades ou graduações de proficiência não foram encontradas.',
        );
      }
      const rowData: Record<string, unknown> = {
        sortOrder: index,
        property: { id: resolvedItem.property.id },
        gradation: { id: resolvedItem.gradation.id },
        [ownerColumn]: { id: ownerId },
      };
      return this.proficienciesRepository.create(
        rowData as DeepPartial<Proficiency>,
      );
    });

    await this.proficienciesRepository.save(rows);
  }

  async loadItemsFor(
    ownerType: ProficiencyOwnerType,
    ownerId: string,
  ): Promise<ProficiencyItemResponseDto[]> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    const items = await this.proficienciesRepository.find({
      where: {
        [ownerColumn]: { id: ownerId },
      } as FindOptionsWhere<Proficiency>,
      relations: { property: true, gradation: true },
      order: { sortOrder: 'ASC' },
    });

    return items.map((item) => ProficiencyItemResponseDto.fromResolved(item));
  }
}
