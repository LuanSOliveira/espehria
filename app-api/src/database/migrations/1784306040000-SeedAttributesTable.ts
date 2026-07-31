import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAttributesTable1784306040000 implements MigrationInterface {
  name = 'SeedAttributesTable1784306040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "attributes" ("name") VALUES ('Força'), ('Destreza'), ('Constituição'), ('Inteligência'), ('Sabedoria'), ('Carisma')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "attributes" WHERE "name" IN ('Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma')`,
    );
  }
}
