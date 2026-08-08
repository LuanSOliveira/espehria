import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShieldsTable1784306520000 implements MigrationInterface {
  name = 'CreateShieldsTable1784306520000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "shields" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" integer, "currency_id" uuid, "private_information" text, CONSTRAINT "PK_shields_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_shields_name" ON "shields" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "shields" ADD CONSTRAINT "FK_shields_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shields" DROP CONSTRAINT "FK_shields_currency_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_shields_name"`);
    await queryRunner.query(`DROP TABLE "shields"`);
  }
}
