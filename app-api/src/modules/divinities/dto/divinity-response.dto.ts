import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Divinity } from '../entities/divinity.entity';
import { DivinityCategoryResponseDto } from './divinity-category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class DivinityResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador único da divindade',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da divindade',
    example: 'Zeus',
  })
  name: string;

  @ApiProperty({
    type: () => DivinityCategoryResponseDto,
    description: 'Categoria da divindade',
  })
  category: DivinityCategoryResponseDto;

  @ApiPropertyOptional({
    description:
      'URL de uma imagem de referência da divindade (pode ser nula se não informada; nome de propriedade diverge intencionalmente de "referenceImageUrl", usado em outras entidades do projeto, por especificação literal do requisito)',
    example: 'https://exemplo.com/zeus.jpg',
  })
  referenceImage: string | null;

  @ApiPropertyOptional({
    description:
      'Descrição da divindade em HTML (pode ser nula se não informada)',
    example: '<p>Deus do trovão e governante do Olimpo</p>',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Títulos da divindade (pode ser nulo se não informado)',
    example: 'Rei dos Deuses, Senhor do Olimpo',
  })
  titles: string | null;

  @ApiPropertyOptional({
    description: 'Alinhamento da divindade (pode ser nulo se não informado)',
    example: 'Bem',
  })
  alignment: string | null;

  @ApiPropertyOptional({
    description:
      'Esfera de domínio da divindade (pode ser nula se não informada)',
    example: 'Céu e trovões',
  })
  domainSphere: string | null;

  @ApiPropertyOptional({
    description:
      'Elemento primário da divindade (pode ser nulo se não informado)',
    example: 'Ar',
  })
  primaryElement: string | null;

  @ApiPropertyOptional({
    description:
      'Símbolo sagrado da divindade (recebe uma URL de imagem, mas é tratado como texto comum; pode ser nulo se não informado)',
    example: 'https://exemplo.com/simbolo-zeus.jpg',
  })
  sacredSymbol: string | null;

  @ApiPropertyOptional({
    description: 'Animal sagrado da divindade (pode ser nulo se não informado)',
    example: 'Águia',
  })
  sacredAnimal: string | null;

  @ApiPropertyOptional({
    description: 'Cor sagrada da divindade (pode ser nula se não informada)',
    example: 'Dourado',
  })
  sacredColor: string | null;

  @ApiPropertyOptional({
    description:
      'Personalidade da divindade em HTML (pode ser nula se não informada)',
    example: '<p>Orgulhoso, justo e por vezes colérico</p>',
  })
  personality: string | null;

  @ApiPropertyOptional({
    description:
      'Domínios divinos da divindade em HTML (pode ser nulo se não informado)',
    example: '<p>Céu, trovões e justiça</p>',
  })
  divineDomains: string | null;

  @ApiPropertyOptional({
    description:
      'Poderes da divindade em HTML (pode ser nulo se não informado)',
    example: '<p>Controle sobre raios e tempestades</p>',
  })
  powers: string | null;

  @ApiPropertyOptional({
    description:
      'Influência da divindade no mundo em HTML (pode ser nula se não informada)',
    example: '<p>Venerado em toda a Grécia Antiga</p>',
  })
  worldInfluence: string | null;

  @ApiPropertyOptional({
    description:
      'Aparência divina da divindade em HTML (pode ser nula se não informada)',
    example: '<p>Homem maduro, barbado, com um raio em mãos</p>',
  })
  divineAppearance: string | null;

  @ApiPropertyOptional({
    description:
      'Avatares da divindade em HTML (pode ser nulo se não informado)',
    example: '<p>Touro, cisne, chuva dourada</p>',
  })
  avatars: string | null;

  @ApiPropertyOptional({
    description: 'Igreja da divindade em HTML (pode ser nula se não informada)',
    example: '<p>Templo de Zeus em Olímpia</p>',
  })
  church: string | null;

  @ApiPropertyOptional({
    description: 'Culto da divindade em HTML (pode ser nulo se não informado)',
    example: '<p>Culto olímpico</p>',
  })
  cult: string | null;

  @ApiPropertyOptional({
    description:
      'Bênçãos concedidas pela divindade em HTML (pode ser nulas se não informadas)',
    example: '<p>Proteção contra tempestades</p>',
  })
  blessings: string | null;

  @ApiPropertyOptional({
    description:
      'Maldições lançadas pela divindade em HTML (pode ser nulas se não informadas)',
    example: '<p>Raios sobre os que quebram juramentos</p>',
  })
  curses: string | null;

  @ApiPropertyOptional({
    description:
      'Lendas associadas à divindade em HTML (pode ser nulas se não informadas)',
    example: '<p>A luta contra os Titãs</p>',
  })
  legends: string | null;

  @ApiPropertyOptional({
    description:
      'Mandamentos da divindade em HTML (pode ser nulos se não informados)',
    example: '<p>Honrar os juramentos feitos em seu nome</p>',
  })
  commandments: string | null;

  @ApiPropertyOptional({
    description:
      'Juramentos associados à divindade em HTML (pode ser nulos se não informados)',
    example: '<p>Juramento sagrado pelo rio Estige</p>',
  })
  oaths: string | null;

  @ApiPropertyOptional({
    description:
      'Curiosidades sobre a divindade em HTML (pode ser nulas se não informadas)',
    example: '<p>Zeus derrubou seu pai Cronos do trono</p>',
  })
  curiosities: string | null;

  @ApiPropertyOptional({
    description: 'Informações privadas da divindade em HTML',
  })
  privateInformation: string | null;

  @ApiProperty({
    type: () => [TagResponseDto],
    description: 'Tags associadas à divindade, na ordem de inserção',
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

  static fromEntity(divinity: Divinity): DivinityResponseDto {
    const dto = new DivinityResponseDto();
    dto.id = divinity.id;
    dto.name = divinity.name;
    dto.category = DivinityCategoryResponseDto.fromEntity(divinity.category);
    dto.referenceImage = divinity.referenceImage;
    dto.description = divinity.description;
    dto.titles = divinity.titles;
    dto.alignment = divinity.alignment;
    dto.domainSphere = divinity.domainSphere;
    dto.primaryElement = divinity.primaryElement;
    dto.sacredSymbol = divinity.sacredSymbol;
    dto.sacredAnimal = divinity.sacredAnimal;
    dto.sacredColor = divinity.sacredColor;
    dto.personality = divinity.personality;
    dto.divineDomains = divinity.divineDomains;
    dto.powers = divinity.powers;
    dto.worldInfluence = divinity.worldInfluence;
    dto.divineAppearance = divinity.divineAppearance;
    dto.avatars = divinity.avatars;
    dto.church = divinity.church;
    dto.cult = divinity.cult;
    dto.blessings = divinity.blessings;
    dto.curses = divinity.curses;
    dto.legends = divinity.legends;
    dto.commandments = divinity.commandments;
    dto.oaths = divinity.oaths;
    dto.curiosities = divinity.curiosities;
    dto.privateInformation = divinity.privateInformation;
    dto.tags = (divinity.tags ?? []).map((tag) =>
      TagResponseDto.fromEntity(tag),
    );
    dto.createdAt = divinity.createdAt;
    dto.updatedAt = divinity.updatedAt;
    return dto;
  }
}
