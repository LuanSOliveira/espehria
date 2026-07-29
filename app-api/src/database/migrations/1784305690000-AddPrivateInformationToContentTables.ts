import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrivateInformationToContentTables1784305690000 implements MigrationInterface {
  name = 'AddPrivateInformationToContentTables1784305690000';

  private readonly tables = [
    'creatures',
    'divinities',
    'locations',
    'races',
    'characters',
    'organizations',
    'families',
    'eras',
    'events',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "private_information" text`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "private_information"`,
      );
    }
  }
}
