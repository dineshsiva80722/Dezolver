#!/usr/bin/env node
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/database';

export async function runMigrations(): Promise<void> {
  const migrationDataSource = new DataSource({
    ...AppDataSource.options,
    migrations: ['dist/database/migrations/*.js', 'src/database/migrations/*.ts'],
  });
  try {
    await migrationDataSource.initialize();
    console.log('Data Source initialized');
    await migrationDataSource.runMigrations();
    console.log('Migrations ran successfully');
  } finally {
    try {
      await migrationDataSource.destroy();
    } catch {}
  }
}

const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMainModule) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed', err);
      process.exit(1);
    });
}
