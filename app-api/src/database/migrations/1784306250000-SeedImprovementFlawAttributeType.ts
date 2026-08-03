import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedImprovementFlawAttributeType1784306250000 implements MigrationInterface {
  name = 'SeedImprovementFlawAttributeType1784306250000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "improvement_flaw_types" ("name") VALUES ('Atributo')`,
    );

    await queryRunner.query(
      `INSERT INTO "improvement_flaw_property_types" ("property_id", "type_id")
       SELECT p.id, t.id
       FROM "improvement_flaw_properties" p
       JOIN "improvement_flaw_types" t ON t.name = 'Atributo'
       WHERE p.name IN ('Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_property_types" WHERE "type_id" = (SELECT "id" FROM "improvement_flaw_types" WHERE "name" = 'Atributo')`,
    );
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_types" WHERE "name" = 'Atributo'`,
    );
  }
}
