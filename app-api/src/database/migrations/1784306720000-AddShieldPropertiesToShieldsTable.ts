import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShieldPropertiesToShieldsTable1784306720000
  implements MigrationInterface
{
  name = 'AddShieldPropertiesToShieldsTable1784306720000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "nickname" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "shields" ADD "volume" numeric(4,1)`);
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "armor_class_bonus" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "speed_penalty_meters" numeric(4,1)`,
    );
    await queryRunner.query(`ALTER TABLE "shields" ADD "hardness" integer`);
    await queryRunner.query(`ALTER TABLE "shields" ADD "hit_points" integer`);
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "break_threshold" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shields" DROP COLUMN "break_threshold"`,
    );
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "hit_points"`);
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "hardness"`);
    await queryRunner.query(
      `ALTER TABLE "shields" DROP COLUMN "speed_penalty_meters"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shields" DROP COLUMN "armor_class_bonus"`,
    );
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "nickname"`);
  }
}
