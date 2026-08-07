import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTagsUniqueIndexToNameAndType1784306410000 implements MigrationInterface {
  name = 'ChangeTagsUniqueIndexToNameAndType1784306410000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_name"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tags_name_type" ON "tags" ("name", COALESCE("type", ''))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_name_type"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tags_name" ON "tags" ("name")`,
    );
  }
}
