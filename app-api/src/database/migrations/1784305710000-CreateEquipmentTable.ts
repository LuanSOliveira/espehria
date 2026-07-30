import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipmentTable1784305710000 implements MigrationInterface {
  name = 'CreateEquipmentTable1784305710000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" character varying, "private_information" text, CONSTRAINT "PK_equipment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_equipment_name" ON "equipment" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_equipment_name"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
  }
}
