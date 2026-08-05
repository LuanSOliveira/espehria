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

export class SeedImprovementFlawProficiencyType1784306290000 implements MigrationInterface {
  name = 'SeedImprovementFlawProficiencyType1784306290000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "improvement_flaw_types" ("name") VALUES ('Proficiência')`,
    );

    await queryRunner.query(
      `INSERT INTO "improvement_flaw_properties" ("name") VALUES ${PROFICIENCY_PROPERTY_NAMES.map(
        (name) => `('${name}')`,
      ).join(', ')}`,
    );

    await queryRunner.query(
      `INSERT INTO "improvement_flaw_property_types" ("property_id", "type_id")
       SELECT p.id, t.id
       FROM "improvement_flaw_properties" p
       JOIN "improvement_flaw_types" t ON t.name = 'Proficiência'
       WHERE p.name IN (${PROFICIENCY_PROPERTY_NAMES.map((name) => `'${name}'`).join(', ')})`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_property_types" WHERE "type_id" = (SELECT "id" FROM "improvement_flaw_types" WHERE "name" = 'Proficiência')`,
    );
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_properties" WHERE "name" IN (${PROFICIENCY_PROPERTY_NAMES.map(
        (name) => `'${name}'`,
      ).join(', ')})`,
    );
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_types" WHERE "name" = 'Proficiência'`,
    );
  }
}
