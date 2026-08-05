import { MigrationInterface, QueryRunner } from 'typeorm';

const PROFICIENCY_PROPERTY_NAMES = [
  'Acrobatismo',
  'Arcanismo',
  'Atletismo',
  'Diplomacia',
  'Dissimulação',
  'Furtividade',
  'Intimidação',
  'Ladroagem',
  'Manufatura',
  'Medicina',
  'Natureza',
  'Ocultismo',
  'Performance',
  'Percepção',
  'Religião',
  'Sobrevivência',
  'Sociedade',
  'Fortitude',
  'Reflexo',
  'Vontade',
];

export class SeedProficiencyPropertiesTable1784306320000 implements MigrationInterface {
  name = 'SeedProficiencyPropertiesTable1784306320000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "proficiency_properties" ("name") VALUES ${PROFICIENCY_PROPERTY_NAMES.map(
        (name) => `('${name}')`,
      ).join(', ')}`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "proficiency_properties" WHERE "name" IN (${PROFICIENCY_PROPERTY_NAMES.map(
        (name) => `'${name}'`,
      ).join(', ')})`,
    );
  }
}
