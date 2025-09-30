// Sample data seeding script
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const sampleActivities = [
  {
    name: '主日聚會',
    date: '2025-10-05'
  }
];

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    // Clear existing data
    console.log('Clearing existing activities...');
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (deleteError) {
      console.error('Error clearing activities:', deleteError);
      return;
    }
    
    // Insert sample data
    console.log('Inserting sample activities...');
    const { data, error } = await supabase
      .from('activities')
      .insert(sampleActivities)
      .select();
    
    if (error) {
      console.error('Error inserting sample data:', error);
      return;
    }
    
    console.log(`✅ Successfully inserted ${data.length} sample activities!`);
    
    // Display inserted data
    console.log('\n📋 Sample activities created:');
    data.forEach((activity, index) => {
      const date = new Date(activity.date);
      const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
      console.log(`${index + 1}. ${formattedDate} ${dayOfWeek} ${activity.name}`);
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

async function verifyData() {
  try {
    console.log('\nVerifying seeded data...');
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error verifying data:', error);
      return;
    }
    
    console.log(`✅ Found ${data.length} activities in database`);
    
    // Group by month
    const activitiesByMonth = {};
    data.forEach(activity => {
      const date = new Date(activity.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!activitiesByMonth[monthKey]) {
        activitiesByMonth[monthKey] = [];
      }
      activitiesByMonth[monthKey].push(activity);
    });
    
    console.log('\n📅 Activities by month:');
    Object.keys(activitiesByMonth).sort().forEach(month => {
      console.log(`${month}: ${activitiesByMonth[month].length} activities`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');
  
  await seedDatabase();
  await verifyData();
  
  console.log('\n🎉 Database seeding completed!');
  console.log('\nYou can now test the reminder system with sample data.');
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { seedDatabase, verifyData };
