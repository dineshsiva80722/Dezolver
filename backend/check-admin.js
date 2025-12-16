require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'techfolks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkAndCreateAdmin() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking for admin users...\n');

    // Check for existing admin users
    const result = await client.query(`
      SELECT id, username, email, phone_number, role, is_verified, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (result.rows.length > 0) {
      console.log('✅ Found admin users:');
      result.rows.forEach((admin, index) => {
        console.log(`\n${index + 1}. Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Phone: ${admin.phone_number || 'Not set'}`);
        console.log(`   Verified: ${admin.is_verified}`);
        console.log(`   Created: ${admin.created_at}`);
      });

      console.log('\n📝 To login, use:');
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Password: Check your records or reset below`);
    } else {
      console.log('❌ No admin users found. Creating default admin...');

      // Create default admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, phone_number,
          role, is_verified, is_active, rating, max_rating,
          problems_solved, contests_participated, contribution_points
        ) VALUES (
          'admin', 'admin@techfolks.com', $1, 'System Administrator', NULL,
          'admin', true, true, 1200, 1200, 0, 0, 0
        )
      `, [hashedPassword]);

      console.log('✅ Admin user created!');
      console.log('\n📝 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: Admin@123');
    }

    console.log('\n💡 To reset admin password, run:');
    console.log('   node reset-admin-password.js <username> <new-password>');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateAdmin();
