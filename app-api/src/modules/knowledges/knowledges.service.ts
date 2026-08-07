import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { Knowledge } from './entities/knowledge.entity';
import { ProficiencyGradation } from '../proficiency-gradations/entities/proficiency-gradation.entity';
import { KnowledgeOwnerType } from './enums/knowledge-owner-type.enum';
import { KnowledgeItemInputDto } from './dto/knowledge-item-input.dto';
import { KnowledgeItemResponseDto } from './dto/knowledge-item-response.dto';

export interface ResolvedKnowledgeItem {
  title: string;
  gradation: ProficiencyGradation;
  editable: boolean;
}

type OwnerColumn =
  | 'ownerTalent'
  | 'ownerTraining'
  | 'ownerCharacteristic'
  | 'ownerBiography'
  | 'ownerRace';

@Injectable()
export class KnowledgesService {
  constructor(
    @InjectRepository(Knowledge)
    private readonly knowledgesRepository: Repository<Knowledge>,
    @InjectRepository(ProficiencyGradation)
    private readonly proficiencyGradationsRepository: Repository<ProficiencyGradation>,
  ) {}

  private ownerColumnFor(ownerType: KnowledgeOwnerType): OwnerColumn {
    switch (ownerType) {
      case KnowledgeOwnerType.TALENT:
        return 'ownerTalent';
      case KnowledgeOwnerType.TRAINING:
        return 'ownerTraining';
      case KnowledgeOwnerType.CHARACTERISTIC:
        return 'ownerCharacteristic';
      case KnowledgeOwnerType.BIOGRAPHY:
        return 'ownerBiography';
      case KnowledgeOwnerType.RACE:
        return 'ownerRace';
    }
  }

  async validateAndResolveItems(
    items: KnowledgeItemInputDto[],
  ): Promise<Map<string, ResolvedKnowledgeItem>> {
    const resolved = new Map<string, ResolvedKnowledgeItem>();
    if (items.length === 0) {
      return resolved;
    }

    const gradationIds = [...new Set(items.map((item) => item.gradation))];

    const gradations = await this.proficiencyGradationsRepository.findBy({
      id: In(gradationIds),
    });

    if (gradations.length !== gradationIds.length) {
      throw new NotFoundException(
        'Uma ou mais graduações de saber não foram encontradas.',
      );
    }

    const gradationsById = new Map(
      gradations.map((gradation) => [gradation.id, gradation]),
    );

    for (const item of items) {
      const gradation = gradationsById.get(item.gradation);
      if (!gradation) {
        throw new NotFoundException(
          'Uma ou mais graduações de saber não foram encontradas.',
        );
      }
      const normalizedTitle = item.title.trim().toLowerCase();
      resolved.set(normalizedTitle, {
        title: item.title.trim(),
        gradation,
        editable: item.editable ?? false,
      });
    }

    return resolved;
  }

  validateList(items: KnowledgeItemInputDto[]): void {
    const normalizedTitles = new Set<string>();
    for (const item of items) {
      const normalizedTitle = item.title.trim().toLowerCase();
      if (normalizedTitles.has(normalizedTitle)) {
        throw new ConflictException(
          'Um mesmo saber não pode ser adicionado duas vezes com o mesmo título.',
        );
      }
      normalizedTitles.add(normalizedTitle);
    }
  }

  async replaceItems(
    ownerType: KnowledgeOwnerType,
    ownerId: string,
    items: KnowledgeItemInputDto[],
    resolvedItems?: Map<string, ResolvedKnowledgeItem>,
  ): Promise<void> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    await this.knowledgesRepository.delete({
      [ownerColumn]: { id: ownerId },
    });

    if (items.length === 0) {
      return;
    }

    const resolved =
      resolvedItems ?? (await this.validateAndResolveItems(items));

    const rows = items.map((item, index) => {
      const normalizedTitle = item.title.trim().toLowerCase();
      const resolvedItem = resolved.get(normalizedTitle);
      if (!resolvedItem) {
        throw new NotFoundException(
          'Uma ou mais graduações de saber não foram encontradas.',
        );
      }
      const rowData: Record<string, unknown> = {
        sortOrder: index,
        title: resolvedItem.title,
        gradation: { id: resolvedItem.gradation.id },
        editable: resolvedItem.editable,
        [ownerColumn]: { id: ownerId },
      };
      return this.knowledgesRepository.create(
        rowData as DeepPartial<Knowledge>,
      );
    });

    await this.knowledgesRepository.save(rows);
  }

  async loadItemsFor(
    ownerType: KnowledgeOwnerType,
    ownerId: string,
  ): Promise<KnowledgeItemResponseDto[]> {
    const ownerColumn = this.ownerColumnFor(ownerType);

    const items = await this.knowledgesRepository.find({
      where: {
        [ownerColumn]: { id: ownerId },
      } as FindOptionsWhere<Knowledge>,
      relations: { gradation: true },
      order: { sortOrder: 'ASC' },
    });

    return items.map((item) => KnowledgeItemResponseDto.fromResolved(item));
  }
}
