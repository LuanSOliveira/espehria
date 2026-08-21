import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLoadedVolumeToNumericAndAddItemsVolumeToSheets1784306810000 implements MigrationInterface {
  name = 'ChangeLoadedVolumeToNumericAndAddItemsVolumeToSheets1784306810000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ALTER COLUMN "loaded_volume" TYPE numeric(6,1) USING "loaded_volume"::numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ALTER COLUMN "loaded_volume" SET DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "items_volume" numeric(6,1) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "items_volume"`);
    await queryRunner.query(
      `ALTER TABLE "sheets" ALTER COLUMN "loaded_volume" TYPE integer USING round("loaded_volume")::integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ALTER COLUMN "loaded_volume" SET DEFAULT 0`,
    );
  }
}
