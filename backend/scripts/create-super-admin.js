const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function createSuperAdmin() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Super Admin user...\n');

    const username = 'superadmin';
    const password = 'SuperAdmin123!';
    const email = 'superadmin@techfolks.com';
    const fullName = 'Super Admin';

    // Check if super admin already exists
    const existing = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists. Updating to SUPER_ADMIN role...\n');

      // Update password and role to super_admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE username = $3',
        [hashedPassword, 'super_admin', username]
      );

      console.log('✅ User updated to Super Admin successfully!\n');
    } else {
      console.log('📝 Creating new Super Admin user...\n');

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create super admin user
      await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, role,
          is_verified, is_active, rating, max_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        username, email, hashedPassword, fullName, 'super_admin',
        true, true, 1500, 1500
      ]);

      console.log('✅ Super Admin user created successfully!\n');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║      Super Admin Credentials          ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Username: ${username.padEnd(27)}║`);
    console.log(`║ Email:    ${email.padEnd(27)}║`);
    console.log(`║ Password: ${password.padEnd(27)}║`);
    console.log(`║ Role:     super_admin                  ║`);
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('🎉 Done! You can now login as Super Admin.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
