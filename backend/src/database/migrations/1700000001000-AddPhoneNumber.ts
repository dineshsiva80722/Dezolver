import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneNumber1700000001000 implements MigrationInterface {
  name = 'AddPhoneNumber1700000001000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('users', 'phone_number');
    if (exists) return;
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('users', 'phone_number');
    if (!exists) return;
    await queryRunner.dropColumn('users', 'phone_number');
  }
}
