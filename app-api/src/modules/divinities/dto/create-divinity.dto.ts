import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateDivinityDto {
  @ApiProperty({
    example: 'Zeus',
    description: 'Nome da divindade (obrigatório e único)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID da categoria da divindade (obrigatório)',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/zeus.jpg',
    description:
      'URL de uma imagem de referência da divindade (nome de propriedade diverge intencionalmente de "referenceImageUrl", usado em outras entidades do projeto, por especificação literal do requisito)',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })
  referenceImage?: string;

  @ApiPropertyOptional({
    example: '<p>Deus do trovão e governante do Olimpo</p>',
    description: 'Descrição da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Rei dos Deuses, Senhor do Olimpo',
    description: 'Títulos da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  titles?: string;

  @ApiPropertyOptional({
    example: 'Bem',
    description: 'Alinhamento da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  alignment?: string;

  @ApiPropertyOptional({
    example: 'Céu e trovões',
    description: 'Esfera de domínio da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  domainSphere?: string;

  @ApiPropertyOptional({
    example: 'Ar',
    description: 'Elemento primário da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  primaryElement?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/simbolo-zeus.jpg',
    description:
      'Símbolo sagrado da divindade (recebe uma URL de imagem, mas é tratado como texto comum, sem validação de URL, opcional)',
  })
  @IsOptional()
  @IsString()
  sacredSymbol?: string;

  @ApiPropertyOptional({
    example: 'Águia',
    description: 'Animal sagrado da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  sacredAnimal?: string;

  @ApiPropertyOptional({
    example: 'Dourado',
    description: 'Cor sagrada da divindade (opcional)',
  })
  @IsOptional()
  @IsString()
  sacredColor?: string;

  @ApiPropertyOptional({
    example: '<p>Orgulhoso, justo e por vezes colérico</p>',
    description: 'Personalidade da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({
    example: '<p>Céu, trovões e justiça</p>',
    description: 'Domínios divinos da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  divineDomains?: string;

  @ApiPropertyOptional({
    example: '<p>Controle sobre raios e tempestades</p>',
    description: 'Poderes da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  powers?: string;

  @ApiPropertyOptional({
    example: '<p>Venerado em toda a Grécia Antiga</p>',
    description: 'Influência da divindade no mundo (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  worldInfluence?: string;

  @ApiPropertyOptional({
    example: '<p>Homem maduro, barbado, com um raio em mãos</p>',
    description: 'Aparência divina da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  divineAppearance?: string;

  @ApiPropertyOptional({
    example: '<p>Touro, cisne, chuva dourada</p>',
    description: 'Avatares da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  avatars?: string;

  @ApiPropertyOptional({
    example: '<p>Templo de Zeus em Olímpia</p>',
    description: 'Igreja da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  church?: string;

  @ApiPropertyOptional({
    example: '<p>Culto olímpico</p>',
    description: 'Culto da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  cult?: string;

  @ApiPropertyOptional({
    example: '<p>Proteção contra tempestades</p>',
    description: 'Bênçãos concedidas pela divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  blessings?: string;

  @ApiPropertyOptional({
    example: '<p>Raios sobre os que quebram juramentos</p>',
    description: 'Maldições lançadas pela divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  curses?: string;

  @ApiPropertyOptional({
    example: '<p>A luta contra os Titãs</p>',
    description: 'Lendas associadas à divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  legends?: string;

  @ApiPropertyOptional({
    example: '<p>Honrar os juramentos feitos em seu nome</p>',
    description: 'Mandamentos da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  commandments?: string;

  @ApiPropertyOptional({
    example: '<p>Juramento sagrado pelo rio Estige</p>',
    description: 'Juramentos associados à divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  oaths?: string;

  @ApiPropertyOptional({
    example: '<p>Zeus derrubou seu pai Cronos do trono</p>',
    description: 'Curiosidades sobre a divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  curiosities?: string;

  @ApiPropertyOptional({
    example: '<p>Anotações internas não destinadas ao público</p>',
    description: 'Informações privadas da divindade (suporta HTML, opcional)',
  })
  @IsOptional()
  @IsString()
  privateInformation?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs das tags associadas à divindade (array de UUIDs válidos)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
