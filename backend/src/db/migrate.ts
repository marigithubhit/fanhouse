import fs from 'fs';
import path from 'path';
import pool from './index';

async function runMigration() {
  try {
    console.log('Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('Migration completed successfully!');

    // Create a default admin user
    const adminEmail = 'admin@fanhouse.com';
    const adminPassword = '$2a$10$rQ5YZ5Y5Y5Y5Y5Y5Y5Y5Y.YOY5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5'; // bcrypt hash of 'admin123'

    await pool.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, 'admin', adminPassword, 'admin']);

    console.log('Default admin user created (email: admin@fanhouse.com, password: admin123)');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
