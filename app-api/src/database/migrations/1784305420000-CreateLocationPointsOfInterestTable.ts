import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationPointsOfInterestTable1784305420000 implements MigrationInterface {
  name = 'CreateLocationPointsOfInterestTable1784305420000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_points_of_interest" ("location_id" uuid NOT NULL, "point_of_interest_id" uuid NOT NULL, CONSTRAINT "PK_location_points_of_interest" PRIMARY KEY ("location_id", "point_of_interest_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_points_of_interest_location_id" ON "location_points_of_interest" ("location_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_points_of_interest_point_of_interest_id" ON "location_points_of_interest" ("point_of_interest_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_points_of_interest" ADD CONSTRAINT "FK_location_points_of_interest_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_points_of_interest" ADD CONSTRAINT "FK_location_points_of_interest_point_of_interest_id" FOREIGN KEY ("point_of_interest_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_points_of_interest" DROP CONSTRAINT "FK_location_points_of_interest_point_of_interest_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_points_of_interest" DROP CONSTRAINT "FK_location_points_of_interest_location_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_location_points_of_interest_point_of_interest_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_location_points_of_interest_location_id"`,
    );
    await queryRunner.query(`DROP TABLE "location_points_of_interest"`);
  }
}
