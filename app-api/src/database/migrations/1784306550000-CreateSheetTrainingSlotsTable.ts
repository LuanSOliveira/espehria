import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSheetTrainingSlotsTable1784306550000
  implements MigrationInterface
{
  name = 'CreateSheetTrainingSlotsTable1784306550000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sheet_training_slots" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "slot_index" integer NOT NULL, "sheet_id" uuid NOT NULL, "training_id" uuid, CONSTRAINT "UQ_sheet_training_slots_sheet_slot_index" UNIQUE ("sheet_id", "slot_index"), CONSTRAINT "PK_sheet_training_slots_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_sheet_training_slots_sheet_training_unique" ON "sheet_training_slots" ("sheet_id", "training_id") WHERE "training_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_training_slots" ADD CONSTRAINT "FK_sheet_training_slots_sheet_id" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_training_slots" ADD CONSTRAINT "FK_sheet_training_slots_training_id" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Backfill: fichas já existentes precisam nascer com `3 + (level - 1)`
    // linhas de slot (vazias) — sem isso, ficariam sem slots na aba
    // Treinamentos após este deploy.
    await queryRunner.query(
      `INSERT INTO "sheet_training_slots" ("id", "sheet_id", "slot_index", "training_id")
       SELECT gen_random_uuid(), s."id", gs.slot_index, NULL
       FROM "sheets" s
       CROSS JOIN LATERAL generate_series(1, 3 + (s."level" - 1)) AS gs(slot_index)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheet_training_slots" DROP CONSTRAINT "FK_sheet_training_slots_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_training_slots" DROP CONSTRAINT "FK_sheet_training_slots_sheet_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_sheet_training_slots_sheet_training_unique"`,
    );
    await queryRunner.query(`DROP TABLE "sheet_training_slots"`);
  }
}
