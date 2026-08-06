import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgesTable1784306370000 implements MigrationInterface {
  name = 'CreateKnowledgesTable1784306370000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "knowledges" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "sort_order" integer NOT NULL, "title" character varying NOT NULL, "gradation_id" uuid NOT NULL, "owner_talent_id" uuid, "owner_training_id" uuid, "owner_characteristic_id" uuid, "owner_biography_id" uuid, "owner_race_id" uuid, CONSTRAINT "CK_knowledges_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1), CONSTRAINT "PK_knowledges_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_talent_title" ON "knowledges" ("owner_talent_id", (lower(btrim("title")))) WHERE "owner_talent_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_training_title" ON "knowledges" ("owner_training_id", (lower(btrim("title")))) WHERE "owner_training_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_characteristic_title" ON "knowledges" ("owner_characteristic_id", (lower(btrim("title")))) WHERE "owner_characteristic_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_biography_title" ON "knowledges" ("owner_biography_id", (lower(btrim("title")))) WHERE "owner_biography_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_race_title" ON "knowledges" ("owner_race_id", (lower(btrim("title")))) WHERE "owner_race_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_gradation_id" FOREIGN KEY ("gradation_id") REFERENCES "proficiency_gradations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_owner_talent_id" FOREIGN KEY ("owner_talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_owner_training_id" FOREIGN KEY ("owner_training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_owner_characteristic_id" FOREIGN KEY ("owner_characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_owner_biography_id" FOREIGN KEY ("owner_biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD CONSTRAINT "FK_knowledges_owner_race_id" FOREIGN KEY ("owner_race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_owner_race_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_owner_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_owner_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_owner_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_owner_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledges" DROP CONSTRAINT "FK_knowledges_gradation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_knowledges_unique_owner_race_title"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_knowledges_unique_owner_biography_title"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_knowledges_unique_owner_characteristic_title"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_knowledges_unique_owner_training_title"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_knowledges_unique_owner_talent_title"`,
    );
    await queryRunner.query(`DROP TABLE "knowledges"`);
  }
}
