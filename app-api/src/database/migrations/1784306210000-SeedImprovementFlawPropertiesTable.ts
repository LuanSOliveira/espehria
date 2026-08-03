import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedImprovementFlawPropertiesTable1784306210000
  implements MigrationInterface
{
  name = 'SeedImprovementFlawPropertiesTable1784306210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "improvement_flaw_properties" ("name", "type_id")
       SELECT v.name, t.id
       FROM (VALUES
         ('Ataque Corpo-a-Corpo', 'Ataque'),
         ('Ataque a Distância', 'Ataque'),
         ('Força', 'Teste de Resistência'),
         ('Destreza', 'Teste de Resistência'),
         ('Constituição', 'Teste de Resistência'),
         ('Inteligência', 'Teste de Resistência'),
         ('Sabedoria', 'Teste de Resistência'),
         ('Carisma', 'Teste de Resistência')
       ) AS v(name, type_name)
       JOIN "improvement_flaw_types" t ON t.name = v.type_name`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "improvement_flaw_properties" WHERE "name" IN ('Ataque Corpo-a-Corpo', 'Ataque a Distância', 'Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma')`,
    );
  }
}
