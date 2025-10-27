/**
 * Database Migration Runner
 * Run this script to apply the voice_profiles table migration
 *
 * Usage: npx tsx scripts/runMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Reading migration file...');

  const migrationPath = join(__dirname, '../supabase/migrations/20250126_create_voice_profiles.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Running migration...\n');
  console.log(migrationSQL);
  console.log('\n---\n');

  // Note: This will not work with the regular Supabase client as it doesn't support arbitrary SQL execution
  // You need to run this SQL manually in the Supabase Dashboard SQL Editor

  console.log('⚠️  IMPORTANT: This script cannot automatically run the migration.');
  console.log('Please follow these steps to apply the migration:\n');
  console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Navigate to "SQL Editor" in the left sidebar');
  console.log('4. Click "New Query"');
  console.log('5. Copy and paste the SQL from the migration file above');
  console.log('6. Click "Run" to execute the migration\n');
  console.log('Alternatively, you can copy the SQL from:');
  console.log(`   ${migrationPath}\n`);
}

runMigration().catch(console.error);
