import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipmentTagsTable1784305720000 implements MigrationInterface {
  name = 'CreateEquipmentTagsTable1784305720000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "equipment_tags" ("equipment_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_equipment_tags" PRIMARY KEY ("equipment_id", "tag_id"))`,
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" DROP CONSTRAINT "FK_equipment_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment_tags" DROP CONSTRAINT "FK_equipment_tags_equipment_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_equipment_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_equipment_tags_equipment_id"`,
    );
    await queryRunner.query(`DROP TABLE "equipment_tags"`);
  }
}
