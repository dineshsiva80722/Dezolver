import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/database';

const migrationDataSource = new DataSource({
  ...AppDataSource.options,
  migrations: ['dist/database/migrations/*.js', 'src/database/migrations/*.ts'],
});

migrationDataSource
  .initialize()
  .then(async () => {
    console.log('Data Source initialized');
    await migrationDataSource.runMigrations();
    console.log('Migrations ran successfully');
    await migrationDataSource.destroy();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
  });

