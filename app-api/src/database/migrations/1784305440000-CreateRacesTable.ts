import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRacesTable1784305440000 implements MigrationInterface {
  name = 'CreateRacesTable1784305440000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "races" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "category_id" uuid NOT NULL, "reference_image_url" character varying, "physical_characteristics" text, "description" text, CONSTRAINT "PK_races_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_races_name" ON "races" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" ADD CONSTRAINT "FK_races_category_id" FOREIGN KEY ("category_id") REFERENCES "race_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "races" DROP CONSTRAINT "FK_races_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_races_name"`);
    await queryRunner.query(`DROP TABLE "races"`);
  }
}
