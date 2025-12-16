import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { logger } from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

async function addReverseIntegerTestCases() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection initialized');
    }

    // Read and execute the SQL script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'add-reverse-integer-testcases.sql'),
      'utf8'
    );

    await AppDataSource.query(sqlScript);
    logger.info('✅ Test cases for reverse-integer problem added successfully');

    // Verify test cases were added
    const testCaseCount = await AppDataSource.query(`
      SELECT COUNT(*) as count 
      FROM test_cases tc 
      JOIN problems p ON tc.problem_id = p.id 
      WHERE p.slug = 'reverse-integer'
    `);

    logger.info(`📊 Total test cases for reverse-integer: ${testCaseCount[0].count}`);

  } catch (error) {
    logger.error('❌ Error adding test cases:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  addReverseIntegerTestCases()
    .then(() => {
      logger.info('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { addReverseIntegerTestCases };