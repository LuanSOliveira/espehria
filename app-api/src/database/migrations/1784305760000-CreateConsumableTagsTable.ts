import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsumableTagsTable1784305760000
  implements MigrationInterface
{
  name = 'CreateConsumableTagsTable1784305760000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consumable_tags" ("consumable_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_consumable_tags" PRIMARY KEY ("consumable_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_consumable_tags_consumable_id" ON "consumable_tags" ("consumable_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_consumable_tags_tag_id" ON "consumable_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_tags" ADD CONSTRAINT "FK_consumable_tags_consumable_id" FOREIGN KEY ("consumable_id") REFERENCES "consumables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_tags" ADD CONSTRAINT "FK_consumable_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consumable_tags" DROP CONSTRAINT "FK_consumable_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_tags" DROP CONSTRAINT "FK_consumable_tags_consumable_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_consumable_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_consumable_tags_consumable_id"`,
    );
    await queryRunner.query(`DROP TABLE "consumable_tags"`);
  }
}
