const bcrypt = require('bcrypt');

async function testHash() {
  // Test admin password
  const adminHash = '$2b$10$XtVhkCz7Rav/GL7Kx2.mDuJn1qnJSJ3kQwYE.nKzO8sYXKAGKJzLa';
  const adminPassword = 'admin123';
  
  console.log('Testing admin password...');
  const adminMatch = await bcrypt.compare(adminPassword, adminHash);
  console.log('Admin password matches:', adminMatch);
  
  // Test testuser password  
  const testHash = '$2b$10$K7p1qR5nZ8M3wY6vE2hHLe7CsF4mP9oA1tQ8xN6wB4kL2jR5dS8gH';
  const testPassword = 'testuser123';
  
  console.log('Testing testuser password...');
  const testMatch = await bcrypt.compare(testPassword, testHash);
  console.log('Testuser password matches:', testMatch);
  
  // Generate correct hashes
  console.log('\nGenerating correct hashes...');
  const correctAdminHash = await bcrypt.hash(adminPassword, 10);
  const correctTestHash = await bcrypt.hash(testPassword, 10);
  
  console.log('Correct admin hash:', correctAdminHash);
  console.log('Correct test hash:', correctTestHash);
}

testHash().catch(console.error);