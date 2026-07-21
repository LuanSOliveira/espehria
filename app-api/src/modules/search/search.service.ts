import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Creature } from '../creatures/entities/creature.entity';
import { LinkableEntityType } from './enums/linkable-entity-type.enum';
import { SearchResultItemResponseDto } from './dto/search-result-item-response.dto';

const MAX_RESULTS = 10;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Creature)
    private readonly creaturesRepository: Repository<Creature>,
  ) {}

  async search(query: string): Promise<SearchResultItemResponseDto[]> {
    const linkableEntities = [
      { entityType: LinkableEntityType.USER, repository: this.usersRepository },
      {
        entityType: LinkableEntityType.CREATURE,
        repository: this.creaturesRepository,
      },
    ];

    const results: SearchResultItemResponseDto[] = [];

    for (const { entityType, repository } of linkableEntities) {
      const rows = await repository
        .createQueryBuilder('entity')
        .where('entity.name ILIKE :query', { query: `%${query}%` })
        .orderBy('entity.name', 'ASC')
        .take(MAX_RESULTS)
        .getMany();

      results.push(
        ...rows.map((row) =>
          SearchResultItemResponseDto.fromEntity(row, entityType),
        ),
      );
    }

    return results.slice(0, MAX_RESULTS);
  }
}
