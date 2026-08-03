import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedImprovementFlawTypesTable1784306190000 implements MigrationInterface {
  name = 'SeedImprovementFlawTypesTable1784306190000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "improvement_flaw_types" ("name") VALUES ('Ataque'), ('Teste de Resistência')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_types" WHERE "name" IN ('Ataque', 'Teste de Resistência')`,
    );
  }
}
