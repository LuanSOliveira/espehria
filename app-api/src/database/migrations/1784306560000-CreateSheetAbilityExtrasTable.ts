import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSheetAbilityExtrasTable1784306560000 implements MigrationInterface {
  name = 'CreateSheetAbilityExtrasTable1784306560000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sheet_ability_extras_entity_type_enum" AS ENUM('training', 'talent', 'characteristic')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sheet_ability_extras" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "entity_type" "public"."sheet_ability_extras_entity_type_enum" NOT NULL, "sheet_id" uuid NOT NULL, "training_id" uuid, "talent_id" uuid, "characteristic_id" uuid, CONSTRAINT "CK_sheet_ability_extras_target_exclusive" CHECK (num_nonnulls(training_id, talent_id, characteristic_id) = 1), CONSTRAINT "PK_sheet_ability_extras_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_sheet_ability_extras_sheet_training_unique" ON "sheet_ability_extras" ("sheet_id", "training_id") WHERE "training_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_sheet_ability_extras_sheet_talent_unique" ON "sheet_ability_extras" ("sheet_id", "talent_id") WHERE "talent_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_sheet_ability_extras_sheet_characteristic_unique" ON "sheet_ability_extras" ("sheet_id", "characteristic_id") WHERE "characteristic_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" ADD CONSTRAINT "FK_sheet_ability_extras_sheet_id" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" ADD CONSTRAINT "FK_sheet_ability_extras_training_id" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" ADD CONSTRAINT "FK_sheet_ability_extras_talent_id" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" ADD CONSTRAINT "FK_sheet_ability_extras_characteristic_id" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" DROP CONSTRAINT "FK_sheet_ability_extras_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" DROP CONSTRAINT "FK_sheet_ability_extras_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" DROP CONSTRAINT "FK_sheet_ability_extras_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_ability_extras" DROP CONSTRAINT "FK_sheet_ability_extras_sheet_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sheet_ability_extras_sheet_characteristic_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sheet_ability_extras_sheet_talent_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sheet_ability_extras_sheet_training_unique"`,
    );
    await queryRunner.query(`DROP TABLE "sheet_ability_extras"`);
    await queryRunner.query(
      `DROP TYPE "public"."sheet_ability_extras_entity_type_enum"`,
    );
  }
}
