import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolumeToItemCatalogTables1784306800000 implements MigrationInterface {
  name = 'AddVolumeToItemCatalogTables1784306800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "utilities" ADD "volume" numeric(4,1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumables" ADD "volume" numeric(4,1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "materials" ADD "volume" numeric(4,1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ammunition" ADD "volume" numeric(4,1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessories" ADD "volume" numeric(4,1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accessories" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "ammunition" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "materials" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "consumables" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "utilities" DROP COLUMN "volume"`);
  }
}
