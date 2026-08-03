import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaceOwnerToImprovementFlaws1784306260000 implements MigrationInterface {
  name = 'AddRaceOwnerToImprovementFlaws1784306260000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD COLUMN "owner_race_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_race_id" FOREIGN KEY ("owner_race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaws_owner_race" ON "improvement_flaws" ("owner_race_id", "category")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "CK_improvement_flaws_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "owner_biography_id", "owner_race_id", "type_id", "property_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "owner_biography_id", "type_id", "property_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "CK_improvement_flaws_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_owner_race"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_owner_race_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP COLUMN "owner_race_id"`,
    );
  }
}
