import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAmmunitionTable1784305770000
  implements MigrationInterface
{
  name = 'CreateAmmunitionTable1784305770000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ammunition" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" character varying, "private_information" text, CONSTRAINT "PK_ammunition_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ammunition_name" ON "ammunition" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ammunition_name"`);
    await queryRunner.query(`DROP TABLE "ammunition"`);
  }
}
