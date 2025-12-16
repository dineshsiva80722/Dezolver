const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Diagnostic Check\n');
    
    // Which database are we connected to?
    const db = await client.query('SELECT current_database()');
    console.log(`Database: ${db.rows[0].current_database}\n`);
    
    // List ALL columns in users table
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('ALL columns in users table:');
    console.log('=====================================');
    columns.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n=====================================');
    
    // Check specifically for our columns
    const hasManaged = columns.rows.find(r => r.column_name === 'managed_by');
    const hasAdded = columns.rows.find(r => r.column_name === 'added_by');
    
    console.log(`\n✓ managed_by exists: ${hasManaged ? 'YES' : 'NO'}`);
    console.log(`✓ added_by exists: ${hasAdded ? 'YES' : 'NO'}`);
    
    // Count users
    const count = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\nTotal users in database: ${count.rows[0].count}`);
    
    // Sample query that TypeORM would do
    try {
      const sample = await client.query('SELECT id, username, role, managed_by, added_by FROM users LIMIT 1');
      console.log('\n✅ Sample query successful!');
      if (sample.rows.length > 0) {
        console.log('Sample user:', sample.rows[0]);
      }
    } catch (err) {
      console.log('\n❌ Sample query failed:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns();

