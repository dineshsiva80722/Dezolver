// import { DataSource } from 'typeorm';
// import * as dotenv from 'dotenv';
// import path from 'path';

// dotenv.config();

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '5432'),
//   username: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'postgres',
//   database: process.env.DB_NAME || 'techfolks',
//   synchronize: false,
//   logging: process.env.NODE_ENV === 'development',
//   entities: [path.join(__dirname, '../models/*.entity{.ts,.js}')],
//   migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
//   subscribers: []
// });

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the correct env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env' 
  : '.env.development';

dotenv.config({ path: envFile });

// Parse DATABASE_URL if it exists, otherwise use individual vars
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl) {
    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
    };
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'techfolks',
  };
};

const dbConfig = getDatabaseConfig();

console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  username: dbConfig.username,
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../models/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  subscribers: [],
});