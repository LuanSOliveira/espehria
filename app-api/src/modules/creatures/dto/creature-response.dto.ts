import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Creature } from '../entities/creature.entity';
import { CreatureCategoryResponseDto } from './creature-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CreatureResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da criatura',
  })
  id: string;

  @ApiProperty({ description: 'Nome da criatura' })
  name: string;

  @ApiProperty({
    type: () => CreatureCategoryResponseDto,
    description: 'Categoria da criatura',
  })
  category: CreatureCategoryResponseDto;

  @ApiPropertyOptional({
    description: 'URL de uma imagem de referência da criatura',
  })
  referenceImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Outros nomes pelos quais a criatura é conhecida',
  })
  otherNames: string | null;

  @ApiPropertyOptional({ description: 'Nível de ameaça da criatura' })
  threatLevel: string | null;

  @ApiPropertyOptional({ description: 'Expectativa de vida média da criatura' })
  averageLifeExpectancy: string | null;

  @ApiPropertyOptional({
    description: 'Características físicas da criatura (HTML)',
  })
  physicalCharacteristics: string | null;

  @ApiPropertyOptional({
    description: 'Habitat onde a criatura é encontrada (HTML)',
  })
  habitat: string | null;

  @ApiPropertyOptional({ description: 'Comportamento da criatura (HTML)' })
  behavior: string | null;

  @ApiPropertyOptional({
    description: 'Alimentação e dieta da criatura (HTML)',
  })
  diet: string | null;

  @ApiPropertyOptional({ description: 'Ciclo de vida da criatura (HTML)' })
  lifeCycle: string | null;

  @ApiPropertyOptional({
    description: 'Características do estágio filhote (HTML)',
  })
  lifeStageInfant: string | null;

  @ApiPropertyOptional({
    description: 'Características do estágio jovem (HTML)',
  })
  lifeStageYoung: string | null;

  @ApiPropertyOptional({
    description: 'Características do estágio adulto (HTML)',
  })
  lifeStageAdult: string | null;

  @ApiPropertyOptional({
    description: 'Características do estágio ancião (HTML)',
  })
  lifeStageElder: string | null;

  @ApiPropertyOptional({
    description: 'Habilidades e poderes da criatura (HTML)',
  })
  abilitiesAndPowers: string | null;

  @ApiPropertyOptional({ description: 'Resistências da criatura (HTML)' })
  resistances: string | null;

  @ApiPropertyOptional({ description: 'Fraquezas da criatura (HTML)' })
  weaknesses: string | null;

  @ApiPropertyOptional({
    description: 'Informações sobre combate com a criatura (HTML)',
  })
  combat: string | null;

  @ApiPropertyOptional({ description: 'Métodos de ataque da criatura (HTML)' })
  attackMethods: string | null;

  @ApiPropertyOptional({
    description: 'Estratégia de combate da criatura (HTML)',
  })
  strategy: string | null;

  @ApiPropertyOptional({ description: 'Grau de perigo da criatura (HTML)' })
  dangerDegree: string | null;

  @ApiPropertyOptional({ description: 'Recursos obtidos da criatura (HTML)' })
  obtainedResources: string | null;

  @ApiPropertyOptional({ description: 'Valor comercial da criatura (HTML)' })
  commercialValue: string | null;

  @ApiPropertyOptional({
    description: 'Relação da criatura com civilizações (HTML)',
  })
  relationWithCivilizations: string | null;

  @ApiPropertyOptional({
    description: 'Mitologia e folclore relacionados à criatura (HTML)',
  })
  mythologyAndFolklore: string | null;

  @ApiPropertyOptional({
    description: 'Registros de encontros com a criatura (HTML)',
  })
  encounterRecord: string | null;

  @ApiPropertyOptional({
    description: 'Curiosidades dos estudiosos sobre a criatura (HTML)',
  })
  scholarsCuriosity: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da criatura (HTML)',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à criatura, na ordem de inserção',
  })
  tags: TagResponseDto[];

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;

  static fromEntity(creature: Creature): CreatureResponseDto {
    const dto = new CreatureResponseDto();
    dto.id = creature.id;
    dto.name = creature.name;
    dto.category = CreatureCategoryResponseDto.fromEntity(creature.category);
    dto.referenceImageUrl = creature.referenceImageUrl;
    dto.otherNames = creature.otherNames;
    dto.threatLevel = creature.threatLevel;
    dto.averageLifeExpectancy = creature.averageLifeExpectancy;
    dto.physicalCharacteristics = creature.physicalCharacteristics;
    dto.habitat = creature.habitat;
    dto.behavior = creature.behavior;
    dto.diet = creature.diet;
    dto.lifeCycle = creature.lifeCycle;
    dto.lifeStageInfant = creature.lifeStageInfant;
    dto.lifeStageYoung = creature.lifeStageYoung;
    dto.lifeStageAdult = creature.lifeStageAdult;
    dto.lifeStageElder = creature.lifeStageElder;
    dto.abilitiesAndPowers = creature.abilitiesAndPowers;
    dto.resistances = creature.resistances;
    dto.weaknesses = creature.weaknesses;
    dto.combat = creature.combat;
    dto.attackMethods = creature.attackMethods;
    dto.strategy = creature.strategy;
    dto.dangerDegree = creature.dangerDegree;
    dto.obtainedResources = creature.obtainedResources;
    dto.commercialValue = creature.commercialValue;
    dto.relationWithCivilizations = creature.relationWithCivilizations;
    dto.mythologyAndFolklore = creature.mythologyAndFolklore;
    dto.encounterRecord = creature.encounterRecord;
    dto.scholarsCuriosity = creature.scholarsCuriosity;
    dto.privateInformation = creature.privateInformation;
    dto.tags = (creature.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = creature.createdAt;
    dto.updatedAt = creature.updatedAt;
    return dto;
  }
}
