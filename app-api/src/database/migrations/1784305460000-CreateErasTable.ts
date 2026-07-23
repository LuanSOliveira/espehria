import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateErasTable1784305460000 implements MigrationInterface {
  name = 'CreateErasTable1784305460000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "eras" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image_url" character varying, "description" text, "ordering" integer NOT NULL, CONSTRAINT "PK_eras_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_eras_name" ON "eras" ("name")`,
    );
    // Constraint DEFERRABLE INITIALLY DEFERRED (não um CREATE UNIQUE INDEX comum):
    // necessária para permitir que a reordenação em cascata do ErasService
    // (múltiplos UPDATEs que passam por estados intermediários com valores de
    // "ordering" colidentes) seja validada apenas no COMMIT da transação.
    await queryRunner.query(
      `ALTER TABLE "eras" ADD CONSTRAINT "UQ_eras_ordering" UNIQUE ("ordering") DEFERRABLE INITIALLY DEFERRED`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "eras" DROP CONSTRAINT "UQ_eras_ordering"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_eras_name"`);
    await queryRunner.query(`DROP TABLE "eras"`);
  }
}
