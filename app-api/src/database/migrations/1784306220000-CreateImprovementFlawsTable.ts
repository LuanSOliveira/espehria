import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImprovementFlawsTable1784306220000
  implements MigrationInterface
{
  name = 'CreateImprovementFlawsTable1784306220000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."improvement_flaws_category_enum" AS ENUM('improvement', 'flaw')`,
    );
    await queryRunner.query(
      `CREATE TABLE "improvement_flaws" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "category" "public"."improvement_flaws_category_enum" NOT NULL, "value" integer NOT NULL, "sort_order" integer NOT NULL, "type_id" uuid NOT NULL, "property_id" uuid NOT NULL, "owner_talent_id" uuid, "owner_training_id" uuid, "owner_characteristic_id" uuid, CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id) = 1), CONSTRAINT "PK_improvement_flaws_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "type_id", "property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaws_owner_talent" ON "improvement_flaws" ("owner_talent_id", "category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaws_owner_training" ON "improvement_flaws" ("owner_training_id", "category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaws_owner_characteristic" ON "improvement_flaws" ("owner_characteristic_id", "category")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_type_id" FOREIGN KEY ("type_id") REFERENCES "improvement_flaw_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_property_id" FOREIGN KEY ("property_id") REFERENCES "improvement_flaw_properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_talent_id" FOREIGN KEY ("owner_talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_training_id" FOREIGN KEY ("owner_training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_characteristic_id" FOREIGN KEY ("owner_characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_owner_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_owner_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_owner_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_property_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_owner_characteristic"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_owner_training"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_owner_talent"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`,
    );
    await queryRunner.query(`DROP TABLE "improvement_flaws"`);
    await queryRunner.query(
      `DROP TYPE "public"."improvement_flaws_category_enum"`,
    );
  }
}
