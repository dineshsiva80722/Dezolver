const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating admin user...\n');
    
    const username = 'admin';
    const password = 'Admin123';
    const email = 'admin@techfolks.com';
    const fullName = 'Admin User';
    
    // Check if admin already exists
    const existing = await client.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists. Updating password...\n');
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password = $1, role = $2, added_by = $3 WHERE username = $4',
        [hashedPassword, 'admin', 'self', username]
      );
      
      console.log('✅ Admin password updated successfully!\n');
    } else {
      console.log('📝 Creating new admin user...\n');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create admin user
      await client.query(`
        INSERT INTO users (
          username, email, password, full_name, role, 
          is_verified, is_active, added_by, rating, max_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        username, email, hashedPassword, fullName, 'admin',
        true, true, 'self', 1500, 1500
      ]);
      
      console.log('✅ Admin user created successfully!\n');
    }
    
    console.log('Admin Credentials:');
    console.log('==================');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('==================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin()
  .then(() => {
    console.log('🎉 Done! You can now login as admin.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

