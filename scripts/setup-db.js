// Database setup script
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create activities table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating activities table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }
    
    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
      CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
      CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name);
    `;
    
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });
    
    if (indexError) {
      console.error('Error creating indexes:', indexError);
      return;
    }
    
    // Create updated_at trigger
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
      CREATE TRIGGER update_activities_updated_at
        BEFORE UPDATE ON activities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    console.log('Creating trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: createTriggerSQL
    });
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return;
    }
    
    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const { data, error } = await supabase
      .from('activities')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database setup...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.log('Please check your database configuration and try again.');
    return;
  }
  
  // Setup database
  await setupDatabase();
  
  console.log('🎉 Database setup process completed!');
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { setupDatabase, testConnection };
