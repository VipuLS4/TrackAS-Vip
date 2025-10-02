import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Get already executed migrations
    const executedMigrations = await query('SELECT filename FROM migrations');
    const executedFilenames = executedMigrations.rows.map(row => row.filename);
    
    // Execute pending migrations
    for (const file of files) {
      if (executedFilenames.includes(file)) {
        console.log(`✓ ${file} already executed`);
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration
      await query(migrationSQL);
      
      // Record migration as executed
      await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      
      console.log(`✓ ${file} completed`);
    }
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();