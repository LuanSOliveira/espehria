import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArmorPropertiesToArmorsTable1784306700000 implements MigrationInterface {
  name = 'AddArmorPropertiesToArmorsTable1784306700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "nickname" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "armors" ADD "volume" numeric(4,1)`);
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "armor_category_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "armor_class_bonus" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "dexterity_modifier_limit" integer`,
    );
    await queryRunner.query(`ALTER TABLE "armors" ADD "strength" integer`);
    await queryRunner.query(`ALTER TABLE "armors" ADD "check_penalty" integer`);
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "speed_penalty_meters" numeric(4,1)`,
    );

    await queryRunner.query(
      `ALTER TABLE "armors" ADD CONSTRAINT "FK_armors_armor_category_id" FOREIGN KEY ("armor_category_id") REFERENCES "armor_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armors" DROP CONSTRAINT "FK_armors_armor_category_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "armors" DROP COLUMN "speed_penalty_meters"`,
    );
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "check_penalty"`);
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "strength"`);
    await queryRunner.query(
      `ALTER TABLE "armors" DROP COLUMN "dexterity_modifier_limit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" DROP COLUMN "armor_class_bonus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" DROP COLUMN "armor_category_id"`,
    );
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "volume"`);
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "nickname"`);
  }
}
