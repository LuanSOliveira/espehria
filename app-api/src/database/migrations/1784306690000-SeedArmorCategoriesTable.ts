import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedArmorCategoriesTable1784306690000 implements MigrationInterface {
  name = 'SeedArmorCategoriesTable1784306690000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "armor_categories" ("name", "order") VALUES ('Sem Armadura', 1), ('Armadura Leve', 2), ('Armadura Média', 3), ('Armadura Pesada', 4)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "armor_categories" WHERE "name" IN ('Sem Armadura', 'Armadura Leve', 'Armadura Média', 'Armadura Pesada')`,
    );
  }
}
