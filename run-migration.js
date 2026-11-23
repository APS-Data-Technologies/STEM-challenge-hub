#!/usr/bin/env node
/**
 * Run Supabase migration 12_challenge_feedback.sql
 * Usage: node run-migration.js
 */

const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase', '12_challenge_feedback.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log('📝 Read migration file:', migrationPath);
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('⏳ Applying migration...\n');

// Extract the actual database URL from supabase URL to get Postgres connection
// Format: https://[PROJECT_ID].supabase.co
// We need to construct the postgres URL or use the Supabase API

// For this demo, we'll need to use the Supabase SQL editor or REST API
// Since we have anon key, we might not have permission to run DDL

// Alternative: try using Supabase's SQL REST endpoint if available
const projectId = supabaseUrl.split('.')[0].split('//')[1];
const databaseUrl = `postgresql://postgres:password@${projectId}.supabase.co:5432/postgres`;

console.log('Note: This script requires admin/service role access to Supabase.');
console.log('Please run the migration through:');
console.log('1. Supabase Dashboard (SQL Editor)');
console.log('2. psql CLI with VITE_SUPABASE_DB_PASSWORD');
console.log('3. Run via backend service role key\n');

console.log('SQL to apply:');
console.log('-'.repeat(60));
console.log(sql);
console.log('-'.repeat(60));
