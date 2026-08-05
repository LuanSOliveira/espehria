import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProficienciesTable1784306350000 implements MigrationInterface {
  name = 'CreateProficienciesTable1784306350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "proficiencies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "sort_order" integer NOT NULL, "property_id" uuid NOT NULL, "gradation_id" uuid NOT NULL, "owner_talent_id" uuid, "owner_training_id" uuid, "owner_characteristic_id" uuid, "owner_biography_id" uuid, "owner_race_id" uuid, CONSTRAINT "CK_proficiencies_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1), CONSTRAINT "PK_proficiencies_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_proficiencies_unique_owner_property" ON "proficiencies" ("owner_talent_id", "owner_training_id", "owner_characteristic_id", "owner_biography_id", "owner_race_id", "property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proficiencies_owner_talent" ON "proficiencies" ("owner_talent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proficiencies_owner_training" ON "proficiencies" ("owner_training_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proficiencies_owner_characteristic" ON "proficiencies" ("owner_characteristic_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proficiencies_owner_biography" ON "proficiencies" ("owner_biography_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_proficiencies_owner_race" ON "proficiencies" ("owner_race_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_property_id" FOREIGN KEY ("property_id") REFERENCES "proficiency_properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_gradation_id" FOREIGN KEY ("gradation_id") REFERENCES "proficiency_gradations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_owner_talent_id" FOREIGN KEY ("owner_talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_owner_training_id" FOREIGN KEY ("owner_training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_owner_characteristic_id" FOREIGN KEY ("owner_characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_owner_biography_id" FOREIGN KEY ("owner_biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" ADD CONSTRAINT "FK_proficiencies_owner_race_id" FOREIGN KEY ("owner_race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_owner_race_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_owner_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_owner_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_owner_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_owner_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_gradation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proficiencies" DROP CONSTRAINT "FK_proficiencies_property_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_owner_race"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_owner_biography"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_owner_characteristic"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_owner_training"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_owner_talent"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiencies_unique_owner_property"`,
    );
    await queryRunner.query(`DROP TABLE "proficiencies"`);
  }
}
