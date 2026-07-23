import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeEventYearColumnsToInteger1784305500000 implements MigrationInterface {
  name = 'ChangeEventYearColumnsToInteger1784305500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "start_year" TYPE integer USING "start_year"::integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "end_year" TYPE integer USING "end_year"::integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "end_year" TYPE character varying USING "end_year"::character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "start_year" TYPE character varying USING "start_year"::character varying`,
    );
  }
}
