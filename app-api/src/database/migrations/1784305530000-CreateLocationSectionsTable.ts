import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationSectionsTable1784305530000 implements MigrationInterface {
  name = 'CreateLocationSectionsTable1784305530000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "location_id" uuid NOT NULL, CONSTRAINT "PK_location_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_sections_location_id" ON "location_sections" ("location_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_sections" ADD CONSTRAINT "FK_location_sections_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_sections" DROP CONSTRAINT "FK_location_sections_location_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_location_sections_location_id"`,
    );
    await queryRunner.query(`DROP TABLE "location_sections"`);
  }
}
