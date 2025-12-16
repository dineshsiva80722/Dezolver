const { Pool } = require('pg');

async function findUsersDatabase() {
  // List of common database names to check
  const databases = ['techfolks_db', 'postgres', 'techfolks', 'tf'];
  
  for (const dbName of databases) {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: dbName,
      user: 'postgres',
      password: 'postgres',
    });
    
    try {
      const client = await pool.connect();
      
      // Check if users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      if (tableCheck.rows[0].exists) {
        const count = await client.query('SELECT COUNT(*) FROM users');
        const userCount = count.rows[0].count;
        
        console.log(`\n✓ Database: ${dbName}`);
        console.log(`  Users: ${userCount}`);
        
        if (parseInt(userCount) > 0) {
          // Check for our columns
          const columns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('managed_by', 'added_by')
          `);
          
          console.log(`  managed_by column: ${columns.rows.some(r => r.column_name === 'managed_by') ? 'YES' : 'NO'}`);
          console.log(`  added_by column: ${columns.rows.some(r => r.column_name === 'added_by') ? 'YES' : 'NO'}`);
          
          // Sample some users
          const users = await client.query('SELECT id, username, role FROM users LIMIT 3');
          console.log(`  Sample users:`);
          users.rows.forEach(u => {
            console.log(`    - ${u.username} (${u.role || 'no role'})`);
          });
        }
      }
      
      client.release();
      await pool.end();
      
    } catch (error) {
      // Database doesn't exist or can't connect
      if (!error.message.includes('does not exist')) {
        console.log(`\n✗ Database: ${dbName} - Error: ${error.message}`);
      }
    }
  }
}

findUsersDatabase()
  .then(() => {
    console.log('\n✅ Scan complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

