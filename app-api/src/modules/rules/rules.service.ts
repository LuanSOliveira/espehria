import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '../../common/variables/pagination';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { FindRulesQueryDto } from './dto/find-rules-query.dto';
import { RuleSectionInputDto } from './dto/rule-section-input.dto';
import { Rule } from './entities/rule.entity';
import { RuleSection } from './entities/rule-section.entity';

export interface PaginatedRules {
  data: Rule[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule)
    private readonly rulesRepository: Repository<Rule>,
    @InjectRepository(RuleSection)
    private readonly ruleSectionsRepository: Repository<RuleSection>,
  ) {}

  findByName(name: string): Promise<Rule | null> {
    return this.rulesRepository.findOneBy({ name });
  }

  findById(id: string): Promise<Rule | null> {
    return this.rulesRepository.findOne({
      where: { id },
      relations: { sections: true },
    });
  }

  private buildSections(sections: RuleSectionInputDto[]): RuleSection[] {
    return sections.map((section, index) =>
      this.ruleSectionsRepository.create({
        label: section.label,
        description: section.description ?? null,
        order: index,
      }),
    );
  }

  async create(dto: CreateRuleDto): Promise<Rule> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Já existe uma regra com este nome.');
    }

    const sections =
      dto.sections && dto.sections.length > 0
        ? this.buildSections(dto.sections)
        : [];

    const rule = this.rulesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      sections,
    });

    return this.rulesRepository.save(rule);
  }

  async findAllPaginated(query: FindRulesQueryDto): Promise<PaginatedRules> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.rulesRepository.createQueryBuilder('rule');

    if (query.name) {
      queryBuilder.andWhere('rule.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('rule.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async update(id: string, dto: UpdateRuleDto): Promise<Rule> {
    const rule = await this.findById(id);
    if (!rule) {
      throw new NotFoundException('Regra não encontrada.');
    }

    if (dto.name && dto.name !== rule.name) {
      const existing = await this.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Já existe uma regra com este nome.');
      }
      rule.name = dto.name;
    }

    if (dto.description !== undefined) {
      rule.description = dto.description;
    }

    if (dto.sections !== undefined) {
      // Reatribuir `rule.sections` inteiro e deixar o cascade save cuidar da
      // remoção via orphanedRowAction falha com violação de not-null: o TypeORM
      // tenta primeiro um UPDATE setando "rule_id" = NULL nas linhas órfãs
      // antes de excluí-las, o que quebra a coluna NOT NULL (mesmo problema e
      // mesma solução usada em LocationsService.update). Por isso as seções
      // antigas são removidas explicitamente pelo repositório antes de
      // atribuir as novas.
      if (rule.sections.length > 0) {
        await this.ruleSectionsRepository.remove(rule.sections);
      }
      rule.sections =
        dto.sections.length > 0 ? this.buildSections(dto.sections) : [];
    }

    return this.rulesRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.rulesRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Regra não encontrada.');
    }
  }
}
