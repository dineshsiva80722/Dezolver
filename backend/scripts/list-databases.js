const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default database to list all
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function listDatabases() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `);
    
    console.log('Available databases:');
    console.log('===================');
    result.rows.forEach(row => {
      console.log(`${row.datname} (${row.size})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listDatabases();

