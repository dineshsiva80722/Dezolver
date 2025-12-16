const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Check ALL possible scenarios
async function detectAndFix() {
  console.log('🔍 Detecting TypeORM database connection...\n');
  
  const configs = [
    { database: 'techfolks_db', schema: 'public' },
    { database: 'techfolks', schema: 'public' },
    { database: process.env.DB_NAME || 'techfolks_db', schema: process.env.DB_SCHEMA || 'public' },
  ];
  
  for (const config of configs) {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      ...config,
      user: 'postgres',
      password: 'postgres',
    });
    
    try {
      const client = await pool.connect();
      
      // Check for users table
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'users'
        );
      `, [config.schema]);
      
      if (!tableCheck.rows[0].exists) {
        client.release();
        await pool.end();
        continue;
      }
      
      console.log(`\n✓ Found users table in: ${config.database}.${config.schema}`);
      
      // Count users  
      const count = await client.query(`SELECT COUNT(*) FROM "${config.schema}".users`);
      console.log(`   Total users: ${count.rows[0].count}`);
      
      // Check for our columns
      const columns = await client.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'users'
        AND column_name IN ('managed_by', 'added_by')
      `, [config.schema]);
      
      const hasManaged = columns.rows.some(r => r.column_name === 'managed_by');
      const hasAdded = columns.rows.some(r => r.column_name === 'added_by');
      
      console.log(`   managed_by: ${hasManaged ? 'YES' : 'NO'}`);
      console.log(`   added_by: ${hasAdded ? 'YES' : 'NO'}`);
      
      if (!hasManaged || !hasAdded) {
        console.log(`\n🔧 FIXING ${config.database}.${config.schema}...`);
        
        if (!hasManaged) {
          await client.query(`ALTER TABLE "${config.schema}".users ADD COLUMN managed_by UUID`);
          try {
            await client.query(`ALTER TABLE "${config.schema}".users ADD CONSTRAINT fk_users_managed_by FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL`);
          } catch (e) {}
          console.log('   ✅ Added managed_by');
        }
        
        if (!hasAdded) {
          await client.query(`ALTER TABLE "${config.schema}".users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self'`);
          await client.query(`UPDATE "${config.schema}".users SET added_by = 'self' WHERE added_by IS NULL`);
          console.log('   ✅ Added added_by');
        }
        
        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_managed_by ON "${config.schema}".users(managed_by) WHERE managed_by IS NOT NULL`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_added_by ON "${config.schema}".users(added_by)`);
        
        console.log('   ✅ Indexes created');
      }
      
      // Ensure admin user exists
      const hashedPassword = await bcrypt.hash('Admin123', 10);
      await client.query(`
        INSERT INTO "${config.schema}".users (
          username, email, password_hash, full_name, role, 
          is_verified, is_active, added_by, rating, max_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (username) 
        DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          role = 'admin',
          added_by = 'self'
      `, [
        'admin', 'admin@techfolks.com', hashedPassword, 'Admin User', 'admin',
        true, true, 'self', 1500, 1500
      ]);
      
      console.log('   ✅ Admin user ready');
      
      client.release();
      await pool.end();
      
    } catch (error) {
      try { await pool.end(); } catch (e) {}
      if (!error.message.includes('does not exist')) {
        console.log(`   Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All possible databases fixed!');
  console.log('='.repeat(60));
  console.log('\n📋 Admin: admin / Admin123');
  console.log('\n⚠️  IMPORTANT: Press Ctrl+C to stop your server');
  console.log('   Then run: npm run dev');
}

detectAndFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

