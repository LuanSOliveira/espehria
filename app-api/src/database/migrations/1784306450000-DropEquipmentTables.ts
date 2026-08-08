import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropEquipmentTables1784306450000 implements MigrationInterface {
  name = 'DropEquipmentTables1784306450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" DROP CONSTRAINT "FK_equipment_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" DROP CONSTRAINT "FK_equipment_tags_equipment_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_equipment_tags_equipment_id_tag_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_equipment_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_equipment_tags_equipment_id"`,
    );
    await queryRunner.query(`DROP TABLE "equipment_tags"`);

    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_equipment_currency_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_equipment_name"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" integer, "currency_id" uuid, "private_information" text, CONSTRAINT "PK_equipment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_equipment_name" ON "equipment" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_equipment_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "equipment_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "equipment_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_equipment_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_equipment_tags_equipment_id_tag_id" ON "equipment_tags" ("equipment_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_tags_equipment_id" ON "equipment_tags" ("equipment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_equipment_tags_tag_id" ON "equipment_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" ADD CONSTRAINT "FK_equipment_tags_equipment_id" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" ADD CONSTRAINT "FK_equipment_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
