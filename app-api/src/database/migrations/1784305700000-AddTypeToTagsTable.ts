import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToTagsTable1784305700000 implements MigrationInterface {
  name = 'AddTypeToTagsTable1784305700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tags" ADD "type" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "type"`);
  }
}
