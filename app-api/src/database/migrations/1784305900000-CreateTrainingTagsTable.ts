import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingTagsTable1784305900000 implements MigrationInterface {
  name = 'CreateTrainingTagsTable1784305900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "training_tags" ("training_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_training_tags" PRIMARY KEY ("training_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_training_tags_training_id" ON "training_tags" ("training_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_training_tags_tag_id" ON "training_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_tags" ADD CONSTRAINT "FK_training_tags_training_id" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_tags" ADD CONSTRAINT "FK_training_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_tags" DROP CONSTRAINT "FK_training_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_tags" DROP CONSTRAINT "FK_training_tags_training_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_training_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_training_tags_training_id"`,
    );
    await queryRunner.query(`DROP TABLE "training_tags"`);
  }
}
