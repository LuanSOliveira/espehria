import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacteristicTagsTable1784306080000 implements MigrationInterface {
  name = 'CreateCharacteristicTagsTable1784306080000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "characteristic_tags" ("characteristic_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_characteristic_tags" PRIMARY KEY ("characteristic_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_characteristic_tags_characteristic_id" ON "characteristic_tags" ("characteristic_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_characteristic_tags_tag_id" ON "characteristic_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristic_tags" ADD CONSTRAINT "FK_characteristic_tags_characteristic_id" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristic_tags" ADD CONSTRAINT "FK_characteristic_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "characteristic_tags" DROP CONSTRAINT "FK_characteristic_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristic_tags" DROP CONSTRAINT "FK_characteristic_tags_characteristic_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_characteristic_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_characteristic_tags_characteristic_id"`,
    );
    await queryRunner.query(`DROP TABLE "characteristic_tags"`);
  }
}
