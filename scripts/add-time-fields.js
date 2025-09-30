// Add startTime and endTime fields to activities table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function addTimeFields() {
  try {
    console.log('Adding startTime and endTime fields to activities table...');
    
    // Add startTime and endTime columns
    const addColumnsSQL = `
      ALTER TABLE activities 
      ADD COLUMN IF NOT EXISTS start_time TIME,
      ADD COLUMN IF NOT EXISTS end_time TIME;
    `;
    
    console.log('Adding time columns...');
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: addColumnsSQL
    });
    
    if (columnError) {
      console.error('Error adding time columns:', columnError);
      return;
    }
    
    console.log('✅ Time fields added successfully!');
    
    // Show updated table structure
    const { data: tableInfo, error: infoError } = await supabase
      .from('activities')
      .select('*')
      .limit(1);
    
    if (!infoError && tableInfo.length > 0) {
      console.log('📋 Updated table structure:');
      console.log('Columns:', Object.keys(tableInfo[0]));
    }
    
  } catch (error) {
    console.error('❌ Error adding time fields:', error);
  }
}

async function testTimeFields() {
  try {
    console.log('Testing time fields...');
    
    // Test inserting with time fields
    const testActivity = {
      name: 'Test Activity with Time',
      date: '2025-01-15',
      start_time: '09:00:00',
      end_time: '11:00:00'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('activities')
      .insert([testActivity])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error testing time fields:', insertError);
      return false;
    }
    
    console.log('✅ Time fields test successful!');
    console.log('Sample data:', insertData);
    
    // Clean up test data
    if (insertData && insertData.id) {
      await supabase
        .from('activities')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Time fields test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Adding time fields to activities table...');
  
  // Add time fields
  await addTimeFields();
  
  // Test the new fields
  const testPassed = await testTimeFields();
  
  if (testPassed) {
    console.log('🎉 Time fields setup completed successfully!');
  } else {
    console.log('⚠️  Time fields added but testing failed. Please check your configuration.');
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { addTimeFields, testTimeFields };
