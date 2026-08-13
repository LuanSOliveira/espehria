import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSizeGradesTable1784306630000 implements MigrationInterface {
  name = 'SeedSizeGradesTable1784306630000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "size_grades" ("name", "order") VALUES ('Minúsculo', 1), ('Pequeno', 2), ('Médio', 3), ('Grande', 4), ('Enorme', 5), ('Imenso', 6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "size_grades" WHERE "name" IN ('Minúsculo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso')`,
    );
  }
}
