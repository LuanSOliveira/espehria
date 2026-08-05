import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProficiencyGradationsTable1784306340000 implements MigrationInterface {
  name = 'SeedProficiencyGradationsTable1784306340000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "proficiency_gradations" ("name", "level") VALUES ('Destreinado', 1), ('Básico', 2), ('Avançado', 3), ('Especialista', 4), ('Lendário', 5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "proficiency_gradations" WHERE "name" IN ('Destreinado', 'Básico', 'Avançado', 'Especialista', 'Lendário')`,
    );
  }
}
